import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    // Lazy Prisma import
    const { prisma } = await import(
      "@/lib/prisma"
    );

    const cookieStore = cookies();

    const userId =
      cookieStore.get("userId")?.value;

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

    // OTP users
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

    // Google users
    if (!user && session?.user?.email) {

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

    if (!user) {
      redirect("/login");
    }

    if (!user.username || !user.dob) {
      redirect("/username");
    }

    const pandits =
      await prisma.pandit.findMany({
        where: {
          isAvailable: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

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