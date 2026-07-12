"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import type { Toast } from "@/lib/app-ui-types";

export function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`h-11 rounded-md text-sm font-bold ${active ? "bg-leaf text-white" : "text-ink/70"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-bold ${active ? "text-leaf" : "text-ink/55"}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function Field({
  error,
  name,
  placeholder,
  type = "text",
  required,
}: {
  error?: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <input
        className={`h-12 w-full rounded-lg border bg-white px-3 outline-none ${error ? "border-red-300 ring-2 ring-red-100" : "border-black/10"}`}
        name={name}
        placeholder={placeholder}
        type={type}
        required={required}
      />
      <FieldError message={error} />
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{message}</p>;
}

export function SelectField({
  children,
  label,
  name,
  required,
}: {
  children: ReactNode;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <select
      className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 outline-none"
      name={name}
      aria-label={label}
      required={required}
    >
      {children}
    </select>
  );
}

export function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) return null;
  return (
    <button
      className={`fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-[448px] items-start gap-3 rounded-lg p-3 text-left text-sm text-white shadow-lg ${toast.type === "success" ? "bg-leaf" : "bg-red-600"}`}
      onClick={onClose}
      type="button"
    >
      {toast.type === "success" ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <AlertCircle className="mt-0.5 shrink-0" size={20} />}
      <span>
        <span className="block font-black">{toast.title}</span>
        <span className="mt-0.5 block text-white/90">{toast.message}</span>
      </span>
    </button>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 bg-white/90 px-6 py-5 text-center shadow-sm">
      <LoaderCircle className="animate-spin text-leaf" size={32} />
      <p className="text-sm font-black text-ink">{label}</p>
    </div>
  );
}

export function ImagePreview({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={onClose}>
      <button
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-ink"
        aria-label="Close image"
        onClick={onClose}
        type="button"
      >
        <X size={22} />
      </button>
      <img className="max-h-[88dvh] max-w-full rounded-lg object-contain" src={src} alt="" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

export function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-mist p-2">
      <p className="font-bold text-ink/45">{label}</p>
      <p className="mt-0.5 break-words font-black text-ink">{value}</p>
    </div>
  );
}
