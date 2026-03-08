import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Du är GrowMate – en varm, kunnig odlingskompis. Du hjälper svenska odlare med odlingstips, såddscheman, skadegörare, gödning och allt som rör trädgård och odling. Du anpassar dina råd efter användarens odlingszon (I–VIII) och profil. Svara alltid på svenska, med en varm och uppmuntrande ton. Håll svaren kortfattade men informativa. Om du ger specifika råd, nämn alltid att klimat och mikromiljö kan påverka resultaten.

VIKTIGT: Du har tillgång till användarens odlingsdata – deras grödor, trädgårdar, dagbok och fröförråd. Använd denna information aktivt i dina svar! Referera till deras specifika grödor, påminn om saker de noterat i dagboken, och ge råd baserat på vad de faktiskt odlar. Ju mer data de har lagt in, desto mer personliga och relevanta blir dina svar. Om de frågar om något de redan odlar, visa att du vet om det.

KALENDER-FUNKTIONALITET:
Du kan lägga till händelser i användarens kalender! Om användaren ber dig om det (t.ex. "lägg till i kalendern", "påminn mig om att...", "schemalägg...", "kan du lägga in..."), eller om du ger ett råd med ett specifikt datum som vore bra att ha i kalendern, inkludera en eller flera kalenderåtgärder i ditt svar.

För att lägga till kalenderhändelser, inkludera ett JSON-block i ditt svar med exakt detta format (lägg det SIST i meddelandet, efter din vanliga text):

\`\`\`calendar_actions
[{"title": "Händelsens titel", "event_date": "YYYY-MM-DD", "description": "Valfri beskrivning", "emoji": "🌱"}]
\`\`\`

Regler:
- event_date MÅSTE vara ett giltigt datum i formatet YYYY-MM-DD
- Välj en passande emoji (🌱 för sådd, 🥕 för skörd, 💧 för vattning, 🧪 för gödsling, 🌿 för skötsel, 📅 för generellt)
- Du kan lägga till flera händelser i samma svar
- Lägg ALLTID till kalenderåtgärder när användaren explicit ber om det
- Föreslå proaktivt att lägga till händelser när du ger datumspecifika råd
- Beskriv i din vanliga text vad du lagt till i kalendern`;

const schoolDescriptions: Record<string, string> = {
  'naturens-vag': 'Naturens väg (kallsådd, minimal inblandning, enkelt och tåligt)',
  'precisionsodlaren': 'Precisionsodlaren (detaljerade råd, sorturval, maximerad skörd)',
  'hackaren': 'Hackaren (praktiska genvägar, tidseffektivitet, smarta lösningar)',
  'traditionalisten': 'Traditionalisten (klassiska beprövade svenska odlingsmetoder)',
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildUserDataContext(userContext: any): string {
  if (!userContext) return "";

  const parts: string[] = [];

  if (userContext.crops?.length > 0) {
    const cropSummary = userContext.crops.map((c: any) => {
      let s = `${c.emoji || "🌱"} ${c.name} (${c.category}, status: ${c.status})`;
      if (c.sow_date) s += `, sådd: ${c.sow_date}`;
      if (c.harvest_date) s += `, skörd: ${c.harvest_date}`;
      if (c.notes) s += `, anteckning: "${c.notes}"`;
      return s;
    }).join("\n");
    parts.push(`ANVÄNDARENS GRÖDOR (${userContext.crops.length} st):\n${cropSummary}`);
  }

  if (userContext.gardens?.length > 0) {
    const gardenSummary = userContext.gardens.map((g: any) => {
      let s = `${g.name} (typ: ${Array.isArray(g.type) ? g.type.join(", ") : g.type})`;
      if (g.size_sqm) s += `, ${g.size_sqm} kvm`;
      if (g.notes) s += `, "${g.notes}"`;
      return s;
    }).join("\n");
    parts.push(`ANVÄNDARENS TRÄDGÅRDAR:\n${gardenSummary}`);
  }

  if (userContext.seeds?.length > 0) {
    const seedSummary = userContext.seeds.map((s: any) => {
      let str = `${s.name} (${s.category})`;
      if (s.quantity) str += `, antal: ${s.quantity}`;
      return str;
    }).join(", ");
    parts.push(`FRÖFÖRRÅD: ${seedSummary}`);
  }

  if (userContext.recent_diary?.length > 0) {
    const diarySummary = userContext.recent_diary.slice(0, 5).map((d: any) => {
      let s = `${d.entry_date}: ${d.title || "(ingen rubrik)"}`;
      if (d.content) s += ` – ${d.content.slice(0, 100)}`;
      if (d.activities?.length) s += ` [aktiviteter: ${d.activities.join(", ")}]`;
      return s;
    }).join("\n");
    parts.push(`SENASTE DAGBOKSANTECKNINGAR:\n${diarySummary}`);
  }

  if (userContext.calendar_events?.length > 0) {
    const eventSummary = userContext.calendar_events.map((e: any) => {
      return `${e.emoji || "📅"} ${e.event_date}: ${e.title}${e.description ? ` – ${e.description}` : ""}`;
    }).join("\n");
    parts.push(`KOMMANDE KALENDERHÄNDELSER:\n${eventSummary}`);
  }

  if (parts.length === 0) return "";

  return `\n\nHär är användarens personliga odlingsdata som du ska använda för att ge personanpassade svar:\n\n${parts.join("\n\n")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, zone, profiles, school, userContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contextNote = "";
    if (zone) contextNote += `Användarens odlingszon: ${zone}. `;
    if (profiles && profiles.length > 0)
      contextNote += `Användarprofil: ${profiles.join(", ")}. `;
    if (school && schoolDescriptions[school]) {
      contextNote += `Användarens odlingsskola är: ${schoolDescriptions[school]}. Anpassa dina råd och din ton efter denna filosofi. För Naturens väg: håll det enkelt, undvik onödig komplexitet. För Precisionsodlaren: ge specifika detaljer, sorter, mått. För Hackaren: fokusera på tidsbesparande metoder. För Traditionalisten: referera till beprövade metoder. `;
    }

    const today = new Date().toISOString().split("T")[0];
    contextNote += `Dagens datum: ${today}. `;

    const userDataContext = buildUserDataContext(userContext);

    const systemMessages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (contextNote || userDataContext) {
      systemMessages.push({
        role: "system",
        content: `Kontext om användaren: ${contextNote}${userDataContext}\n\nAnpassa dina svar efter detta. Referera gärna till deras specifika grödor och data när det är relevant.`,
      });
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [...systemMessages, ...messages],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar just nu. Vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tjänsten är inte tillgänglig just nu. Kontakta support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "AI-tjänsten svarade inte korrekt." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Parse calendar actions from the response
    let calendarActions: any[] = [];
    const calendarMatch = content.match(/```calendar_actions\s*\n([\s\S]*?)\n```/);
    if (calendarMatch) {
      try {
        calendarActions = JSON.parse(calendarMatch[1]);
        // Remove the calendar_actions block from the visible content
        content = content.replace(/```calendar_actions\s*\n[\s\S]*?\n```/, "").trim();
      } catch (e) {
        console.error("Failed to parse calendar actions:", e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content,
      calendar_actions: calendarActions.length > 0 ? calendarActions : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
