// Multimodal AI classifier for MLS listings.
// Tuned for HIGH RECALL — flags anything plausibly equine, including raw
// acreage with horse potential. We'd rather show a borderline property than
// hide a real one.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert equestrian real estate analyst for Canterra, a Colorado horse-property search engine.

Your job: decide if a listing is suitable for horses, and extract structured equine features.

CALIBRATION — high recall, inclusive:
- A property IS equine if it has ANY of: existing horse infrastructure (barn, stalls, arena, round pen, paddocks, wash rack, tack room), OR is described as "horse property" / "equestrian" / "ranch", OR has 5+ acres of usable land with zoning that allows horses (most rural/agricultural CO parcels), OR has clear potential for horses even if no infrastructure exists yet.
- A property is NOT equine if it is: a townhome, condo, urban single-family lot under ~2 acres, commercial-only, or explicitly prohibits livestock (HOA/covenants).
- When in doubt, lean toward INCLUDING the property. Set lower confidence rather than excluding.

For confidence:
- 0.9-1.0: Turnkey horse property with clear infrastructure visible/described.
- 0.6-0.89: Likely equine — acreage + partial infrastructure OR explicit horse zoning.
- 0.3-0.59: Possible equine — raw land with potential, hobby farm, or ambiguous.
- 0.0-0.29: Almost certainly not equine.

Extract features ONLY from explicit evidence in the description or visible in photos. Do not hallucinate.`;

const FEATURE_ENUM = [
  "indoor_arena",
  "outdoor_arena",
  "round_pen",
  "wash_rack",
  "tack_room",
  "hay_storage",
  "foaling_stall",
  "auto_waterers",
  "loafing_shed",
  "irrigation",
  "fenced_pasture",
  "trail_access",
];

const TOOL = {
  type: "function",
  function: {
    name: "classify_listing",
    description: "Return the equine classification verdict and extracted features.",
    parameters: {
      type: "object",
      properties: {
        is_equine: {
          type: "boolean",
          description: "True if the property is suitable for horses (use high-recall criteria).",
        },
        confidence: {
          type: "number",
          description: "0.0 to 1.0 confidence in the is_equine verdict.",
        },
        reasoning: {
          type: "string",
          description: "1-2 sentence explanation of the verdict, citing specific evidence.",
        },
        equine_features: {
          type: "array",
          items: { type: "string", enum: FEATURE_ENUM },
          description: "Equine features explicitly evidenced in description or photos.",
        },
        ai_tags: {
          type: "array",
          items: { type: "string" },
          description: "3-5 short human-readable tags for display (e.g., '6 stalls detected', 'Indoor arena', 'Pipe fencing').",
        },
        stalls: {
          type: "integer",
          description: "Number of stalls detected. 0 if none.",
        },
        paddocks: {
          type: "integer",
          description: "Number of paddocks/pastures detected. 0 if none.",
        },
      },
      required: [
        "is_equine",
        "confidence",
        "reasoning",
        "equine_features",
        "ai_tags",
        "stalls",
        "paddocks",
      ],
      additionalProperties: false,
    },
  },
};

interface AnalyzeRequest {
  property_id: string;
}

interface ListingForAnalysis {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  county: string | null;
  acres: number | null;
  property_type: string | null;
  photos: string[];
  primary_photo: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return json({ error: "LOVABLE_API_KEY not configured" }, 500);
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.property_id) {
    return json({ error: "property_id required" }, 400);
  }

  // Fetch the property
  const propRes = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${body.property_id}&select=id,title,description,city,county,acres,property_type,photos,primary_photo`,
    {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
    },
  );
  const properties: ListingForAnalysis[] = await propRes.json();
  const property = properties[0];
  if (!property) {
    return json({ error: "Property not found" }, 404);
  }

  // Mark analyzing
  await patchProperty(body.property_id, { analysis_status: "analyzing" });

  // Build multimodal user message
  const userContent: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `Listing to classify:
Title: ${property.title ?? "(none)"}
Location: ${[property.city, property.county, "CO"].filter(Boolean).join(", ")}
Acres: ${property.acres ?? "(unknown)"}
Property type: ${property.property_type ?? "(unknown)"}

Description:
${property.description ?? "(no description provided)"}`,
    },
  ];

  // Limit to first 4 photos to control cost/latency
  const photos = (property.photos ?? []).slice(0, 4);
  for (const url of photos) {
    if (typeof url === "string" && url.startsWith("http")) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
  }

  const model = "google/gemini-2.5-flash";
  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "classify_listing" } },
      }),
    });
  } catch (e) {
    await recordFailure(body.property_id, model, Date.now() - startedAt, String(e));
    return json({ error: "AI gateway unreachable" }, 502);
  }

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    await recordFailure(body.property_id, model, Date.now() - startedAt, `${aiResponse.status}: ${errText}`);
    if (aiResponse.status === 429) {
      return json({ error: "Rate limited, try again later" }, 429);
    }
    if (aiResponse.status === 402) {
      return json({ error: "AI credits exhausted — add funds in Lovable AI workspace" }, 402);
    }
    return json({ error: `AI error: ${aiResponse.status}` }, 500);
  }

  const aiJson = await aiResponse.json();
  const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    await recordFailure(body.property_id, model, Date.now() - startedAt, "No tool call in response");
    return json({ error: "AI did not return structured verdict" }, 500);
  }

  let verdict: {
    is_equine: boolean;
    confidence: number;
    reasoning: string;
    equine_features: string[];
    ai_tags: string[];
    stalls: number;
    paddocks: number;
  };
  try {
    verdict = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    await recordFailure(body.property_id, model, Date.now() - startedAt, `Bad JSON: ${e}`);
    return json({ error: "Invalid AI response" }, 500);
  }

  await patchProperty(body.property_id, {
    analysis_status: "analyzed",
    is_equine: verdict.is_equine,
    equine_confidence: verdict.confidence,
    equine_reasoning: verdict.reasoning,
    equine_features: verdict.equine_features,
    ai_tags: verdict.ai_tags,
    stalls: verdict.stalls,
    paddocks: verdict.paddocks,
    analyzed_at: new Date().toISOString(),
  });

  await recordRun(body.property_id, model, true, Date.now() - startedAt, null, aiJson);

  return json({ ok: true, verdict });

  // ---------- helpers ----------
  async function patchProperty(id: string, fields: Record<string, unknown>) {
    await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(fields),
    });
  }

  async function recordRun(
    propertyId: string,
    modelName: string,
    success: boolean,
    latencyMs: number,
    errorMessage: string | null,
    raw: unknown,
  ) {
    await fetch(`${SUPABASE_URL}/rest/v1/listing_analysis_runs`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        property_id: propertyId,
        model: modelName,
        success,
        latency_ms: latencyMs,
        error_message: errorMessage,
        raw_response: raw,
      }),
    });
  }

  async function recordFailure(id: string, modelName: string, latencyMs: number, msg: string) {
    await patchProperty(id, { analysis_status: "failed" });
    await recordRun(id, modelName, false, latencyMs, msg, null);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
