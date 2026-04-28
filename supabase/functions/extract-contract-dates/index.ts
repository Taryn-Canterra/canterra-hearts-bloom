// Extracts contract dates, financial terms, and parties from a signed contract PDF
// using Lovable AI Gateway (Gemini 2.5 Pro for reliable PDF + structured output).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    contract_date: { type: ["string", "null"], description: "ISO date YYYY-MM-DD" },
    earnest_money_due: { type: ["string", "null"] },
    earnest_money_amount: { type: ["number", "null"] },
    inspection_deadline: { type: ["string", "null"] },
    inspection_objection_deadline: { type: ["string", "null"] },
    appraisal_deadline: { type: ["string", "null"] },
    title_objection_deadline: { type: ["string", "null"] },
    financing_contingency_deadline: { type: ["string", "null"] },
    final_walkthrough_date: { type: ["string", "null"] },
    expected_close_date: { type: ["string", "null"], description: "Closing date" },
    possession_date: { type: ["string", "null"] },
    price: { type: ["number", "null"], description: "Purchase price" },
    loan_amount: { type: ["number", "null"] },
    client_name: { type: ["string", "null"], description: "Buyer if buy-side, seller if list-side" },
    counterparty_name: { type: ["string", "null"] },
    property_address: { type: ["string", "null"] },
    confidence_notes: { type: "string", description: "Brief notes about anything ambiguous or missing" },
  },
  required: ["confidence_notes"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { deal_id, document_id, storage_path } = await req.json();
    if (!deal_id || (!document_id && !storage_path)) {
      return json({ error: "deal_id and (document_id or storage_path) required" }, 400);
    }

    // Resolve storage path (RLS on deal_documents already restricts to agent's deals)
    let path = storage_path as string | undefined;
    if (!path && document_id) {
      const { data: doc, error: docErr } = await supabase
        .from("deal_documents")
        .select("storage_path, deal_id")
        .eq("id", document_id)
        .maybeSingle();
      if (docErr || !doc) return json({ error: "Document not found or access denied" }, 404);
      if (doc.deal_id !== deal_id) return json({ error: "Document does not belong to deal" }, 403);
      path = doc.storage_path;
    }

    // Download PDF
    const { data: file, error: dlErr } = await supabase.storage.from("deal-documents").download(path!);
    if (dlErr || !file) return json({ error: `Download failed: ${dlErr?.message}` }, 500);

    const buf = new Uint8Array(await file.arrayBuffer());
    // base64 encode in chunks to avoid stack overflow
    let binary = "";
    const chunk = 32768;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const b64 = btoa(binary);

    // Call Lovable AI Gateway with PDF input
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "You extract structured data from real estate purchase/listing contracts (Colorado CTM/CTME standard). Return ONLY a JSON object matching the provided schema. Use null for fields not found. Dates must be ISO YYYY-MM-DD. Money amounts must be numbers (no $ or commas). Do not guess.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the contract metadata. Use null for anything that is not explicitly stated." },
              { type: "file", file: { filename: "contract.pdf", file_data: `data:application/pdf;base64,${b64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_extraction",
              description: "Submit extracted contract data",
              parameters: EXTRACTION_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_extraction" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) return json({ error: "Rate limit hit. Try again in a moment." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }, 402);
      return json({ error: `AI error: ${txt}` }, 500);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "AI did not return structured data", raw: aiData }, 500);
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    return json({ extracted });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
