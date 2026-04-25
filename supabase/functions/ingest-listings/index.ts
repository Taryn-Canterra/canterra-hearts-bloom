// Accepts a batch of normalized listings, upserts into properties,
// and fires off analyze-listing for each new/updated row.
// This is the seam where Trestle (or any IDX feed) plugs in.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IncomingListing {
  mls_number?: string;
  source?: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  acres?: number;
  property_type?: string;
  status?: string;
  days_on_market?: number;
  photos?: string[];
  primary_photo?: string;
  listing_agent_name?: string;
  listing_agent_phone?: string;
  listing_agent_email?: string;
  brokerage_name?: string;
  raw_payload?: unknown;
}

interface IngestRequest {
  listings: IncomingListing[];
  // If true, re-analyze even if previously analyzed
  force_reanalyze?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: IngestRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.listings) || body.listings.length === 0) {
    return json({ error: "listings array required" }, 400);
  }

  // Upsert by mls_number when present, otherwise insert as new
  const rows = body.listings.map((l) => ({
    ...l,
    source: l.source ?? "manual",
    photos: l.photos ?? [],
    primary_photo: l.primary_photo ?? l.photos?.[0] ?? null,
    state: l.state ?? "CO",
    analysis_status: "pending" as const,
  }));

  const upsertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?on_conflict=mls_number`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    },
  );

  if (!upsertRes.ok) {
    const err = await upsertRes.text();
    return json({ error: `Upsert failed: ${err}` }, 500);
  }

  const inserted: Array<{ id: string; analysis_status: string }> =
    await upsertRes.json();

  // Fire off analysis (don't await — fan out)
  const toAnalyze = body.force_reanalyze
    ? inserted
    : inserted.filter((r) => r.analysis_status !== "analyzed");

  const analyzeUrl = `${SUPABASE_URL}/functions/v1/analyze-listing`;
  const fanout = toAnalyze.map((r) =>
    fetch(analyzeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property_id: r.id }),
    }).catch((e) => console.error(`Failed to queue ${r.id}:`, e)),
  );

  // Wait but don't fail the request if analysis fails
  await Promise.allSettled(fanout);

  return json({
    ok: true,
    ingested: inserted.length,
    queued_for_analysis: toAnalyze.length,
  });

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
