import type { GuideType } from "./flagship-guides.ts";

type GuideCollectionEditorial = {
  title: string;
  description: string;
  browseLabel: string;
};

const guideCollectionEditorial: Partial<Record<GuideType, GuideCollectionEditorial>> = {
  Marina: {
    title: "Marina Guides",
    description:
      "A marina is more than pontoons, fuel and shore power. Each has its own approaches, atmosphere, habits and place within the surrounding cruising ground. Old Sea Dogs Marina Guides help skippers understand what to expect before the lines go ashore.",
    browseLabel: "Explore Marina Guides",
  },
  Harbour: {
    title: "Harbour Guides",
    description:
      "Understand Britain’s great harbours—their character, approaches and working life—before you arrive.",
    browseLabel: "Browse Harbour Guides",
  },
  Anchorage: {
    title: "Anchorage Guides",
    description:
      "Beautiful places to spend a night afloat, considered through shelter, setting and the character of the water.",
    browseLabel: "Browse Anchorage Guides",
  },
  "Cruising Area": {
    title: "Cruising Area Guides",
    description:
      "Explore entire sailing regions, bringing their harbours, passages, history and local character together.",
    browseLabel: "Browse Cruising Areas",
  },
  Destination: {
    title: "Destination Guides",
    description:
      "Places worth sailing to, understood through the waterfront, the town and the stories found ashore.",
    browseLabel: "Browse Destination Guides",
  },
  Pilotage: {
    title: "Pilotage Guides",
    description:
      "Evergreen pilotage knowledge that helps a prepared crew make sense of an unfamiliar approach.",
    browseLabel: "Browse Pilotage Guides",
  },
  Passage: {
    title: "Passage Guides",
    description:
      "Classic cruising routes shaped by weather, tide, landfall and the choices that make a passage memorable.",
    browseLabel: "Browse Passage Guides",
  },
  River: {
    title: "River Guides",
    description:
      "Follow the rivers that shape Britain’s sailing life, from their entrance marks to the communities upstream.",
    browseLabel: "Browse River Guides",
  },
  Seamanship: {
    title: "Seamanship Guides",
    description:
      "Practical knowledge for more thoughtful, capable and considerate days afloat.",
    browseLabel: "Browse Seamanship Guides",
  },
  "Maritime History": {
    title: "Maritime History Guides",
    description:
      "The ships, people and working waterfronts that explain why Britain’s sailing places feel as they do.",
    browseLabel: "Browse Maritime History Guides",
  },
};

export function guideCollectionCopy(type: GuideType): GuideCollectionEditorial {
  return guideCollectionEditorial[type] || {
    title: `${type} Guides`,
    description:
      "Carefully researched Old Sea Dogs Guides for sailors who want to understand a place before they arrive.",
    browseLabel: `Browse ${type} Guides`,
  };
}
