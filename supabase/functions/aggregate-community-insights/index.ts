import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all community data
    const { data: rows, error } = await supabase
      .from("community_growing_data")
      .select("*");

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ message: "No data to aggregate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by crop_name + zone
    const groups: Record<string, any[]> = {};
    for (const row of rows) {
      const key = `${row.crop_name}||${row.zone}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    let upserted = 0;
    for (const [key, entries] of Object.entries(groups)) {
      if (entries.length < 3) continue;

      const [crop_name, zone] = key.split("||");

      const ratings = entries.filter((e) => e.success_rating != null).map((e) => e.success_rating);
      const avg_success_rating = ratings.length > 0
        ? +(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2)
        : null;

      const sowMonths = entries
        .filter((e) => e.sow_date)
        .map((e) => new Date(e.sow_date).getMonth() + 1);
      const harvestMonths = entries
        .filter((e) => e.harvest_date)
        .map((e) => new Date(e.harvest_date).getMonth() + 1);

      const notes = entries
        .filter((e) => e.notes_public)
        .map((e) => e.notes_public)
        .slice(0, 5);

      const { error: upsertError } = await supabase
        .from("community_insights")
        .upsert(
          {
            crop_name,
            zone,
            sample_count: entries.length,
            avg_success_rating,
            typical_sow_month_start: sowMonths.length ? Math.min(...sowMonths) : null,
            typical_sow_month_end: sowMonths.length ? Math.max(...sowMonths) : null,
            typical_harvest_month_start: harvestMonths.length ? Math.min(...harvestMonths) : null,
            typical_harvest_month_end: harvestMonths.length ? Math.max(...harvestMonths) : null,
            common_notes: notes.length > 0 ? notes : null,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "crop_name,zone" }
        );

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      } else {
        upserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, insights_updated: upserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Aggregation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
