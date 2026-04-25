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
      <div className="relative container flex min-h-[640px] flex-col justify-end pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground backdrop-blur-sm">
            Colorado Beta · Q3 2025
          </span>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] text-primary-foreground sm:text-6xl md:text-7xl">
            Find the barn
            <span className="block italic text-primary-foreground/90">before you find the house.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
            Canterra is the first equine-intelligent property search — every active MLS listing,
            tagged by AI for the features horse owners actually need.
          </p>
        </div>
        <div className="mt-10">
          <SearchBar />
        </div>
      </div>
    </section>
  );
};
