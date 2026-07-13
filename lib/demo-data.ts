import type { AppSession, Listing } from "./types";

export const demoSession: AppSession = {
  initData: "demo",
  profile: {
    id: "00000000-0000-0000-0000-000000000001",
    telegram_id: "demo",
    username: "demo_user",
    first_name: "Demo",
    last_name: null,
    language: "am",
    is_admin: true,
  },
};

export const sampleListings: Listing[] = [
  {
    id: "sample-1",
    owner_id: demoSession.profile.id,
    type: "item",
    title: "Samsung phone, clean condition",
    description: "Lightly used phone around Piassa. Call to inspect.",
    price: 8500,
    salary: null,
    category: "phones",
    location: "Dessie Piassa",
    condition: "Used",
    job_type: null,
    phone: "0912345678",
    telegram_username: "demo_user",
    status: "active",
    is_boosted: true,
    boosted_until: new Date(Date.now() + 2 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    listing_images: [
      {
        id: "sample-image-1",
        listing_id: "sample-1",
        storage_path: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        public_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        sort_order: 0,
      },
      {
        id: "sample-image-2",
        listing_id: "sample-1",
        storage_path: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
        public_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
        sort_order: 1,
      },
    ],
  },
  {
    id: "sample-2",
    owner_id: demoSession.profile.id,
    type: "job",
    title: "Cafe cashier",
    description:
      "Full time cashier needed. Basic Amharic reading and friendly service required.",
    price: null,
    salary: 6000,
    category: "hospitality",
    location: "Dessie Buanbu Wuha",
    condition: null,
    job_type: null,
    phone: "0912345678",
    telegram_username: "demo_user",
    status: "active",
    is_boosted: false,
    boosted_until: null,
    expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function demoListing(payload: any, ownerId: string): Listing {
  const id = crypto.randomUUID();
  return {
    id,
    owner_id: ownerId,
    type: payload.type,
    title: payload.title,
    description: payload.description ?? null,
    price: payload.price ?? null,
    salary: payload.salary ?? null,
    category: payload.category ?? null,
    location: payload.location,
    condition: payload.condition ?? null,
    job_type: null,
    phone: payload.phone,
    telegram_username: "demo_user",
    status: "active",
    is_boosted: false,
    boosted_until: null,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    listing_images: (payload.imagePaths ?? []).map((path: string, index: number) => ({
      id: crypto.randomUUID(),
      listing_id: id,
      storage_path: path,
      public_url: path,
      sort_order: index,
    })),
  };
}
