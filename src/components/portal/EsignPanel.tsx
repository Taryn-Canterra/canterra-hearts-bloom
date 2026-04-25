import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileSignature } from "lucide-react";

export const EsignPanel = ({ deal }: { deal: any }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("deal_esign_requests")
        .select("*")
        .eq("deal_id", deal.id)
        .order("sent_at", { ascending: false });
      if (active) setItems(data ?? []);
    })();
    return () => { active = false; };
  }, [deal.id]);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSignature className="h-4 w-4" /> Documents to sign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{e.document_name}</p>
              <p className="text-xs text-muted-foreground">
                Sent {new Date(e.sent_at).toLocaleDateString()}
                {e.external_provider && ` · via ${e.external_provider}`}
              </p>
            </div>
            <Badge variant={e.status === "signed" ? "default" : e.status === "declined" ? "destructive" : "secondary"}>
              {e.status}
            </Badge>
            {e.signing_url && e.status !== "signed" && (
              <Button size="sm" variant="outline" asChild>
                <a href={e.signing_url} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
