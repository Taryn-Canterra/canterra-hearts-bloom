import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SaveVendorButton = ({
  vendorId,
  variant = "outline",
  size = "sm",
  className,
}: {
  vendorId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "icon";
  className?: string;
}) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_saved_vendors")
      .select("id")
      .eq("user_id", user.id)
      .eq("vendor_id", vendorId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, vendorId]);

  if (!user) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link to="/auth"><Heart className="h-4 w-4 mr-1.5" /> Sign in to save</Link>
      </Button>
    );
  }

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    if (saved) {
      await supabase.from("user_saved_vendors").delete().eq("user_id", user.id).eq("vendor_id", vendorId);
      setSaved(false);
      toast.success("Removed from your saved vendors");
    } else {
      const { error } = await supabase.from("user_saved_vendors").insert({ user_id: user.id, vendor_id: vendorId });
      if (error) toast.error(error.message); else { setSaved(true); toast.success("Saved to your vendors"); }
    }
    setBusy(false);
  };

  return (
    <Button onClick={toggle} variant={variant} size={size} className={className} disabled={busy}>
      <Heart className={cn("h-4 w-4 mr-1.5", saved && "fill-accent text-accent")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
};
