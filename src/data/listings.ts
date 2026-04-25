import listing1 from "@/assets/listing-1.jpg";
import listing2 from "@/assets/listing-2.jpg";
import listing3 from "@/assets/listing-3.jpg";
import listing4 from "@/assets/listing-4.jpg";
import listing5 from "@/assets/listing-5.jpg";
import listing6 from "@/assets/listing-6.jpg";
import galleryBarn from "@/assets/gallery-barn-interior.jpg";
import galleryArena from "@/assets/gallery-arena.jpg";
import galleryKitchen from "@/assets/gallery-kitchen.jpg";
import agentTaryn from "@/assets/agent-taryn.jpg";

export interface Agent {
  name: string;
  title: string;
  brokerage: string;
  phone: string;
  email: string;
  photo: string;
}

export const DEFAULT_AGENT: Agent = {
  name: "Taryn King",
  title: "Land & Ranch Agent Director",
  brokerage: "Horse & Hearth Group · eXp Realty",
  phone: "(720) 555-0184",
  email: "taryn@horseandhearth.com",
  photo: agentTaryn,
};

const COMMON_GALLERY = [galleryBarn, galleryArena, galleryKitchen];

export type EquineFeature =
  | "indoor_arena"
  | "outdoor_arena"
  | "round_pen"
  | "wash_rack"
  | "tack_room"
  | "hay_storage"
  | "foaling_stall"
  | "auto_waterers"
  | "loafing_shed"
  | "irrigation"
  | "fenced_pasture"
  | "trail_access";

export const FEATURE_LABELS: Record<EquineFeature, string> = {
  indoor_arena: "Indoor arena",
  outdoor_arena: "Outdoor arena",
  round_pen: "Round pen",
  wash_rack: "Wash rack",
  tack_room: "Tack room",
  hay_storage: "Hay storage",
  foaling_stall: "Foaling stall",
  auto_waterers: "Auto waterers",
  loafing_shed: "Loafing shed",
  irrigation: "Irrigation rights",
  fenced_pasture: "Cross-fenced pasture",
  trail_access: "Trail access",
};

export interface Listing {
  id: string;
  title: string;
  address: string;
  city: string;
  county: string;
  price: number;
  acres: number;
  beds: number;
  baths: number;
  sqft: number;
  stalls: number;
  paddocks: number;
  image: string;
  features: EquineFeature[];
  description: string;
  status: "active" | "pending" | "new";
  daysOnMarket: number;
  aiTags: string[];
}

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Sunridge Pasture Ranch",
    address: "8420 County Road 27",
    city: "Elizabeth",
    county: "Elbert County",
    price: 1485000,
    acres: 35.4,
    beds: 4,
    baths: 3,
    sqft: 3210,
    stalls: 6,
    paddocks: 5,
    image: listing1,
    features: ["outdoor_arena", "wash_rack", "tack_room", "hay_storage", "auto_waterers", "fenced_pasture"],
    description:
      "Turn-key equestrian estate with 6-stall center-aisle barn, lighted outdoor arena, and rolling cross-fenced pasture with mountain views.",
    status: "new",
    daysOnMarket: 3,
    aiTags: ["6 stalls detected", "Outdoor arena", "Pipe fencing", "Loafing sheds"],
  },
  {
    id: "2",
    title: "Black Pine Equestrian Estate",
    address: "1102 Cathedral Pines Way",
    city: "Monument",
    county: "El Paso County",
    price: 2295000,
    acres: 18.2,
    beds: 5,
    baths: 4,
    sqft: 4680,
    stalls: 8,
    paddocks: 6,
    image: listing2,
    features: ["indoor_arena", "outdoor_arena", "wash_rack", "tack_room", "foaling_stall", "auto_waterers"],
    description:
      "Spectacular 80x180 indoor arena with attached 8-stall barn, foaling suite, climate-controlled tack room, and unobstructed Pikes Peak views.",
    status: "active",
    daysOnMarket: 21,
    aiTags: ["Indoor arena", "8 stalls", "Heated wash rack", "Pikes Peak view"],
  },
  {
    id: "3",
    title: "Aspen Hollow Log Home",
    address: "55 Bear Creek Trail",
    city: "Bailey",
    county: "Park County",
    price: 985000,
    acres: 12.8,
    beds: 3,
    baths: 2,
    sqft: 2480,
    stalls: 3,
    paddocks: 3,
    image: listing3,
    features: ["round_pen", "loafing_shed", "trail_access", "fenced_pasture"],
    description:
      "Storybook log home backing to National Forest. Three loafing sheds, round pen, and direct trail access from the property gate.",
    status: "active",
    daysOnMarket: 47,
    aiTags: ["Round pen", "Trail access", "Split-rail fencing", "Loafing sheds"],
  },
  {
    id: "4",
    title: "Heritage Oaks Farmstead",
    address: "14790 Smoky Hill Road",
    city: "Kiowa",
    county: "Elbert County",
    price: 1195000,
    acres: 40.0,
    beds: 4,
    baths: 3,
    sqft: 2940,
    stalls: 4,
    paddocks: 4,
    image: listing4,
    features: ["hay_storage", "irrigation", "fenced_pasture", "loafing_shed"],
    description:
      "Classic farmhouse on 40 irrigated acres producing 80+ tons of hay annually. Wraparound porch, heritage oaks, and a 4-stall barn.",
    status: "pending",
    daysOnMarket: 12,
    aiTags: ["Hay meadow", "Irrigation rights", "4 stalls", "Mature trees"],
  },
  {
    id: "5",
    title: "Stone Ridge Equestrian Compound",
    address: "9912 Ridge Crest Drive",
    city: "Sedalia",
    county: "Douglas County",
    price: 3850000,
    acres: 24.6,
    beds: 6,
    baths: 6,
    sqft: 6820,
    stalls: 10,
    paddocks: 8,
    image: listing5,
    features: ["indoor_arena", "outdoor_arena", "wash_rack", "tack_room", "foaling_stall", "auto_waterers", "fenced_pasture"],
    description:
      "Architectural stone estate with 10-stall stable, 100x220 indoor arena, dressage court, and dedicated foaling barn on manicured grounds.",
    status: "active",
    daysOnMarket: 64,
    aiTags: ["10 stalls", "Indoor + outdoor arenas", "Dressage court", "Foaling barn"],
  },
  {
    id: "6",
    title: "Green Roof Stables",
    address: "3340 Meadow Lark Lane",
    city: "Larkspur",
    county: "Douglas County",
    price: 875000,
    acres: 10.1,
    beds: 3,
    baths: 2,
    sqft: 2150,
    stalls: 5,
    paddocks: 4,
    image: listing6,
    features: ["wash_rack", "tack_room", "hay_storage", "fenced_pasture", "auto_waterers"],
    description:
      "Picture-perfect 5-stall barn with cupola, attached run-outs, and four cross-fenced pastures. Move-in ready home with foothill views.",
    status: "new",
    daysOnMarket: 6,
    aiTags: ["5 stalls", "Run-outs", "Cupola barn", "Cross-fenced"],
  },
];
