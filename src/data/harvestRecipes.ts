export interface Recipe {
  name: string;
  time: string;
  difficulty: "🟢" | "🟡" | "🔴";
  description: string;
}

export interface CropRecipes {
  cropName: string;
  recipes: Recipe[];
}

const RECIPES: Record<string, Recipe[]> = {
  Tomat: [
    { name: "Caprese-sallad", time: "10 min", difficulty: "🟢", description: "Skivor av tomat, mozzarella och basilika med olivolja." },
    { name: "Tomatsoppa", time: "30 min", difficulty: "🟡", description: "Krämig soppa med rostad tomat, vitlök och basilika." },
    { name: "Ugnsrostade tomater", time: "45 min", difficulty: "🟡", description: "Långsamt rostade med timjan och olivolja – perfekt på pasta." },
  ],
  Morot: [
    { name: "Morötter med hummus", time: "5 min", difficulty: "🟢", description: "Stickor av färsk morot med hemmagjord hummus." },
    { name: "Morotssoppa", time: "25 min", difficulty: "🟡", description: "Len soppa med ingefära och kokosmjölk." },
    { name: "Morots-ingefärsjuice", time: "10 min", difficulty: "🟢", description: "Fräsch juice med morot, ingefära och apelsin." },
  ],
  Gurka: [
    { name: "Tzatziki", time: "15 min", difficulty: "🟢", description: "Riven gurka med yoghurt, vitlök och dill." },
    { name: "Agurkesalat", time: "10 min", difficulty: "🟢", description: "Dansk gurksallad med ättika, socker och dill." },
    { name: "Inlagd gurka", time: "20 min + tid", difficulty: "🟡", description: "Skivor i sötsur lag med senapsfrön och dill." },
  ],
  Zucchini: [
    { name: "Zucchinifritters", time: "20 min", difficulty: "🟡", description: "Rivna zucchini-plättar med fetaost och mynta." },
    { name: "Fyllda zucchini", time: "40 min", difficulty: "🟡", description: "Halvor fyllda med köttfärs, ris och tomat." },
    { name: "Zucchini-pasta", time: "15 min", difficulty: "🟢", description: "Tunna remsor som ersätter pasta – toppa med pesto." },
  ],
  Böna: [
    { name: "Bönröra", time: "15 min", difficulty: "🟢", description: "Mosade bönor med vitlök, citron och olivolja." },
    { name: "Bönsoppa", time: "35 min", difficulty: "🟡", description: "Mustig soppa med bönor, tomat och rosmarin." },
    { name: "Bönsallad med citron", time: "10 min", difficulty: "🟢", description: "Fräsch sallad med citronvinägrett och persilja." },
  ],
  Sallad: [
    { name: "Ceasarsallad", time: "15 min", difficulty: "🟢", description: "Klassisk med krutonger, parmesan och dressing." },
    { name: "Sommarsallad", time: "10 min", difficulty: "🟢", description: "Blandade blad med jordgubbar, nötter och vinägrett." },
    { name: "Sallad med jordgubbar", time: "10 min", difficulty: "🟢", description: "Syrlig getost, valnötter och balsamico." },
  ],
  Potatis: [
    { name: "Potatissallad", time: "25 min", difficulty: "🟡", description: "Med gräddfil, gräslök och senap." },
    { name: "Ugnsrostad potatis", time: "45 min", difficulty: "🟢", description: "Knaprig med rosmarin, vitlök och olivolja." },
    { name: "Kall potatissoppa", time: "30 min", difficulty: "🟡", description: "Vichyssoise med purjolök och grädde." },
  ],
  Pumpa: [
    { name: "Pumpasoppa", time: "40 min", difficulty: "🟡", description: "Krämig soppa med ingefära och kokosmjölk." },
    { name: "Pumpapaj", time: "60 min", difficulty: "🔴", description: "Amerikansk klassiker med kanel och muskot." },
    { name: "Rostade pumpakärnor", time: "25 min", difficulty: "🟢", description: "Salt snacks med chili och havssalt." },
  ],
  Lök: [
    { name: "Lökmarmelad", time: "45 min", difficulty: "🟡", description: "Söt och salt – perfekt till ost." },
    { name: "Fransk löksoppa", time: "50 min", difficulty: "🟡", description: "Med gratinerad ost och bröd." },
    { name: "Karamelliserad lök", time: "30 min", difficulty: "🟡", description: "Långkokt med smör – toppar allt." },
  ],
  Jordgubbe: [
    { name: "Jordgubbssylt", time: "30 min", difficulty: "🟡", description: "Klassisk sylt med bara socker och citron." },
    { name: "Jordgubbstårta", time: "90 min", difficulty: "🔴", description: "Midsommartårta med grädde och sockerkaksbotten." },
    { name: "Jordgubbar med grädde", time: "5 min", difficulty: "🟢", description: "Den enklaste och bästa desserten." },
  ],
  Ärta: [
    { name: "Ärtsoppa", time: "40 min", difficulty: "🟡", description: "Klassisk gul ärtsoppa med senap." },
    { name: "Ärtor med mynta och fetaost", time: "10 min", difficulty: "🟢", description: "Fräsch sallad med citron och mynta." },
    { name: "Risotto med ärtor", time: "30 min", difficulty: "🟡", description: "Krämig risotto med parmesan och ärtor." },
  ],
  Rödbeta: [
    { name: "Inlagd rödbeta", time: "30 min", difficulty: "🟡", description: "Skivor i sötsur lag med kryddnejlika." },
    { name: "Rödbetatartar", time: "20 min", difficulty: "🟡", description: "Tärnad rödbeta med kapris och senap." },
    { name: "Rödbetkaka", time: "50 min", difficulty: "🔴", description: "Saftig chokladkaka med rödbeta." },
  ],
  Spenat: [
    { name: "Spenat och ägg", time: "15 min", difficulty: "🟢", description: "Fräst spenat med pocherat ägg." },
    { name: "Spinatsoppa", time: "20 min", difficulty: "🟢", description: "Snabb grön soppa med grädde." },
    { name: "Spenat-smoothie", time: "5 min", difficulty: "🟢", description: "Med banan, ingefära och havremjölk." },
  ],
  Grönkål: [
    { name: "Grönkålschips", time: "25 min", difficulty: "🟢", description: "Knapriga chips med salt och olivolja." },
    { name: "Grönkålssallad", time: "15 min", difficulty: "🟢", description: "Masserad med citron, parmesan och pinjenötter." },
    { name: "Grönkålspesto", time: "15 min", difficulty: "🟢", description: "Alternativ pesto med grönkål och vitlök." },
  ],
  Basilika: [
    { name: "Pesto genovese", time: "10 min", difficulty: "🟢", description: "Klassisk pesto med pinjenötter och parmesan." },
    { name: "Caprese", time: "5 min", difficulty: "🟢", description: "Tomat, mozzarella och färsk basilika." },
    { name: "Basilikaolja", time: "10 min", difficulty: "🟢", description: "Smaksatt olja perfekt för dippa bröd." },
  ],
  Dill: [
    { name: "Gravlax", time: "24h", difficulty: "🟡", description: "Salt- och sockergravad lax med dill." },
    { name: "Dillsås", time: "10 min", difficulty: "🟢", description: "Klassisk sås till lax eller potatis." },
    { name: "Inlagd gurka med dill", time: "20 min", difficulty: "🟡", description: "Sötsur inläggning med dillkronor." },
  ],
  Persilja: [
    { name: "Chimichurri", time: "10 min", difficulty: "🟢", description: "Argentinsk örtsås till grillat." },
    { name: "Tabouleh", time: "20 min", difficulty: "🟢", description: "Bulgursallad med massor av persilja." },
    { name: "Gremolata", time: "5 min", difficulty: "🟢", description: "Persilja, vitlök och citronskal." },
  ],
  Purjolök: [
    { name: "Purjolöksoppa", time: "30 min", difficulty: "🟡", description: "Len soppa med potatis och grädde." },
    { name: "Purjolök au gratin", time: "35 min", difficulty: "🟡", description: "Gratinerad med ost och bechamelsås." },
    { name: "Potatispurjolökspaj", time: "60 min", difficulty: "🔴", description: "Klassisk paj med ägg och grädde." },
  ],
  Rädisor: [
    { name: "Smörgås med rädisor", time: "5 min", difficulty: "🟢", description: "Smör, rädisor och flingsalt på bröd." },
    { name: "Inlagda rädisor", time: "15 min", difficulty: "🟢", description: "Snabb pickling med risvinäger." },
    { name: "Rädisor med örtsmör", time: "10 min", difficulty: "🟢", description: "Krämigt smör med gräslök och rädisor." },
  ],
  Squash: [
    { name: "Squashsoppa", time: "30 min", difficulty: "🟡", description: "Krämig soppa med salvia och parmesan." },
    { name: "Fylld squash", time: "45 min", difficulty: "🟡", description: "Med quinoa, fetaost och soltorkad tomat." },
    { name: "Squash i wok", time: "15 min", difficulty: "🟢", description: "Snabb wokning med soja och sesam." },
  ],
  Paprika: [
    { name: "Fylld paprika", time: "40 min", difficulty: "🟡", description: "Med ris, köttfärs och tomat." },
    { name: "Rostad paprikasås", time: "30 min", difficulty: "🟡", description: "Smoky sås perfekt till pasta." },
    { name: "Paprikasticks med dipp", time: "5 min", difficulty: "🟢", description: "Rå paprika med hummus eller tzatziki." },
  ],
  Blomkål: [
    { name: "Rostad blomkål", time: "35 min", difficulty: "🟢", description: "Med gurkmeja, kummin och olivolja." },
    { name: "Blomkålssoppa", time: "25 min", difficulty: "🟡", description: "Len och krämig med muskotnöt." },
    { name: "Blomkåls-ris", time: "15 min", difficulty: "🟢", description: "Riven blomkål som låg-kolhydrat-alternativ." },
  ],
  Palsternacka: [
    { name: "Rostad palsternacka", time: "35 min", difficulty: "🟢", description: "Med honung och timjan i ugnen." },
    { name: "Palsternackssoppa", time: "30 min", difficulty: "🟡", description: "Len och nötig soppa med grädde." },
    { name: "Palsternackschips", time: "25 min", difficulty: "🟢", description: "Tunna skivor rostade knapriga." },
  ],
};

/** Find recipes for a crop name (case-insensitive, partial match) */
export function findRecipes(cropName: string): Recipe[] | null {
  const lower = cropName.toLowerCase().trim();
  for (const [key, recipes] of Object.entries(RECIPES)) {
    if (key.toLowerCase() === lower) return recipes;
  }
  for (const [key, recipes] of Object.entries(RECIPES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return recipes;
  }
  return null;
}
