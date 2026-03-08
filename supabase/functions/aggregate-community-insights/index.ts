import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getConfidenceLevel(count: number): string {
  if (count >= 50) return "stark";
  if (count >= 20) return "tillförlitlig";
  if (count >= 5) return "växande";
  return "tidig";
}

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

    // Fetch all swedish_crop_tips as baseline
    const { data: allTips } = await supabase
      .from("swedish_crop_tips")
      .select("crop_name, zone, sow_indoor_start, sow_outdoor_start, harvest_start, sow_indoor_end, sow_outdoor_end, harvest_end");

    const tipsMap = new Map<string, any>();
    for (const tip of allTips || []) {
      tipsMap.set(`${tip.crop_name.toLowerCase()}||${tip.zone}`, tip);
    }

    // Group by crop_name + zone
    const groups: Record<string, any[]> = {};
    for (const row of rows) {
      const key = `${row.crop_name}||${row.zone}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    let processed = 0;
    let new_insights = 0;
    let confidence_upgrades = 0;
    let deviations_found = 0;
    let baselines_confirmed = 0;

    for (const [key, entries] of Object.entries(groups)) {
      if (entries.length < 3) continue;

      const [crop_name, zone] = key.split("||");
      const sample_count = entries.length;

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

      const typical_sow_month_start = sowMonths.length ? Math.min(...sowMonths) : null;
      const typical_sow_month_end = sowMonths.length ? Math.max(...sowMonths) : null;
      const typical_harvest_month_start = harvestMonths.length ? Math.min(...harvestMonths) : null;
      const typical_harvest_month_end = harvestMonths.length ? Math.max(...harvestMonths) : null;

      const notes = entries
        .filter((e) => e.notes_public)
        .map((e) => e.notes_public)
        .slice(0, 5);

      const confidence_level = getConfidenceLevel(sample_count);

      // Baseline from swedish_crop_tips
      const baseline = tipsMap.get(`${crop_name.toLowerCase()}||${zone}`);
      const baseline_sow_start = baseline ? (baseline.sow_outdoor_start || baseline.sow_indoor_start) : null;
      const baseline_sow_end = baseline ? (baseline.sow_outdoor_end || baseline.sow_indoor_end) : null;
      const baseline_harvest_start = baseline?.harvest_start || null;
      const baseline_harvest_end = baseline?.harvest_end || null;

      let sow_deviation_weeks: number | null = null;
      let harvest_deviation_weeks: number | null = null;

      if (baseline_sow_start && typical_sow_month_start) {
        sow_deviation_weeks = +(Math.abs(typical_sow_month_start - baseline_sow_start) * 4.3).toFixed(1);
      }
      if (baseline_harvest_start && typical_harvest_month_start) {
        harvest_deviation_weeks = +(Math.abs(typical_harvest_month_start - baseline_harvest_start) * 4.3).toFixed(1);
      }

      // Fetch current row for comparison
      const { data: currentRows } = await supabase
        .from("community_insights")
        .select("*")
        .eq("crop_name", crop_name)
        .eq("zone", zone)
        .limit(1);

      const current = currentRows?.[0] || null;
      const isNew = !current;

      // Log events
      const logEntries: any[] = [];

      if (isNew) {
        logEntries.push({
          crop_name, zone, event_type: "new_insight",
          new_value: { sample_count, confidence_level },
          sample_count, confidence_level,
          deviation_description: `Ny insikt skapad för ${crop_name} i Zon ${zone} (${sample_count} odlare)`,
        });
        new_insights++;
      }

      if (current && current.confidence_level !== confidence_level) {
        const levels = ["tidig", "växande", "tillförlitlig", "stark"];
        if (levels.indexOf(confidence_level) > levels.indexOf(current.confidence_level || "tidig")) {
          logEntries.push({
            crop_name, zone, event_type: "confidence_upgrade",
            old_value: { confidence: current.confidence_level },
            new_value: { confidence: confidence_level },
            sample_count, confidence_level,
            deviation_description: `Konfidens uppgraderad från ${current.confidence_level} till ${confidence_level} för ${crop_name} i Zon ${zone}`,
          });
          confidence_upgrades++;
        }
      }

      if (sow_deviation_weeks !== null && sow_deviation_weeks > 2 && sample_count >= 5) {
        logEntries.push({
          crop_name, zone, event_type: "sow_deviation",
          old_value: { baseline_sow_start },
          new_value: { typical_sow_month_start },
          sample_count, confidence_level,
          deviation_description: `Community-data visar sådd ${typical_sow_month_start} vs baslinje ${baseline_sow_start} (${sow_deviation_weeks} veckor avvikelse) för ${crop_name} i Zon ${zone}`,
        });
        deviations_found++;
      }

      if (harvest_deviation_weeks !== null && harvest_deviation_weeks > 2 && sample_count >= 5) {
        logEntries.push({
          crop_name, zone, event_type: "harvest_deviation",
          old_value: { baseline_harvest_start },
          new_value: { typical_harvest_month_start },
          sample_count, confidence_level,
          deviation_description: `Community-data visar skörd ${typical_harvest_month_start} vs baslinje ${baseline_harvest_start} (${harvest_deviation_weeks} veckor avvikelse) för ${crop_name} i Zon ${zone}`,
        });
        deviations_found++;
      }

      if (
        sow_deviation_weeks !== null && sow_deviation_weeks < 1 &&
        harvest_deviation_weeks !== null && harvest_deviation_weeks < 1 &&
        sample_count >= 10
      ) {
        logEntries.push({
          crop_name, zone, event_type: "baseline_confirmed",
          sample_count, confidence_level,
          deviation_description: `Community-data bekräftar baslinjen för ${crop_name} i Zon ${zone} (${sample_count} odlare, avvikelse < 1 vecka)`,
        });
        baselines_confirmed++;
      }

      // Write log entries
      if (logEntries.length > 0) {
        const { error: logError } = await supabase
          .from("algorithm_learning_log")
          .insert(logEntries);
        if (logError) console.error("Log insert error:", logError);
      }

      // Upsert insight
      const { error: upsertError } = await supabase
        .from("community_insights")
        .upsert(
          {
            crop_name, zone, sample_count, avg_success_rating,
            typical_sow_month_start, typical_sow_month_end,
            typical_harvest_month_start, typical_harvest_month_end,
            common_notes: notes.length > 0 ? notes : null,
            confidence_level,
            baseline_sow_start, baseline_sow_end,
            baseline_harvest_start, baseline_harvest_end,
            sow_deviation_weeks, harvest_deviation_weeks,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "crop_name,zone" }
        );

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      } else {
        processed++;
      }
    }

    return new Response(
      JSON.stringify({
        processed,
        new_insights,
        confidence_upgrades,
        deviations_found,
        baselines_confirmed,
      }),
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
