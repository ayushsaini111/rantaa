import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const cookieStore = cookies();

    const userId =
      cookieStore.get("userId")?.value;

    // Google login session
    const session = await auth();

    console.log(
      "🏠 home userId cookie:",
      userId
    );

    console.log(
      "🏠 home session:",
      session?.user?.email
    );

    let user = null;

    // ── OTP Login User ──
    if (userId) {
      user = await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          plans: {
            where: {
              endDate: {
                gte: new Date(),
              },

              remainingMinutes: {
                gt: 0,
              },
            },

            include: {
              plan: true,
            },

            take: 1,
          },
        },
      });
    }

    // ── Google Login User ──
    if (!user && session?.user?.email) {

      // Prevent pandits from entering user home
      if (session.user.role === "pandit") {
        redirect("/pandit");
      }

      user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },

        include: {
          plans: {
            where: {
              endDate: {
                gte: new Date(),
              },

              remainingMinutes: {
                gt: 0,
              },
            },

            include: {
              plan: true,
            },

            take: 1,
          },
        },
      });
    }

    console.log(
      "🏠 home user from DB:",
      user
    );

    // ── Not logged in ──
    if (!user) {
      console.log(
        "❌ No user found — redirect login"
      );

      redirect("/login");
    }

    // ── Incomplete profile ──
    if (!user.username || !user.dob) {
      console.log(
        "❌ Incomplete profile"
      );

      redirect("/username");
    }

    // ── Available pandits ──
    const pandits =
      await prisma.pandit.findMany({
        where: {
          isAvailable: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    // ── Active Plan ──
    const activePlan = user?.plans?.[0]
      ? {
          name:
            user.plans[0].plan.name,

          remainingMinutes:
            user.plans[0]
              .remainingMinutes,

          endDate:
            user.plans[0].endDate,
        }
      : {
          name: "Free Test",
          remainingMinutes: 999,
        };

    return (
      <HomeClient
        pandits={pandits}
        userPlan={activePlan}
        username={user.username}
        userId={user.id}
        profilePic={user.profilePic}
      />
    );

  } catch (error) {
    console.error(
      "❌ HOME PAGE ERROR:",
      error
    );

    redirect("/login");
  }
}