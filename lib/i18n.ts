import type { Language } from "./types";

export const copy = {
  am: {
    appName: "ጦሳ ገበያ",
    items: "የሚሸጡ እቃዎች",
    jobs: "ስራዎች",
    post: "ለጥፍ",
    myAds: "የኔ ማስታወቂያ",
    admin: "አስተዳዳሪ",
    search: "ፈልግ",
    newest: "አዲስ",
    boosted: "ተለይቷል",
    call: "ይደውሉ",
    telegram: "ቴሌግራም",
    delete: "አጥፋ",
    extend: "7 ቀን አራዝም",
    boost: "ከላይ አሳይ",
    overflow: "ተጨማሪ ፖስት",
    receipt: "የክፍያ ስክሪንሾት",
    submit: "አስገባ",
    loading: "loading...",
    empty: "እስካሁን ምንም የለም",
    success: "ተሳክቷል",
    error: "ችግር ተፈጥሯል"
  },
  en: {
    appName: "Tossa Gebaya",
    items: "Items for Sale",
    jobs: "Job Openings",
    post: "Post",
    myAds: "My Ads",
    admin: "Admin",
    search: "Search",
    newest: "Newest",
    boosted: "Boosted",
    call: "Call",
    telegram: "Telegram",
    delete: "Delete",
    extend: "Extend 7 days",
    boost: "Boost",
    overflow: "Extra post",
    receipt: "Payment screenshot",
    submit: "Submit",
    loading: "Loading...",
    empty: "Nothing here yet",
    success: "Success",
    error: "Something went wrong"
  }
} satisfies Record<Language, Record<string, string>>;

export function t(language: Language, key: keyof typeof copy.en) {
  return copy[language][key] ?? copy.en[key];
}
