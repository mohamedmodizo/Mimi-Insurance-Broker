export type InsuranceScene = {
  type: string;
  description: string;
  slogan: string;
  image: string;
  accent: string;
};

export const insuranceScenes: InsuranceScene[] = [
  {
    type: "Motor insurance",
    description: "Vehicles, accidents and roadside protection",
    slogan: "Move with confidence.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2200&q=84",
    accent: "#d5523e"
  },
  {
    type: "Health insurance",
    description: "Medical care, wellness and family support",
    slogan: "Care when you need it.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2200&q=84",
    accent: "#16858a"
  },
  {
    type: "Property insurance",
    description: "Homes, buildings and valuable belongings",
    slogan: "A safer place to call home.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2200&q=84",
    accent: "#75623d"
  },
  {
    type: "Education planning",
    description: "School fees and long-term family goals",
    slogan: "Build a brighter tomorrow.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2200&q=84",
    accent: "#a05b36"
  },
  {
    type: "Fire insurance",
    description: "Protection for property and business risks",
    slogan: "Stand strong when the unexpected happens.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=2200&q=84",
    accent: "#c4522f"
  },
  {
    type: "Travel insurance",
    description: "Support for journeys, luggage and interruptions",
    slogan: "Go further with peace of mind.",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=84",
    accent: "#2d6f8f"
  },
  {
    type: "Marine and cargo",
    description: "Goods, vessels and logistics in transit",
    slogan: "Protect every journey from port to destination.",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2200&q=84",
    accent: "#17647b"
  },
  {
    type: "Personal accident",
    description: "Everyday protection for people and families",
    slogan: "Support for every chapter.",
    image: "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=2200&q=84",
    accent: "#8b4f74"
  },
  {
    type: "Family and life",
    description: "Protection for the people who matter most",
    slogan: "Protect the people who matter.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=2200&q=84",
    accent: "#6b557f"
  },
  {
    type: "Business insurance",
    description: "Cover for teams, enterprises and operations",
    slogan: "Keep your business moving.",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2200&q=84",
    accent: "#456b5c"
  }
];
