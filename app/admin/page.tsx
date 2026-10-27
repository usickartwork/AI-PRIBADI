import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/adminServer";

export const dynamic = "force-dynamic";

export default async function AdminDirectPage() {
  const authResult = await verifyAdminSession();

  if (!authResult.authorized) {
    // Pengguna non-admin atau belum login langsung dialihkan ke beranda utama
    redirect("/");
  }

  // Admin terotorisasi dialihkan ke tampilan Admin SPA di beranda
  redirect("/?view=admin");
}
