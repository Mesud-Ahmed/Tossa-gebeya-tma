export type ListingType = "item" | "job";
export type ListingStatus = "active" | "expired" | "deleted";
export type UpgradeType = "extend" | "boost" | "overflow";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type Language = "am" | "en";

export type Profile = {
  id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language: Language;
  is_admin?: boolean;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url?: string;
  sort_order: number;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
};

export type Listing = {
  id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  price: number | null;
  salary: number | null;
  category: string | null;
  location: string;
  condition: string | null;
  job_type: string | null;
  phone: string;
  telegram_username: string | null;
  status: ListingStatus;
  is_boosted: boolean;
  boosted_until: string | null;
  expires_at: string;
  created_at: string;
  listing_images?: ListingImage[];
};

export type PaymentRequest = {
  id: string;
  user_id: string;
  listing_id: string | null;
  upgrade_type: UpgradeType;
  amount_etb: number;
  screenshot_path: string;
  screenshot_url?: string;
  status: PaymentStatus;
  created_at: string;
  listings?: Listing | null;
  profiles?: Profile | null;
};

export type AppSession = {
  profile: Profile;
  initData: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}
