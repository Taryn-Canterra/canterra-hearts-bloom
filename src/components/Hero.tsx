import heroImage from "@/assets/hero-ranch.jpg";
import { SearchBar } from "./SearchBar";

export const Hero = () => {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroImage}
        alt="Colorado horse ranch at golden hour with red barn, white pasture fences, and Rocky Mountain backdrop"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="relative container flex min-h-[640px] flex-col justify-end pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Colorado Beta · Live now
          </span>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] text-primary-foreground sm:text-6xl md:text-7xl">
            The house is easy.
            <span className="block italic text-primary-foreground/90">It's the barn that matters.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
            You scroll past the kitchen to find the barn.
            <span className="block">We did too — so we built the search that starts there.</span>
          </p>
        </div>
        <div className="mt-10">
          <SearchBar />
        </div>
      </div>
    </section>
  );
};
