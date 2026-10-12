import { User } from "firebase/auth";
import { supabase } from "@/lib/supabase/client";

// Known legacy Firebase UIDs from previous projects mapped by email
const KNOWN_LEGACY_UIDS: Record<string, string[]> = {
  "jagadheshbellane@gmail.com": [
    "9s0Z3NqQycXGTH9yQn4aX78qzb42",
    "92660b86-6e42-425e-aeeb-71090449303e"
  ],
  "ballanejagadhesh@gmail.com": [
    "T37K05Ln6tM9nJoIfnUmtAxXeiX2"
  ],
  "sanapala.sanapala345@gmail.com": [
    "9fb1a209-21c8-4294-be06-fd5f4a296561"
  ],
  "bellanajagadeesh.23.csm@anits.edu.in": [
    "08162bae-3718-4503-bef4-f490a063f408"
  ]
};

/**
 * Returns all user IDs associated with this user (both current Firebase UID and legacy UIDs).
 * Guarantees that users never lose access to their QR codes when switching Firebase projects.
 */
export async function getUserAccountIds(user: User): Promise<string[]> {
  if (!user) return [];
  const ids = new Set<string>([user.uid]);

  const userEmail = (user.email || "").toLowerCase().trim();

  // Add known legacy UIDs for this email
  if (userEmail && KNOWN_LEGACY_UIDS[userEmail]) {
    for (const legacyId of KNOWN_LEGACY_UIDS[userEmail]) {
      ids.add(legacyId);
    }
  }

  // Also query profiles for any additional accounts sharing this verified email
  if (userEmail) {
    try {
      const { data: matchedProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", userEmail);

      if (matchedProfiles) {
        matchedProfiles.forEach((p) => {
          if (p.user_id) ids.add(p.user_id);
        });
      }
    } catch (err) {
      console.warn("[DumpaReview] Note while fetching user profiles:", err);
    }
  }

  return Array.from(ids);
}

/**
 * Automatically syncs the user profile and transfers QR codes from any previous
 * Firebase project account matching this email.
 */
export async function syncUserAccount(user: User): Promise<void> {
  if (!user || !user.email) return;

  try {
    // 1. Attempt to upsert current user profile
    await supabase.from("profiles").upsert(
      {
        user_id: user.uid,
        full_name: user.displayName || "Unknown",
        email: user.email,
        avatar_url: user.photoURL || "",
      },
      { onConflict: "user_id" }
    );

    // 2. Fetch all known user IDs for this email
    const allIds = await getUserAccountIds(user);

    for (const priorId of allIds) {
      if (priorId !== user.uid) {
        console.log(
          `[DumpaReview] Transferring QR codes from previous account (${priorId}) to new account (${user.uid})...`
        );

        const { error: updateErr } = await supabase
          .from("qr_codes")
          .update({ user_id: user.uid })
          .eq("user_id", priorId);

        if (!updateErr) {
          console.log(
            `[DumpaReview] Successfully transferred QR codes from (${priorId}) to (${user.uid})`
          );
        }
      }
    }
  } catch (err) {
    console.warn("[DumpaReview] Note during account sync:", err);
  }
}

