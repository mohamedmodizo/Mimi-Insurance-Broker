export type InsuranceScene = {
  type: string;
  description: string;
  image: string;
  accent: string;
};

export const insuranceScenes: InsuranceScene[] = [
  {
    type: "Motor insurance",
    description: "Vehicles, accidents and roadside protection",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2200&q=84",
    accent: "#d5523e"
  },
  {
    type: "Health insurance",
    description: "Medical care, wellness and family support",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2200&q=84",
    accent: "#16858a"
  },
  {
    type: "Property insurance",
    description: "Homes, buildings and valuable belongings",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2200&q=84",
    accent: "#75623d"
  },
  {
    type: "Fire insurance",
    description: "Protection for property and business risks",
    image: "https://images.unsplash.com/photo-1517960413843-0aee8e2c2d22?auto=format&fit=crop&w=2200&q=84",
    accent: "#c4522f"
  },
  {
    type: "Travel insurance",
    description: "Support for journeys, luggage and interruptions",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=84",
    accent: "#2d6f8f"
  },
  {
    type: "Marine and cargo",
    description: "Goods, vessels and logistics in transit",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2200&q=84",
    accent: "#17647b"
  },
  {
    type: "Personal accident",
    description: "Everyday protection for people and families",
    image: "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=2200&q=84",
    accent: "#8b4f74"
  },
  {
    type: "Business insurance",
    description: "Cover for teams, enterprises and operations",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2200&q=84",
    accent: "#456b5c"
  }
];
