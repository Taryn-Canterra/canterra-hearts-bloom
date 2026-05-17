import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LISTINGS,
  DEFAULT_AGENT,
  type Listing,
  type EquineFeature,
} from "@/data/listings";

// Maps a DB row (snake_case) into the Listing shape the UI components expect.
// Falls back to mock asset if the DB row has no photos (seed data uses URLs).
const mockById = new Map(LISTINGS.map((l) => [l.id, l]));

interface PropertyRow {
  id: string;
  mls_number: string | null;
  title: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  acres: number | null;
  status: string | null;
  days_on_market: number | null;
  photos: string[];
  primary_photo: string | null;
  is_equine: boolean | null;
  equine_confidence: number | null;
  equine_features: string[];
  ai_tags: string[];
  stalls: number | null;
  paddocks: number | null;
  listing_agent_name: string | null;
  listing_agent_phone: string | null;
  listing_agent_email: string | null;
  brokerage_name: string | null;
}

export const rowToListing = (row: PropertyRow): Listing => {
  // Use a stable fallback image from the mock set if the DB row has no photo
  const fallback = LISTINGS[0];

  return {
    id: row.id,
    title: row.title ?? "Untitled property",
    address: row.address ?? "",
    city: row.city ?? "",
    county: row.county ?? "",
    price: Number(row.price ?? 0),
    acres: Number(row.acres ?? 0),
    beds: Number(row.beds ?? 0),
    baths: Number(row.baths ?? 0),
    sqft: Number(row.sqft ?? 0),
    stalls: row.stalls ?? 0,
    paddocks: row.paddocks ?? 0,
    image: (row.primary_photo || row.photos?.[0]) ?? fallback.image,
    gallery:
      row.photos && row.photos.length > 0
        ? row.photos
        : [fallback.image, ...(fallback.gallery ?? [])].filter(Boolean),
    features: (row.equine_features ?? []) as EquineFeature[],
    description: row.description ?? "",
    status:
      row.status === "pending"
        ? "pending"
        : (row.days_on_market ?? 99) <= 7
          ? "new"
          : "active",
    daysOnMarket: row.days_on_market ?? 0,
    aiTags: row.ai_tags ?? [],
    agent:
      row.listing_agent_name
        ? {
            name: row.listing_agent_name,
            title: "Listing Agent",
            brokerage: row.brokerage_name ?? "",
            phone: row.listing_agent_phone ?? "",
            email: row.listing_agent_email ?? "",
            photo: DEFAULT_AGENT.photo,
          }
        : DEFAULT_AGENT,
  };
};

export const useProperties = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, mls_number, title, description, address, city, county, price, beds, baths, sqft, acres, status, days_on_market, photos, primary_photo, is_equine, equine_confidence, equine_features, ai_tags, stalls, paddocks, listing_agent_name, listing_agent_phone, listing_agent_email, brokerage_name",
        )
        .eq("is_equine", true) // Only show AI-verified horse properties
        .order("days_on_market", { ascending: true });

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        // Fallback to bundled mock data so the UI never looks empty during dev
        setListings(LISTINGS);
        setUsingMock(true);
      } else {
        setListings(data.map((r) => rowToListing(r as PropertyRow)));
        setUsingMock(false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { listings, loading, usingMock };
};

export const useProperty = (id: string | undefined) => {
  const [listing, setListing] = useState<Listing | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Try DB first
      const { data } = await supabase
        .from("properties")
        .select(
          "id, mls_number, title, description, address, city, county, price, beds, baths, sqft, acres, status, days_on_market, photos, primary_photo, is_equine, equine_confidence, equine_features, ai_tags, stalls, paddocks, listing_agent_name, listing_agent_phone, listing_agent_email, brokerage_name",
        )
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setListing(rowToListing(data as PropertyRow));
      } else {
        // Fall back to mock listing by id
        const mock = mockById.get(id);
        if (mock) {
          setListing({
            ...mock,
            gallery: mock.gallery ?? [mock.image],
            agent: mock.agent ?? DEFAULT_AGENT,
          });
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { listing, loading };
};
