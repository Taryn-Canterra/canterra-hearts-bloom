import { Link } from "react-router-dom";
import { Bed, Bath, Square, Sparkles } from "lucide-react";
import type { Listing } from "@/data/listings";
import { FEATURE_LABELS } from "@/data/listings";

const formatPrice = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}k`;

const statusStyles: Record<Listing["status"], string> = {
  new: "bg-accent text-accent-foreground",
  active: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
};

const statusLabels: Record<Listing["status"], string> = {
  new: "New",
  active: "Active",
  pending: "Pending",
};

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={listing.image}
          alt={`${listing.title} — ${listing.acres} acre horse property in ${listing.city}, Colorado`}
          width={1024}
          height={768}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[listing.status]}`}
          >
            {statusLabels[listing.status]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            AI tagged
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {listing.aiTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-2xl font-semibold text-primary">
            {formatPrice(listing.price)}
          </span>
          <span className="text-sm font-medium text-accent">{listing.acres} acres</span>
        </div>
        <div>
          <h3 className="font-display text-lg font-medium leading-tight text-foreground">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {listing.city}, {listing.county}
          </p>
        </div>
        <div className="flex items-center gap-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            {listing.beds}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {listing.baths}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Square className="h-4 w-4" />
            {listing.sqft.toLocaleString()} sf
          </span>
          <span className="ml-auto font-semibold text-primary">
            {listing.stalls} stalls
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {listing.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {FEATURE_LABELS[f]}
            </span>
          ))}
          {listing.features.length > 3 && (
            <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{listing.features.length - 3} more
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
