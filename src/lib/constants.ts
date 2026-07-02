import type { Barber, OpeningHours, Service } from "@/types/booking";

export const BUSINESS_NAME = "M.Blendz";
export const BUSINESS_TAGLINE = "Haircuts and smooth fades";

export const SERVICES: Service[] = [
  {
    id: "haircut-18",
    name: "Haircut (18+)",
    price: 25,
    duration: 45,
    category: "Main Services",
  },
  {
    id: "haircut-beard",
    name: "Haircut & Beard",
    price: 30,
    duration: 50,
    category: "Main Services",
  },
  {
    id: "shape-up",
    name: "Shape Up",
    price: 15,
    duration: 20,
    category: "Additional Services",
  },
  {
    id: "haircut-under-18",
    name: "Haircut (under 18s)",
    price: 20,
    duration: 40,
    category: "Other",
  },
];

export const BARBERS: Barber[] = [
  { id: "m-blendz", name: "M.Blendz", role: "Barber" },
];

export const OPENING_HOURS: OpeningHours[] = [
  { day: "Monday", open: null, close: null },
  { day: "Tuesday", open: "09:00", close: "18:00" },
  { day: "Wednesday", open: "09:00", close: "18:00" },
  { day: "Thursday", open: "09:00", close: "18:00" },
  { day: "Friday", open: "09:00", close: "18:00" },
  { day: "Saturday", open: "09:00", close: "17:00" },
  { day: "Sunday", open: null, close: null },
];

export const BOOKING_POLICY = {
  title: "Our Booking Policy",
  items: [
    "CASH ONLY",
    "No shows will be charged the full amount",
    "Late fee £5",
    "3 Crescent Avenue, Coventry CV3 1HD",
  ],
  notice:
    "On holiday 6 July – 7 August. Please book around these dates.",
};

export const CONTACT = {
  phone: "07301 274493",
  phoneHref: "tel:+447301274493",
  email: "somo2010@outlook.com",
  emailHref: "mailto:somo2010@outlook.com",
  instagram: "@m.blendz",
  instagramHref: "https://instagram.com/m.blendz",
  address: "3 Crescent Avenue, Coventry CV3 1HD",
  mapsHref:
    "https://maps.google.com/?q=3+Crescent+Avenue+Coventry+CV3+1HD",
  mapsEmbed:
    "https://maps.google.com/maps?q=3+Crescent+Avenue+Coventry+CV3+1HD&output=embed",
};

export const SLOT_INTERVAL_MINUTES = 15;

export const GALLERY_IMAGES = [
  {
    id: "1",
    src: "/gallery/hair-design-fade.png",
    alt: "Intricate fade with custom hair design",
  },
  {
    id: "2",
    src: "/gallery/skin-fade-profile.png",
    alt: "Sharp skin fade with clean line-up",
  },
  {
    id: "3",
    src: "/gallery/textured-crop-fade.png",
    alt: "Textured crop with high skin fade",
  },
  {
    id: "4",
    src: "/gallery/kids-fade.png",
    alt: "Kids skin fade",
  },
];

// Premium barber shop interior — hero only (gallery/about use real client photos)
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1920&q=85";
export const ABOUT_IMAGE = "/gallery/hair-design-fade.png";

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getServiceCategories(): string[] {
  return [...new Set(SERVICES.map((s) => s.category).filter(Boolean))] as string[];
}
