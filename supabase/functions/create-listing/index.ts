import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { assertString, expiry, phoneRegex } from "../_shared/rules.ts";
import { sendListingPreviewToGroup } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { supabase, profile } = await requireProfile(req);

    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { count, error: countError } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profile.id)
      .eq("status", "active")
      .gte("created_at", weekAgo);
    if (countError) throw countError;

    let slotId: string | null = null;
    if ((count ?? 0) >= 3) {
      const { data: slot } = await supabase
        .from("extra_post_slots")
        .select("id")
        .eq("user_id", profile.id)
        .is("consumed_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!slot) throw new Error("Weekly free post limit reached");
      slotId = slot.id;
    }

    const type = body.type === "job" ? "job" : "item";
    const title = assertString(body.title, "title", 3, 80);
    const category = assertString(body.category, "category", 2, 50);
    const location = assertString(body.location, "location", 2, 80);
    const phone = assertString(body.phone, "phone", 9, 14);
    const description =
      typeof body.description === "string" && body.description.trim()
        ? assertString(body.description, "description", 5, 4000)
        : null;
    if (!phoneRegex.test(phone)) throw new Error("Invalid phone number");

    const imagePaths = Array.isArray(body.imagePaths) ? body.imagePaths : [];
    if (imagePaths.length > 4) throw new Error("Maximum 4 images");
    if (type === "item" && imagePaths.length < 1)
      throw new Error("At least 1 image is required");
    if (type === "job" && imagePaths.length > 0)
      throw new Error("Jobs are text-only");

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        owner_id: profile.id,
        type,
        title,
        description,
        price: type === "item" ? body.price : null,
        salary: type === "job" ? (body.salary ?? null) : null,
        category,
        location,
        condition: type === "item" ? (body.condition ?? null) : null,
        job_type: null,
        phone,
        telegram_username: profile.username,
        expires_at: expiry(7),
      })
      .select()
      .single();
    if (listingError) throw listingError;

    if (imagePaths.length > 0) {
      const { error: imageError } = await supabase
        .from("listing_images")
        .insert(
          imagePaths.map((path: string, index: number) => ({
            listing_id: listing.id,
            storage_path: path,
            sort_order: index,
          })),
        );
      if (imageError) throw imageError;
    }

    if (slotId) {
      await supabase
        .from("extra_post_slots")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", slotId);
    }

    try {
      await sendListingPreviewToGroup({
        id: listing.id,
        type,
        title,
        location,
        price: type === "item" ? body.price : null,
        salary: type === "job" ? (body.salary ?? null) : null,
      });
    } catch (error) {
      console.error("Telegram listing preview failed", error);
    }

    return json({ listing });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Create listing failed",
      },
      400,
    );
  }
});
