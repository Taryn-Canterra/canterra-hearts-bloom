import { Button } from "@/components/ui/button";

export const CtaSaveSearch = () => {
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
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="flex-1 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/55 outline-none ring-0 backdrop-blur-sm transition-colors focus:border-primary-foreground/60"
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              className="rounded-xl text-primary"
            >
              Send me a magic link
            </Button>
          </form>
          <p className="mt-4 text-xs text-primary-foreground/60">
            No password. No spam. Unsubscribe in one click.
          </p>
        </div>
      </div>
    </section>
  );
};
