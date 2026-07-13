"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useId, useState } from "react";
import { ImageUp } from "lucide-react";
import { categoriesFor } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { Language, ListingType } from "@/lib/types";
import { Field, FieldError, SelectField, TabButton } from "./ui";

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type PreviewFile = {
  file: File;
  url: string;
};

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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
  const [price, setPrice] = useState("");
  const [salary, setSalary] = useState("");
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [imageError, setImageError] = useState("");
  const imageInputId = useId();

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setImageError("");

    previews.forEach((preview) => URL.revokeObjectURL(preview.url));

    if (files.length > MAX_IMAGE_COUNT) {
      setPreviews([]);
      setImageError(t(language, "maxImages"));
      event.target.value = "";
      return;
    }

    if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setPreviews([]);
      setImageError(t(language, "maxImageSize"));
      event.target.value = "";
      return;
    }

    setPreviews(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (type === "item" && previews.length === 0) {
      setImageError(t(language, "required"));
      return;
    }
    onSubmit(new FormData(event.currentTarget));
  }

  const visibleImageError = fieldErrors.images ?? fieldErrors.imagePaths ?? imageError;

  return (
    <form className="space-y-3 p-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
        <TabButton active={type === "item"} onClick={() => setType("item")} label={t(language, "sellItem")} />
        <TabButton active={type === "job"} onClick={() => setType("job")} label={t(language, "hireWorker")} />
      </div>

      <input type="hidden" name="type" value={type} />
      <Field
        name="title"
        label={type === "item" ? t(language, "itemTitle") : t(language, "jobTitle")}
        placeholder={type === "item" ? t(language, "itemTitle") : t(language, "jobTitle")}
        error={fieldErrors.title}
        required
      />

      <SelectField name="category" label={t(language, "category")} error={fieldErrors.category} required>
        <option value="">{t(language, "category")}</option>
        {categoriesFor(type).map((option) => (
          <option key={option.value} value={option.value}>
            {option.labels[language]}
          </option>
        ))}
      </SelectField>

      {type === "item" ? (
        <>
          <Field
            name="price"
            label={t(language, "price")}
            placeholder="10,000"
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(formatMoneyInput(event.target.value))}
            error={fieldErrors.price}
            required
          />
          <SelectField name="condition" label={t(language, "condition")}>
            <option value="used">{t(language, "used")}</option>
            <option value="new">{t(language, "new")}</option>
          </SelectField>
          <div>
            <span className="mb-1 block text-sm font-black text-ink">{t(language, "images")}</span>
            <label
              className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white p-4 text-center ${visibleImageError ? "border-red-300 ring-2 ring-red-100" : "border-black/20"}`}
              htmlFor={imageInputId}
            >
              <ImageUp className="text-leaf" size={28} />
              <span className="mt-2 text-sm font-black text-ink">{t(language, "chooseImages")}</span>
              <span className="mt-1 text-xs leading-5 text-ink/60">{t(language, "imageHelp")}</span>
            </label>
            <input
              className="sr-only"
              id={imageInputId}
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              required
            />
            <FieldError message={visibleImageError} />
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {previews.map((preview, index) => (
                  <div key={`${preview.file.name}-${preview.url}`} className="relative aspect-square overflow-hidden rounded-md bg-mist">
                    <img className="h-full w-full object-cover" src={preview.url} alt={`${t(language, "images")} ${index + 1}`} />
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Field
          name="salary"
          label={t(language, "salary")}
          placeholder="6,000"
          inputMode="numeric"
          value={salary}
          onChange={(event) => setSalary(formatMoneyInput(event.target.value))}
          error={fieldErrors.salary}
        />
      )}

      <Field name="location" label={t(language, "location")} placeholder={t(language, "location")} error={fieldErrors.location} required />
      <Field name="phone" label={t(language, "phone")} placeholder="0912345678" inputMode="tel" error={fieldErrors.phone} required />
      <label className="block">
        <span className="mb-1 block text-sm font-black text-ink">
          {type === "job" ? t(language, "requirements") : t(language, "details")}
        </span>
        <textarea
          className={`min-h-36 w-full rounded-lg border bg-white p-3 outline-none ${fieldErrors.description ? "border-red-300 ring-2 ring-red-100" : "border-black/10"}`}
          name="description"
          maxLength={4000}
          placeholder={type === "job" ? t(language, "requirements") : t(language, "details")}
        />
        <FieldError message={fieldErrors.description} />
      </label>
      <button className="h-12 w-full rounded-lg bg-leaf font-black text-white disabled:opacity-60" disabled={busy}>
        {t(language, "submit")}
      </button>
    </form>
  );
}
