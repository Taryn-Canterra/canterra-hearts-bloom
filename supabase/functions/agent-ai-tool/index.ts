// Canterra AI assistant — equine-domain tuned writing tools for agents.
// Tools: listing_description, email_drafter, showing_summary, social_caption.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Canterra AI, an assistant built for equine real estate professionals.
Your users are horse property specialists – agents, buyers, sellers, and ranch owners. You have deep knowledge of:
- Horse facility terminology: arenas (indoor/outdoor/covered), stall types, barn configurations (shed row, center aisle, mare motel, loafing shed), footing materials, fencing (board, pipe, no-climb, hot wire, barbed), water systems (wells, irrigation ditches, pivot, flood), hay production
- Colorado real estate law: water rights (priority doctrine, adjudicated vs. unadjudicated), agricultural zoning, conservation easements, 1031 exchange
- CPW regulations: Game Management Units, Ranching for Wildlife, LPP
- Equine property valuation: arena quality adds value, stall count affects price, irrigated acres are priced separately from dry acreage
Use terms like "pasture rotation", "turnout", "loafing shed", "mountain water rights" naturally.
Always write in an authentic, warm, western-professional voice. Never sound like a generic AI writing about generic real estate.`;

interface Body {
  tool: "listing_description" | "email_drafter" | "showing_summary" | "social_caption";
  variant?: string; // tool-specific (e.g. "buyer-focused" | "lifestyle" | "investment" | "concise")
  input: Record<string, unknown>;
}

function buildUserPrompt(body: Body): string {
  switch (body.tool) {
    case "listing_description": {
      const i = body.input as { address?: string; tags?: string[]; remarks?: string; price?: number; acres?: number; stalls?: number };
      return `Write a polished MLS listing description (${body.variant ?? "lifestyle"} tone, 120-180 words) for this horse property.
Address: ${i.address ?? "Colorado horse property"}
Price: ${i.price ? `$${i.price.toLocaleString()}` : "TBD"}
Acres: ${i.acres ?? "?"}
Stalls: ${i.stalls ?? "?"}
AI-tagged features: ${(i.tags ?? []).join(", ") || "n/a"}
Existing remarks (raw): ${i.remarks ?? "(none)"}

Lead with the most compelling equine feature. Mention water/irrigation if present. End with a single inviting sentence. No bullet points. No hashtags.`;
    }
    case "email_drafter": {
      const i = body.input as { recipient_type?: string; purpose?: string; recipient_name?: string; agent_name?: string; context?: string };
      return `Draft an email in the agent's voice. Keep it warm, direct, and 80-140 words.
Recipient: ${i.recipient_name ?? "the recipient"} (${i.recipient_type ?? "buyer"})
Agent: ${i.agent_name ?? "the agent"}
Purpose: ${i.purpose ?? "follow-up"}
Context: ${i.context ?? "(none)"}

Format: Subject line on first line as "Subject: ...", blank line, then body. Sign with "Best, ${i.agent_name ?? "[Agent]"}".`;
    }
    case "showing_summary": {
      const i = body.input as { feedback?: string };
      return `Summarize this raw showing feedback into three sections:
1. **Top objections** (bullet list, max 5)
2. **Price sentiment** (1-2 sentences: too high / fair / under-priced)
3. **Demand signal** (1-2 sentences: hot / lukewarm / cold)

Raw feedback:
${i.feedback ?? "(no feedback provided)"}`;
    }
    case "social_caption": {
      const i = body.input as { tags?: string[]; price?: number; address?: string; acres?: number; channel?: string };
      return `Write a ${i.channel ?? "Instagram"} caption (max 70 words) for this Colorado horse property listing.
Address: ${i.address ?? "—"}
Price: ${i.price ? `$${i.price.toLocaleString()}` : "—"}
Acres: ${i.acres ?? "—"}
Features: ${(i.tags ?? []).join(", ") || "—"}
End with 6-8 relevant hashtags targeted at the equestrian audience (mix of broad and niche). Include 1-2 emojis tastefully.`;
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.tool || !body.input) {
      return new Response(JSON.stringify({ error: "tool and input required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
          { role: "user", content: buildUserPrompt(body) },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-ai-tool error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
