import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier } = body;

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Identifier wajib disertakan." }, { status: 400 });
    }

    const cleanId = identifier.trim().toLowerCase();

    // Jika sudah berupa email, langsung kembalikan email tersebut
    if (cleanId.includes("@")) {
      return NextResponse.json({ email: cleanId });
    }

    const clerk = await clerkClient();

    // 1. Cari user di Clerk berdasarkan field username
    try {
      const usersByUsername = await clerk.users.getUserList({
        username: [cleanId],
        limit: 1,
      });

      if (usersByUsername.data.length > 0) {
        const u = usersByUsername.data[0];
        const primaryEmail =
          u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
          u.emailAddresses[0]?.emailAddress;

        if (primaryEmail) {
          return NextResponse.json({ email: primaryEmail });
        }
      }
    } catch (e) {
      console.warn("[resolve-identifier] getUserList by username:", e);
    }

    // 2. Jika belum ketemu, cari via query pencarian umum di Clerk
    try {
      const searchUsers = await clerk.users.getUserList({
        query: cleanId,
        limit: 10,
      });

      for (const u of searchUsers.data) {
        const metaUsername = (u.publicMetadata?.username as string)?.toLowerCase();
        const unsafeUsername = (u.unsafeMetadata?.username as string)?.toLowerCase();
        const directUsername = u.username?.toLowerCase();

        if (
          directUsername === cleanId ||
          metaUsername === cleanId ||
          unsafeUsername === cleanId
        ) {
          const primaryEmail =
            u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
            u.emailAddresses[0]?.emailAddress;

          if (primaryEmail) {
            return NextResponse.json({ email: primaryEmail });
          }
        }
      }
    } catch (e) {
      console.warn("[resolve-identifier] getUserList by query:", e);
    }

    // Tidak ditemukan di mapping khusus, kembalikan identifier apa adanya
    return NextResponse.json({ email: cleanId });
  } catch (err: any) {
    console.error("[resolve-identifier] Error:", err);
    return NextResponse.json({ error: err?.message || "Gagal mencocokkan identifier." }, { status: 500 });
  }
}
