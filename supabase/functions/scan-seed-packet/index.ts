import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Du är en expert på att läsa fröpåsar och extrahera information. Analysera bilderna av fröpåsen och extrahera så mycket info som möjligt.

Svara ENBART med ett JSON-objekt (ingen markdown, inga codeblocks) med denna struktur:
{
  "name": "Sortnamn, t.ex. 'Tomat San Marzano'",
  "category": "en av: grönsak, ört, frukt, bär, blomma",
  "quantity": "mängd/vikt om det syns, t.ex. '2g' eller '50 frön'",
  "best_before": "bäst-före-datum i YYYY-MM-DD format om det syns, annars null",
  "purchased_from": "tillverkare/varumärke om det syns, t.ex. 'Nelson Garden'",
  "cost": null,
  "sow_indoor": "beskrivning av förkultivering om det syns, t.ex. 'Feb-Mar inomhus'",
  "sow_outdoor": "beskrivning av direktsådd om det syns, t.ex. 'Maj-Jun'",
  "harvest_time": "skördetid om det syns",
  "spacing": "plantavstånd om det syns",
  "notes": "övrig info från påsen som kan vara användbar, t.ex. odlingstips, jordtyp, solbehov"
}

Om du inte kan läsa eller hitta viss information, sätt värdet till null.
Försök alltid ge "name" och "category" — gissa baserat på bilden om texten inte är tydlig.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const imageContent = images.map((img: string) => ({
      type: "image_url" as const,
      image_url: { url: img },
    }));

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analysera denna fröpåse och extrahera all information du kan hitta." },
              ...imageContent,
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Could not parse seed info", raw: content }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
