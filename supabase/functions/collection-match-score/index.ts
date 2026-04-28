// Scores collection items 0-100 vs a saved-search criteria object.
// Writes match_score / match_reasoning back onto collection_items rows.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  collection_id: string;
  saved_search_id?: string;       // optional explicit search to score against
  criteria_override?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are an equine real-estate matching engine. Given a buyer's criteria
and a property, return a JSON object: { "score": 0-100, "reason": "1 sentence" }.
Score reflects fit. Penalize missing must-haves heavily; reward strong feature matches.
Return only strict JSON, no prose.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.collection_id) {
      return new Response(JSON.stringify({ error: "collection_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Resolve criteria
    let criteria: Record<string, unknown> = body.criteria_override ?? {};
    if (body.saved_search_id) {
      const { data: ss } = await admin
        .from("user_saved_searches")
        .select("filters")
        .eq("id", body.saved_search_id)
        .maybeSingle();
      criteria = (ss?.filters as Record<string, unknown>) ?? criteria;
    }

    // Get items + properties
    const { data: items } = await admin
      .from("collection_items")
      .select("id, property_id")
      .eq("collection_id", body.collection_id);

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ scored: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyIds = items.map((i) => i.property_id);
    const { data: properties } = await admin
      .from("properties")
      .select("id, address, city, county, price, beds, baths, sqft, acres, stalls, paddocks, ai_tags, equine_features, description")
      .in("id", propertyIds);

    const propMap = new Map((properties ?? []).map((p) => [p.id, p]));
    let scored = 0;

    for (const item of items) {
      const prop = propMap.get(item.property_id);
      if (!prop) continue;

      const userPrompt = `Buyer criteria (JSON): ${JSON.stringify(criteria)}
Property:
${JSON.stringify({
  address: prop.address, city: prop.city, county: prop.county,
  price: prop.price, beds: prop.beds, baths: prop.baths, sqft: prop.sqft,
  acres: prop.acres, stalls: prop.stalls, paddocks: prop.paddocks,
  features: prop.equine_features, ai_tags: prop.ai_tags,
  remarks_excerpt: (prop.description ?? "").slice(0, 600),
})}

Return: { "score": <0-100 integer>, "reason": "<one sentence>" }`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429 || resp.status === 402) {
          return new Response(
            JSON.stringify({ error: resp.status === 429 ? "Rate limit" : "Credits exhausted", scored }),
            { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        continue;
      }

      const data = await resp.json();
      let parsed: { score?: number; reason?: string } = {};
      try { parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}"); } catch {}
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      const reason = String(parsed.reason ?? "").slice(0, 500);

      await admin
        .from("collection_items")
        .update({
          match_score: score,
          match_reasoning: reason,
          match_against_search: body.saved_search_id ?? null,
          match_generated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      scored++;
    }

    return new Response(JSON.stringify({ scored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("collection-match-score error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
