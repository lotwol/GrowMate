import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, rows, cols } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du analyserar ett foto av en odlingsyta (trädgård, pallkrage, växthus etc.) och identifierar tydliga zoner/bäddar.

Svara ENBART med ett JSON-objekt (ingen markdown):
{
  "zones": [
    {
      "name": "Beskrivande namn, t.ex. 'Vänster bädd' eller 'Krukrad'",
      "cells": [[rad, kolumn], ...] // vilka celler i ett ${rows}×${cols} rutnät som tillhör zonen (0-indexerat)
    }
  ]
}

Regler:
- Identifiera 2-6 zoner baserat på vad du ser
- Varje zon ska ha ett beskrivande namn på svenska
- Fördela cellerna logiskt baserat på var zonerna ligger i bilden
- Rutnätet har ${rows} rader (0-${rows - 1}) och ${cols} kolumner (0-${cols - 1})
- Försök placera zonerna ungefär där de syns i bilden`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analysera denna odlingsyta och identifiera zoner." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Parse error:", content);
      return new Response(JSON.stringify({ error: "Could not parse", zones: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
