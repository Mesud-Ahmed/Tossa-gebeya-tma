export type View = "feed" | "post" | "my-ads" | "admin";

export type Toast = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;
