export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "FIRST_CROP", emoji: "🌱", name: "Första fröet", description: "Lade till sin första gröda" },
  { id: "FIRST_HARVEST", emoji: "🥕", name: "Första skörden", description: "Skördade sin första gröda" },
  { id: "DIARY_STREAK_7", emoji: "📅", name: "En veckas loggning", description: "Loggat 7 dagar i rad" },
  { id: "DIARY_STREAK_30", emoji: "🗓️", name: "En månads loggning", description: "Loggat 30 dagar i rad" },
  { id: "FIVE_CROPS", emoji: "🌿", name: "Odlarträdgård", description: "Odlar 5 grödor samtidigt" },
  { id: "TEN_CROPS", emoji: "🌻", name: "Grönsaksland", description: "Odlar 10 grödor" },
  { id: "COMMUNITY_CONTRIBUTOR", emoji: "🤝", name: "Gemenskapsodlare", description: "Bidragit med data till gemenskapen" },
  { id: "SEED_SHARER", emoji: "🫘", name: "Fröbytare", description: "Delat frön med en annan odlare" },
  { id: "FIVE_HARVESTS", emoji: "🧺", name: "Skördefest", description: "Skördat 5 grödor" },
  { id: "WELLBEING_TRACKER", emoji: "💚", name: "Välmåendespårare", description: "Loggat välmående 10 gånger" },
  { id: "SCHOOL_MASTER", emoji: "🎓", name: "Odlingsmästare", description: "Fullföljt onboarding med en odlingsskola" },
  { id: "ZONE_EXPERT", emoji: "🗺️", name: "Zonexperten", description: "Bidragit med data från din zon" },
];

export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}
