import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { searchFiltersStore } from "@/hooks/useSearchFilters";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

export const CtaSaveSearch = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "saving") return;
    setStatus("saving");

    const criteria = searchFiltersStore.get();
    const { error } = await supabase.from("saved_searches").insert([
      {
        email: email.trim(),
        criteria: criteria as unknown as Record<string, unknown>,
        source: "cta_save_search",
      },
    ]);

    if (error) {
      setStatus("idle");
      toast({
        title: "Couldn't save your search",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setStatus("saved");
    toast({
      title: "You're on the list",
      description: "We'll email you the moment a matching property hits the MLS.",
    });
    setEmail("");
  };

  return (
    <section className="bg-gradient-forest py-20 text-primary-foreground md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Beta · Free for buyers
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium md:text-5xl">
            Be first when the right barn hits the market.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Save a search and we'll text or email you the second a Colorado property matching your
            equine criteria goes live on the MLS.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={status !== "idle"}
              className="flex-1 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/55 outline-none ring-0 backdrop-blur-sm transition-colors focus:border-primary-foreground/60 disabled:opacity-60"
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={status !== "idle"}
              className="rounded-xl text-primary"
            >
              {status === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === "saved" && <Check className="mr-2 h-4 w-4" />}
              {status === "saved" ? "Saved" : "Save my search"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-primary-foreground/60">
            We'll use your current filters as your alert criteria. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
