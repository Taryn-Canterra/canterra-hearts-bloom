import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});

export const ReviewForm = ({ vendorId, onSubmitted }: { vendorId: string; onSubmitted?: () => void }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [existing, setExisting] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("vendor_reviews")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("reviewer_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setExisting(data); setRating(data.rating); setBody(data.body ?? ""); }
      });
  }, [user, vendorId]);

  if (!user) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground flex items-center justify-between gap-3 flex-wrap">
          <span>Sign in to leave a review.</span>
          <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    const parsed = reviewSchema.safeParse({ rating, body: body.trim() || undefined });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid review"); return; }
    setBusy(true);
    if (existing) {
      const { error } = await supabase
        .from("vendor_reviews")
        .update({ rating, body: body.trim() || null })
        .eq("id", existing.id);
      if (error) toast.error(error.message); else toast.success("Review updated");
    } else {
      const { error } = await supabase.from("vendor_reviews").insert({
        vendor_id: vendorId,
        reviewer_id: user.id,
        reviewer_user_id: user.id,
        rating,
        body: body.trim() || null,
      });
      if (error) toast.error(error.message); else { toast.success("Thanks for your review!"); setExisting({ rating, body }); }
    }
    setBusy(false);
    onSubmitted?.();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium">{existing ? "Edit your review" : "Rate this vendor"}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  (hover || rating) >= n ? "fill-accent text-accent" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Share details about your experience (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={busy || rating === 0} size="sm">
            {existing ? "Update review" : "Post review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
