import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { callId } = await req.json();

    await prisma.call.update({
      where: { id: callId },
      data: {
        status: "FAILED",
      },
    });

    return Response.json({
      success: true,
    });

  } catch (error) {
    console.error("REJECT ERROR:", error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}