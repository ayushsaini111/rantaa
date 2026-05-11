import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PanditDashboard from "./PanditDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PanditPage() {
  try {
    const session = await auth();

    console.log(
      "🧘 pandit session:",
      session?.user?.email
    );

    if (!session?.user?.email) {
      redirect("/login");
    }

    // Only pandits allowed
    if (session.user.role !== "pandit") {
      redirect("/home");
    }

    const pandit =
      await prisma.pandit.findUnique({
        where: {
          email: session.user.email,
        },
      });

    console.log(
      "🧘 pandit from db:",
      pandit
    );

    if (!pandit) {
      redirect("/login");
    }

    return (
      <PanditDashboard
        pandit={pandit}
      />
    );

  } catch (error) {
    console.error(
      "❌ PANDIT PAGE ERROR:",
      error
    );

    redirect("/login");
  }
}