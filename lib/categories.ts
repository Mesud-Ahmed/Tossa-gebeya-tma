import type { Language, ListingType } from "./types";

export type CategoryOption = {
  value: string;
  labels: Record<Language, string>;
};

export const itemCategories: CategoryOption[] = [
  { value: "phones", labels: { am: "ስልኮች", en: "Phones" } },
  { value: "electronics", labels: { am: "ኤሌክትሮኒክስ", en: "Electronics" } },
  { value: "computers", labels: { am: "ኮምፒውተሮች", en: "Computers" } },
  { value: "clothing", labels: { am: "ልብስ", en: "Clothing" } },
  { value: "shoes", labels: { am: "ጫማ", en: "Shoes" } },
  { value: "home", labels: { am: "የቤት እቃ", en: "Home goods" } },
  { value: "furniture", labels: { am: "ፈርኒቸር", en: "Furniture" } },
  { value: "kitchen", labels: { am: "የኩሽና እቃ", en: "Kitchen" } },
  { value: "vehicles", labels: { am: "ተሽከርካሪ", en: "Vehicles" } },
  { value: "parts", labels: { am: "መለዋወጫ", en: "Parts" } },
  { value: "beauty", labels: { am: "ውበት", en: "Beauty" } },
  { value: "books", labels: { am: "መጻሕፍት", en: "Books" } },
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export const jobCategories: CategoryOption[] = [
  { value: "retail", labels: { am: "ሽያጭ", en: "Retail" } },
  { value: "hospitality", labels: { am: "ሆቴል እና ካፌ", en: "Hotel and cafe" } },
  { value: "construction", labels: { am: "ግንባታ", en: "Construction" } },
  { value: "domestic", labels: { am: "የቤት ስራ", en: "Domestic work" } },
  { value: "driver", labels: { am: "ሹፌር", en: "Driver" } },
  { value: "security", labels: { am: "ጥበቃ", en: "Security" } },
  { value: "teaching", labels: { am: "ትምህርት", en: "Teaching" } },
  { value: "health", labels: { am: "ጤና", en: "Health" } },
  { value: "office", labels: { am: "የቢሮ ስራ", en: "Office work" } },
  { value: "daily-labor", labels: { am: "የቀን ስራ", en: "Daily labor" } },
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export function categoriesFor(type: ListingType) {
  return type === "item" ? itemCategories : jobCategories;
}

export function categoryLabel(type: ListingType, value: string | null | undefined, language: Language) {
  const option = categoriesFor(type).find((category) => category.value === value);
  return option?.labels[language] ?? value ?? "";
}
