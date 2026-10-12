import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase/client";

/**
 * Ensures user profile exists in Supabase and seamlessly transfers/links
 * all QR codes from any prior Firebase account sharing the same email address.
 */
export async function syncUserAccount(user: User): Promise<void> {
  if (!user || !user.email) return;

  try {
    // 1. Ensure profile exists for current Firebase UID
    await supabase.from("profiles").upsert(
      {
        user_id: user.uid,
        full_name: user.displayName || "Unknown",
        email: user.email,
        avatar_url: user.photoURL || "",
      },
      { onConflict: "user_id" }
    );

    // 2. Check for any prior profiles associated with the exact same email
    const { data: matchingProfiles, error: fetchErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", user.email);

    if (fetchErr || !matchingProfiles) return;

    for (const record of matchingProfiles) {
      if (record.user_id && record.user_id !== user.uid) {
        console.log(
          `[DumpaReview] Transferring QR codes from previous account (${record.user_id}) to new account (${user.uid})...`
        );

        // Re-assign all previous QR codes to the current user.uid
        const { error: updateErr } = await supabase
          .from("qr_codes")
          .update({ user_id: user.uid })
          .eq("user_id", record.user_id);

        if (!updateErr) {
          // Clean up old profile now that its QR codes have been safely moved
          await supabase.from("profiles").delete().eq("user_id", record.user_id);
          console.log(
            `[DumpaReview] Successfully transferred data from previous account (${record.user_id})!`
          );
        } else {
          console.error("[DumpaReview] Error transferring QR codes:", updateErr.message);
        }
      }
    }
  } catch (err) {
    console.error("[DumpaReview] Error during account synchronization:", err);
  }
}
