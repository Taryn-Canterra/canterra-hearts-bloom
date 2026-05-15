// Full equine-industry vendor taxonomy
export const VENDOR_CATEGORIES = [
  // Horse care professionals
  "Equine veterinarian",
  "Farrier",
  "Equine dentist",
  "Equine chiropractor",
  "Equine massage therapist",
  "Equine acupuncturist",
  "Equine nutritionist",
  "Saddle fitter",
  // Training & instruction
  "Trainer",
  "Riding instructor",
  "Clinician",
  "Boarding barn",
  "Lesson barn",
  // Property & facility
  "Barn builder",
  "Arena builder",
  "Fence contractor",
  "Stall mats / footing",
  "Water well specialist",
  "Irrigation contractor",
  "Manure management",
  "Pasture / weed management",
  "Ranch hand / caretaker",
  // Supplies
  "Hay supplier",
  "Feed store",
  "Tack shop",
  // Transportation & travel
  "Horse transporter",
  "Equine shipping (international)",
  // Inspections & professional services
  "Equine inspector",
  "Pre-purchase exam vet",
  "Land surveyor",
  "Real estate attorney",
  "Equine attorney",
  "Equine insurance",
  "Equine accountant",
  // Specialty
  "Breeder",
  "Equine reproduction vet",
  "Equine photographer",
  "Equine event planner",
  "Equine retirement / rehab",
  "Equine cremation services",
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];
