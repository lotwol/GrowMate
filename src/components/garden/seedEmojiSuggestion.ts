// Smart emoji suggestion based on seed/crop name
const SEED_EMOJI_MAP: [RegExp, string][] = [
  // Grönsaker
  [/tomat/i, "🍅"],
  [/morot/i, "🥕"],
  [/gurk/i, "🥒"],
  [/squash|zucchini|pumpa/i, "🥒"],
  [/majs/i, "🌽"],
  [/sallat|spenat|mangold|grönkål|kål/i, "🥬"],
  [/broccoli|blomkål/i, "🥦"],
  [/lök/i, "🧅"],
  [/vitlök/i, "🧄"],
  [/potatis/i, "🥔"],
  [/paprika/i, "🫑"],
  [/chili|jalapeño|habanero/i, "🌶️"],
  [/aubergine/i, "🍆"],
  [/ärt|böna|bönor/i, "🫛"],
  [/rädis|rätt?ika/i, "🥕"],
  [/selleri/i, "🥬"],
  [/rotselleri|palsternacka|rot/i, "🥕"],
  // Frukt
  [/äpple/i, "🍎"],
  [/päron/i, "🍐"],
  [/citron/i, "🍋"],
  [/apelsin/i, "🍊"],
  [/vindruv/i, "🍇"],
  [/jordgubb/i, "🍓"],
  [/körsbär/i, "🍒"],
  [/persik/i, "🍑"],
  [/melon|vattenmelon/i, "🍈"],
  [/fikon/i, "🫐"],
  [/plommon/i, "🍑"],
  // Bär
  [/blåbär/i, "🫐"],
  [/hallon/i, "🍓"],
  [/björnbär/i, "🫐"],
  [/vinbär/i, "🍇"],
  [/krusbär/i, "🍇"],
  // Örter
  [/basilika/i, "🌿"],
  [/persilja/i, "🌿"],
  [/dill/i, "🌿"],
  [/mynta|mint/i, "🌿"],
  [/rosmarin/i, "🌿"],
  [/timjan/i, "🌿"],
  [/koriander/i, "🌿"],
  [/oregano/i, "🌿"],
  [/gräslök/i, "🌿"],
  [/salvia/i, "🌿"],
  // Blommor
  [/solros/i, "🌻"],
  [/ros\b/i, "🌹"],
  [/tulpan/i, "🌷"],
  [/lavendel/i, "🪻"],
  [/ringblomma|tagetes/i, "🌼"],
  [/petunia|penséer/i, "🌸"],
  [/blomma/i, "🌸"],
  [/dahlia/i, "🌺"],
];

const CATEGORY_DEFAULT_EMOJI: Record<string, string> = {
  grönsak: "🥕",
  ört: "🌿",
  frukt: "🍎",
  bär: "🫐",
  blomma: "🌸",
};

export function suggestSeedEmoji(name: string, category?: string): string {
  const trimmed = name.trim();
  if (!trimmed) return CATEGORY_DEFAULT_EMOJI[category || "grönsak"] || "🌱";
  
  for (const [pattern, emoji] of SEED_EMOJI_MAP) {
    if (pattern.test(trimmed)) return emoji;
  }
  
  return CATEGORY_DEFAULT_EMOJI[category || "grönsak"] || "🌱";
}
