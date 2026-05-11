import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RedirectPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (session.user.role === "pandit") {
    redirect("/pandit");
  }

  if (
    !session.user.username ||
    !session.user.dob
  ) {
    redirect("/username");
  }

  redirect("/home");
}