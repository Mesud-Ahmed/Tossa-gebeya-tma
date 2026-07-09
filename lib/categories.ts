import type { Language, ListingType } from "./types";

export type CategoryOption = {
  value: string;
  labels: Record<Language, string>;
};

export const itemCategories: CategoryOption[] = [
  { value: "phones", labels: { am: "ስልኮች", en: "Phones" } },
  { value: "electronics", labels: { am: "ኤሌክትሮኒክስ", en: "Electronics" } },
  { value: "clothing", labels: { am: "ልብስ", en: "Clothing" } },
  { value: "home", labels: { am: "የቤት እቃ", en: "Home goods" } },
  { value: "vehicles", labels: { am: "ተሽከርካሪ", en: "Vehicles" } },
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export const jobCategories: CategoryOption[] = [
  { value: "retail", labels: { am: "ሽያጭ", en: "Retail" } },
  { value: "hospitality", labels: { am: "ሆቴል እና ካፌ", en: "Hotel and cafe" } },
  { value: "construction", labels: { am: "ግንባታ", en: "Construction" } },
  { value: "domestic", labels: { am: "የቤት ስራ", en: "Domestic work" } },
  { value: "driver", labels: { am: "ሹፌር", en: "Driver" } },
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export function categoriesFor(type: ListingType) {
  return type === "item" ? itemCategories : jobCategories;
}

export function categoryLabel(type: ListingType, value: string | null | undefined, language: Language) {
  const option = categoriesFor(type).find((category) => category.value === value);
  return option?.labels[language] ?? value ?? "";
}
