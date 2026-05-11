import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId } = await req.json();

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      user: {
        select: { username: true, dob: true },
      },
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(call.channelName, uid);

  // ✅ ONLY RINGING — NO TIME SET HERE
  await prisma.call.update({
    where: { id: callId },
    data: {
      status: "RINGING",
      agoraToken: token,
    },
  });

  return NextResponse.json({
    callId: call.id,
    channelName: call.channelName,
    token,
    uid,
    appId: process.env.AGORA_APP_ID,
    user: call.user,
  });
}