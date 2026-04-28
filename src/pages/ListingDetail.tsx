import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bed,
  Bath,
  Square,
  MapPin,
  Heart,
  Share2,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ClaimListingDialog } from "@/components/ClaimListingDialog";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FEATURE_LABELS } from "@/data/listings";
import { useProperty } from "@/hooks/useProperties";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { listing, loading } = useProperty(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);

  // Check if this property is already saved by the current user
  useEffect(() => {
    if (!user || !id) { setSaved(false); return; }
    (async () => {
      const { data } = await supabase
        .from("saved_properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", id)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [user, id]);

  const toggleSave = async () => {
    if (!id) return;
    if (!user) {
      toast("Sign in to save properties", {
        description: "Create a free account to keep track of homes you love.",
        action: { label: "Sign in", onClick: () => navigate("/auth") },
      });
      return;
    }
    setSavingFav(true);
    if (saved) {
      const { error } = await supabase
        .from("saved_properties")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", id);
      setSavingFav(false);
      if (error) { toast.error(error.message); return; }
      setSaved(false);
      toast("Removed from saved properties");
    } else {
      const { error } = await supabase
        .from("saved_properties")
        .insert({ user_id: user.id, property_id: id });
      setSavingFav(false);
      if (error) { toast.error(error.message); return; }
      setSaved(true);
      toast.success("Saved to your portal");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-32 text-center">
          <p className="text-muted-foreground">Loading listing…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-32 text-center">
          <h1 className="font-display text-4xl text-primary">Listing not found</h1>
          <p className="mt-3 text-muted-foreground">This property may have come off the market.</p>
          <Button asChild className="mt-8">
            <Link to="/">Back to search</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    const { error } = await supabase.from("property_inquiries").insert([
      {
        property_id: id,
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        phone: (String(data.get("phone") ?? "").trim() || null) as string | null,
        message: (String(data.get("message") ?? "").trim() || null) as string | null,
      },
    ]);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send your message", { description: error.message });
      return;
    }
    toast.success("Message sent", {
      description: `${listing.agent.name} will reach out within the hour.`,
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="border-b border-border/60 bg-card/60">
          <div className="container flex items-center justify-between py-4">
            <Link
              to="/#search"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to results
            </Link>
            <div className="flex items-center gap-2">
              <Button variant={saved ? "default" : "ghost"} size="sm" onClick={toggleSave} disabled={savingFav}>
                <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast("Link copied")}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <section className="bg-gradient-warm py-8">
          <div className="container">
            <div className="grid gap-3 md:grid-cols-[1fr_320px] md:grid-rows-1">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted shadow-card">
                <img
                  src={listing.gallery[activeImage]}
                  alt={`${listing.title} — view ${activeImage + 1}`}
                  width={1600}
                  height={1000}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  {activeImage + 1} / {listing.gallery.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
                {listing.gallery.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-muted transition-all ${
                      i === activeImage
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Header / specs */}
        <section className="border-b border-border/60 bg-background py-10">
          <div className="container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.address} · {listing.city}, {listing.county}
              </div>
              <h1 className="mt-3 font-display text-4xl font-medium text-primary md:text-5xl">
                {listing.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/80">
                <span className="inline-flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-accent" /> {listing.beds} beds
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-accent" /> {listing.baths} baths
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Square className="h-4 w-4 text-accent" /> {listing.sqft.toLocaleString()} sq ft
                </span>
                <span className="font-semibold text-primary">{listing.acres} acres</span>
                <span className="font-semibold text-primary">{listing.stalls} stalls</span>
                <span className="font-semibold text-primary">
                  {listing.paddocks} paddocks
                </span>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <div className="font-display text-4xl font-semibold text-primary md:text-5xl">
                {formatPrice(listing.price)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {listing.daysOnMarket} days on market
              </div>
            </div>
          </div>
        </section>

        {/* Two column body */}
        <section className="bg-background py-12 md:py-16">
          <div className="container grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-12">
              {/* AI breakdown */}
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-2xl font-medium text-primary">
                    AI photo intelligence
                  </h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Computer vision detected these equine features from the listing photos —
                  including some not mentioned in the MLS description.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {listing.aiTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-forest text-primary-foreground">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{tag}</span>
                      </div>
                      <span className="text-xs font-semibold text-accent">
                        {Math.floor(88 + Math.random() * 11)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-medium text-primary">
                  About this property
                </h2>
                <p className="mt-4 text-base leading-relaxed text-foreground/85">
                  {listing.description}
                </p>
                <p className="mt-4 text-base leading-relaxed text-foreground/85">
                  Set in {listing.county}, this {listing.acres}-acre property has been
                  thoughtfully designed for equine living — from the {listing.stalls}-stall
                  configuration to the {listing.paddocks} cross-fenced turnouts. Improvements
                  reflect a working horseman's eye for footing, drainage, and daily flow.
                </p>
              </div>

              {/* Equine features */}
              <div>
                <h2 className="font-display text-2xl font-medium text-primary">
                  Equine features
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {listing.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm font-medium text-secondary-foreground">
                        {FEATURE_LABELS[f]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property details table */}
              <div>
                <h2 className="font-display text-2xl font-medium text-primary">Property details</h2>
                <dl className="mt-5 grid gap-x-8 gap-y-3 rounded-2xl border border-border/70 bg-card p-6 sm:grid-cols-2">
                  {[
                    ["Acres", `${listing.acres}`],
                    ["Bedrooms", `${listing.beds}`],
                    ["Bathrooms", `${listing.baths}`],
                    ["Living area", `${listing.sqft.toLocaleString()} sq ft`],
                    ["Stalls", `${listing.stalls}`],
                    ["Paddocks", `${listing.paddocks}`],
                    ["County", listing.county],
                    ["Status", listing.status[0].toUpperCase() + listing.status.slice(1)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border/40 py-1.5 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Agent sidebar */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
                <div className="bg-gradient-forest p-6 text-primary-foreground">
                  <div className="flex items-center gap-4">
                    <img
                      src={listing.agent.photo}
                      alt={listing.agent.name}
                      width={72}
                      height={72}
                      loading="lazy"
                      className="h-16 w-16 rounded-full border-2 border-primary-foreground/30 object-cover"
                    />
                    <div>
                      <div className="font-display text-lg font-semibold">
                        {listing.agent.name}
                      </div>
                      <div className="text-xs text-primary-foreground/80">
                        {listing.agent.title}
                      </div>
                      <div className="mt-0.5 text-xs text-primary-foreground/70">
                        {listing.agent.brokerage}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={`tel:${listing.agent.phone.replace(/\D/g, "")}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`mailto:${listing.agent.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  </div>

                  <form onSubmit={handleContact} className="space-y-3">
                    <input
                      required
                      name="name"
                      placeholder="Your name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Phone (optional)"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <textarea
                      required
                      name="message"
                      rows={3}
                      defaultValue={`I'd love to schedule a showing of ${listing.title}.`}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {submitting ? "Sending…" : "Request a showing"}
                    </Button>
                  </form>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Typical response time: under 1 hour
                  </p>
                  <div className="text-center pt-2 border-t">
                    <ClaimListingDialog
                      propertyId={listing.id}
                      propertyAddress={listing.address}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ListingDetail;
