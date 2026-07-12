import type { Language, ListingType } from "./types";

export type CategoryOption = {
  value: string;
  labels: Record<Language, string>;
};

export const itemCategories: CategoryOption[] = [
  
  { value: "electronics", labels: { am: "ኤሌክትሮኒክስ", en: "Electronics" } },
  
  { value: "clothing", labels: { am: "ልብስ", en: "Clothing" } },
  { value: "shoes", labels: { am: "ጫማ", en: "Shoes" } },
  
  { value: "furniture", labels: { am: "ፈርኒቸር", en: "Furniture" } },
  { value: "kitchen", labels: { am: "የኩሽና እቃ", en: "Kitchen" } },
  { value: "vehicles", labels: { am: "ተሽከርካሪ", en: "Vehicles" } },
  
  { value: "beauty", labels: { am: "ውበት", en: "Beauty" } },
  
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export const jobCategories: CategoryOption[] = [
  { value: "retail", labels: { am: "ሽያጭ", en: "Retail" } },
  { value: "hospitality", labels: { am: "ሆቴል እና ካፌ", en: "Hotel and cafe" } },
  { value: "teaching", labels: { am: "ትምህርት", en: "Teaching" } },
  { value: "health", labels: { am: "ጤና", en: "Health" } },
  { value: "office", labels: { am: "የቢሮ ስራ", en: "Office work" } },
  { value: "other", labels: { am: "ሌላ", en: "Other" } }
];

export function categoriesFor(type: ListingType) {
  return type === "item" ? itemCategories : jobCategories;
}

export function categoryLabel(type: ListingType, value: string | null | undefined, language: Language) {
  const option = categoriesFor(type).find((category) => category.value === value);
  return option?.labels[language] ?? value ?? "";
}
