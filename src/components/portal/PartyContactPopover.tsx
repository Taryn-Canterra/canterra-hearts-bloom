import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Building2, BellRing, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  party: any;
  dealId: string;
  taskLabel?: string;
  trigger?: React.ReactNode;
}

export const PartyContactPopover = ({ party, dealId, taskLabel, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"info" | "compose">("info");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (!party) return null;

  const requestStatusUpdate = async () => {
    if (!user) return;
    setSending(true);
    const text =
      `📌 Status update request for ${party.name} (${party.role})` +
      (taskLabel ? `\nTask: ${taskLabel}` : "") +
      `\n\nCould I get a quick status update on this when you have a moment? Thank you!`;

    // Post into the deal thread (visible to agent + client)
    const { error: msgErr } = await supabase
      .from("deal_messages")
      .insert({ deal_id: dealId, sender_id: user.id, body: text });

    // Notify the linked party user (if they have an account) AND the assigned agent
    const { data: dealRow } = await supabase
      .from("deals")
      .select("assigned_to, property_address, client_name")
      .eq("id", dealId)
      .maybeSingle();

    const recipients = new Set<string>();
    if (party.user_id) recipients.add(party.user_id);
    if (dealRow?.assigned_to) recipients.add(dealRow.assigned_to);

    if (recipients.size) {
      await supabase.from("notifications").insert(
        Array.from(recipients).map((uid) => ({
          user_id: uid,
          kind: "status_update_request",
          title: `Status update requested${taskLabel ? `: ${taskLabel}` : ""}`,
          body: `${dealRow?.client_name ?? "Client"} on ${dealRow?.property_address ?? "your deal"} asked for an update.`,
          link: `/dashboard/deals/${dealId}`,
          deal_id: dealId,
        })),
      );
    }

    setSending(false);
    if (msgErr) toast.error(msgErr.message);
    else {
      toast.success(`Update request sent to ${party.name}`);
      setOpen(false);
    }
  };

  const sendDirectMessage = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    const prefix = `💬 To ${party.name} (${party.role}):\n`;
    const { error } = await supabase
      .from("deal_messages")
      .insert({ deal_id: dealId, sender_id: user.id, body: prefix + body.trim() });

    if (party.user_id) {
      await supabase.from("notifications").insert({
        user_id: party.user_id,
        kind: "direct_message",
        title: `New message on your deal`,
        body: body.slice(0, 120),
        link: `/dashboard/deals/${dealId}`,
        deal_id: dealId,
      });
    }
    setSending(false);
    if (error) toast.error(error.message);
    else { toast.success("Message sent"); setBody(""); setMode("info"); setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setMode("info"); }}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button className="text-primary hover:underline font-medium">
            {party.name}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <p className="font-semibold">{party.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{party.role.replace(/_/g, " ")}</p>
          </div>
          {mode === "info" ? (
            <>
              <div className="space-y-1.5 text-sm">
                {party.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {party.company}
                  </div>
                )}
                {party.email && (
                  <a href={`mailto:${party.email}`} className="flex items-center gap-2 hover:text-primary">
                    <Mail className="h-3.5 w-3.5" /> {party.email}
                  </a>
                )}
                {party.phone && (
                  <a href={`tel:${party.phone}`} className="flex items-center gap-2 hover:text-primary">
                    <Phone className="h-3.5 w-3.5" /> {party.phone}
                  </a>
                )}
                {!party.company && !party.email && !party.phone && (
                  <p className="text-xs text-muted-foreground italic">No contact details on file.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setMode("compose")}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message
                </Button>
                <Button size="sm" onClick={requestStatusUpdate} disabled={sending}>
                  {sending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5 mr-1.5" />}
                  Request update
                </Button>
              </div>
            </>
          ) : (
            <>
              <Textarea
                rows={4}
                placeholder={`Write a message to ${party.name}…`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setMode("info")}>Back</Button>
                <Button size="sm" onClick={sendDirectMessage} disabled={sending || !body.trim()}>
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Posted to the deal thread; your agent will see it too.
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
