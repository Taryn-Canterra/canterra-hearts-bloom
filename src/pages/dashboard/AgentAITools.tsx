import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy } from "lucide-react";

type Tool = "listing_description" | "email_drafter" | "showing_summary" | "social_caption";

export default function AgentAITools() {
  const [tab, setTab] = useState<Tool>("listing_description");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // Shared state
  const [variant, setVariant] = useState<string>("lifestyle");
  const [address, setAddress] = useState("");
  const [tags, setTags] = useState("");
  const [remarks, setRemarks] = useState("");
  const [price, setPrice] = useState("");
  const [acres, setAcres] = useState("");
  const [stalls, setStalls] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState("buyer");
  const [purpose, setPurpose] = useState("follow-up");
  const [agentName, setAgentName] = useState("");
  const [context, setContext] = useState("");
  const [feedback, setFeedback] = useState("");
  const [channel, setChannel] = useState("Instagram");

  const run = async () => {
    setLoading(true); setOutput("");
    let input: any = {};
    if (tab === "listing_description") {
      input = {
        address, tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        remarks, price: price ? Number(price) : undefined,
        acres: acres ? Number(acres) : undefined,
        stalls: stalls ? Number(stalls) : undefined,
      };
    } else if (tab === "email_drafter") {
      input = { recipient_name: recipientName, recipient_type: recipientType, purpose, agent_name: agentName, context };
    } else if (tab === "showing_summary") {
      input = { feedback };
    } else {
      input = {
        address, tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        price: price ? Number(price) : undefined,
        acres: acres ? Number(acres) : undefined,
        channel,
      };
    }

    const { data, error } = await supabase.functions.invoke("agent-ai-tool", {
      body: { tool: tab, variant, input },
    });
    setLoading(false);
    if (error) {
      const msg = (error as any)?.context?.body ? JSON.parse((error as any).context.body)?.error : error.message;
      toast.error(msg ?? "AI request failed");
      return;
    }
    setOutput(data?.content ?? "");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-forest flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">Canterra AI tools</h1>
            <p className="text-sm text-muted-foreground">Equine-domain-tuned writing assistants for agents.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Tool); setOutput(""); }}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
            <TabsTrigger value="listing_description">Listing description</TabsTrigger>
            <TabsTrigger value="email_drafter">Email drafter</TabsTrigger>
            <TabsTrigger value="showing_summary">Showing feedback</TabsTrigger>
            <TabsTrigger value="social_caption">Social caption</TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <TabsContent value="listing_description" className="space-y-3 m-0">
                <Select value={variant} onValueChange={setVariant}>
                  <SelectTrigger><SelectValue placeholder="Tone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="buyer-focused">Buyer-focused</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Property address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <Input placeholder="Acres" value={acres} onChange={(e) => setAcres(e.target.value)} />
                  <Input placeholder="Stalls" value={stalls} onChange={(e) => setStalls(e.target.value)} />
                </div>
                <Input placeholder="Tags (comma-separated): indoor arena, water rights, …" value={tags} onChange={(e) => setTags(e.target.value)} />
                <Textarea rows={4} placeholder="Raw remarks / agent notes (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </TabsContent>

              <TabsContent value="email_drafter" className="space-y-3 m-0">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Recipient name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="lender">Lender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Your name (signature)" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intro">Intro</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="price feedback">Price feedback</SelectItem>
                    <SelectItem value="offer summary">Offer summary</SelectItem>
                    <SelectItem value="showing recap">Showing recap</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea rows={4} placeholder="Context (any specifics about the situation)" value={context} onChange={(e) => setContext(e.target.value)} />
              </TabsContent>

              <TabsContent value="showing_summary" className="space-y-3 m-0">
                <Textarea rows={8} placeholder="Paste raw showing feedback from buyers' agents…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              </TabsContent>

              <TabsContent value="social_caption" className="space-y-3 m-0">
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <Input placeholder="Acres" value={acres} onChange={(e) => setAcres(e.target.value)} />
                </div>
                <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
              </TabsContent>

              <Button onClick={run} disabled={loading} size="lg" className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Generating…" : "Generate"}
              </Button>
            </CardContent>
          </Card>
        </Tabs>

        {output && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Output</CardTitle>
              <Button variant="ghost" size="sm" onClick={copy}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/40 p-4 rounded-lg border-l-2 border-accent">{output}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
