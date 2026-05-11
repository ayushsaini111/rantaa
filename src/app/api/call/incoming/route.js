import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const panditId =
      searchParams.get("panditId");

    if (panditId) {
      const calls = await prisma.call.findMany({
        where: {
          panditId,
          status: "INITIATED",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
              dob: true,
              phone: true,
            },
          },
        },
      });

      return Response.json({ calls });
    }

    const userId =
      searchParams.get("userId");

    if (userId) {
      const call =
        await prisma.call.findFirst({
          where: {
            userId,
            status: "RINGING",
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            pandit: {
              select: {
                name: true,
                speciality: true,
                profilePic: true,
              },
            },
          },
        });

      return Response.json({
        call: call ?? null,
      });
    }

    return Response.json({ call: null });

  } catch (error) {
    console.error("INCOMING ERROR:", error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}