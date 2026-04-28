// Generates a structured AI "property intelligence" one-pager for a property.
// Caches the latest report in property_intelligence_reports.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Canterra AI, an equine real-estate analyst.
You produce concise, honest one-page intelligence briefings for buyers evaluating Colorado horse properties.
Be direct: name strengths AND watchouts. Use horseman vocabulary (turnout, footing, irrigated acres, fencing types, water rights).
Always return strict JSON matching the requested schema. No prose outside JSON.`;

interface Body {
  property_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.property_id) {
      return new Response(JSON.stringify({ error: "property_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: prop } = await admin
      .from("properties")
      .select("*")
      .eq("id", body.property_id)
      .maybeSingle();
    if (!prop) {
      return new Response(JSON.stringify({ error: "Property not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Property briefing for a buyer.
Address: ${prop.address ?? "Unknown"}, ${prop.city ?? ""} ${prop.state ?? "CO"} ${prop.zip ?? ""}
Price: ${prop.price ? `$${Number(prop.price).toLocaleString()}` : "—"}
Acres: ${prop.acres ?? "—"} | Beds: ${prop.beds ?? "—"} | Baths: ${prop.baths ?? "—"} | Sqft: ${prop.sqft ?? "—"}
Stalls: ${prop.stalls ?? "—"} | Paddocks: ${prop.paddocks ?? "—"}
County: ${prop.county ?? "—"} | DOM: ${prop.days_on_market ?? "—"}
AI tags: ${(prop.ai_tags ?? []).join(", ") || "—"}
Equine features: ${(prop.equine_features ?? []).join(", ") || "—"}
MLS remarks: ${(prop.description ?? "").slice(0, 1500)}

Return strict JSON of shape:
{
  "summary": "2-3 sentence executive summary",
  "highlights": ["3-6 short bullet strings calling out the best aspects"],
  "watchouts": ["2-5 short bullet strings flagging risks, missing data, or red flags"],
  "questions_to_ask": ["4-6 sharp questions the buyer should ask the listing agent or during due diligence"]
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      console.error("AI gateway error", resp.status, await resp.text());
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      parsed = { summary: content, highlights: [], watchouts: [], questions_to_ask: [] };
    }

    const insert = {
      property_id: body.property_id,
      summary: String(parsed.summary ?? "").slice(0, 4000),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      watchouts: Array.isArray(parsed.watchouts) ? parsed.watchouts : [],
      questions_to_ask: Array.isArray(parsed.questions_to_ask) ? parsed.questions_to_ask : [],
      model: "google/gemini-2.5-flash",
      generated_by: userId,
    };

    const { data: saved, error: saveErr } = await admin
      .from("property_intelligence_reports")
      .insert(insert)
      .select()
      .single();

    if (saveErr) {
      console.error("save error", saveErr);
      return new Response(JSON.stringify({ ...insert, _saveError: saveErr.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("property-intelligence error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
