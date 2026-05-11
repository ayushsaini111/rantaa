import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const cookieStore = cookies();

    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { panditId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.username || !user.dob) {
      return NextResponse.json(
        { error: "INCOMPLETE_PROFILE" },
        { status: 403 }
      );
    }

    await prisma.call.updateMany({
      where: {
        userId,
        panditId,
        status: "INITIATED",
      },
      data: {
        status: "FAILED",
      },
    });

    const channelName = `ch${randomBytes(8).toString("hex")}`;

    const uid = Math.floor(
      Math.random() * 100000
    );

    const token = generateAgoraToken(
      channelName,
      uid
    );

    const call = await prisma.call.create({
      data: {
        userId,
        panditId,
        channelName,
        agoraToken: token,
        type: "VOICE",
        billingType: "PLAN",
        ratePerMinute: 0,
        status: "INITIATED",
      },
    });

    return NextResponse.json({
      callId: call.id,
      channelName,
      token,
      appId: process.env.AGORA_APP_ID,
      uid,
      planMinutesLeft: 999,
    });

  } catch (error) {
    console.error("INITIATE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}