"use client";

import type { FormEvent } from "react";
import { categoriesFor } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { Language, ListingType } from "@/lib/types";
import { Field, FieldError, SelectField, TabButton } from "./ui";
import { useState } from "react";

const copy = {
  am: {
    sellItem: "እቃ ለመሸጥ",
    hireWorker: "ስራ ለመለጠፍ",
    itemTitle: "የእቃው ስም",
    jobTitle: "የስራው መጠሪያ",
    category: "ምድብ",
    price: "ዋጋ ETB",
    salary: "ደመወዝ ETB",
    condition: "ሁኔታ",
    new: "አዲስ",
    used: "ያገለገለ",
    images: "እስከ 4 ፎቶዎች ያስገቡ",
    location: "አድራሻ",
    phone: "ስልክ ቁጥር",
    requirements: "መስፈርቶች",
    details: "ዝርዝር",
  },
  en: {
    sellItem: "Sell an item",
    hireWorker: "Post a job",
    itemTitle: "Item title",
    jobTitle: "Job title",
    category: "Category",
    price: "Price ETB",
    salary: "Salary ETB (optional)",
    condition: "Condition",
    new: "New",
    used: "Used",
    images: "Images, max 4",
    location: "Location",
    phone: "Phone e.g. 0912345678",
    requirements: "Requirements",
    details: "Details",
  },
};

export function PostForm({
  busy,
  fieldErrors,
  language,
  onSubmit,
}: {
  busy: boolean;
  fieldErrors: Record<string, string>;
  language: Language;
  onSubmit: (formData: FormData) => void;
}) {
  const [type, setType] = useState<ListingType>("item");
  const formCopy = copy[language];

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
        <TabButton active={type === "item"} onClick={() => setType("item")} label={formCopy.sellItem} />
        <TabButton active={type === "job"} onClick={() => setType("job")} label={formCopy.hireWorker} />
      </div>

      <input type="hidden" name="type" value={type} />
      <Field name="title" placeholder={type === "item" ? formCopy.itemTitle : formCopy.jobTitle} error={fieldErrors.title} required />

      <SelectField name="category" label={formCopy.category} required>
        <option value="">{formCopy.category}</option>
        {categoriesFor(type).map((option) => (
          <option key={option.value} value={option.value}>
            {option.labels[language]}
          </option>
        ))}
      </SelectField>
      <FieldError message={fieldErrors.category} />

      {type === "item" ? (
        <>
          <Field name="price" placeholder={formCopy.price} type="number" error={fieldErrors.price} required />
          <SelectField name="condition" label={formCopy.condition}>
            <option value="used">{formCopy.used}</option>
            <option value="new">{formCopy.new}</option>
          </SelectField>
          <label className="block rounded-lg border border-dashed border-black/20 bg-white p-4 text-sm">
            {formCopy.images}
            <input className="mt-2 w-full text-sm" name="images" type="file" accept="image/*" multiple />
          </label>
        </>
      ) : (
        <Field name="salary" placeholder={formCopy.salary} type="number" error={fieldErrors.salary} />
      )}

      <Field name="location" placeholder={formCopy.location} error={fieldErrors.location} required />
      <Field name="phone" placeholder={formCopy.phone} error={fieldErrors.phone} required />
      <textarea
        className={`min-h-28 w-full rounded-lg border bg-white p-3 outline-none ${fieldErrors.description ? "border-red-300 ring-2 ring-red-100" : "border-black/10"}`}
        name="description"
        placeholder={type === "job" ? formCopy.requirements : formCopy.details}
      />
      <FieldError message={fieldErrors.description} />
      <button className="h-12 w-full rounded-lg bg-leaf font-black text-white disabled:opacity-60" disabled={busy}>
        {t(language, "submit")}
      </button>
    </form>
  );
}
