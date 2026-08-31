import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      select: {
        sentiment: true,
        status: true,
        sentimentScore: true,
      },
    });

    const total = feedback.length;

    const positive = feedback.filter(
      (item) => item.sentiment === "POS"
    ).length;

    const neutral = feedback.filter(
      (item) => item.sentiment === "NEU"
    ).length;

    const negative = feedback.filter(
      (item) => item.sentiment === "NEG"
    ).length;

    const newCount = feedback.filter(
      (item) => item.status === "NEW"
    ).length;

    const reviewed = feedback.filter(
      (item) => item.status === "REVIEWED"
    ).length;

    const actioned = feedback.filter(
      (item) => item.status === "ACTIONED"
    ).length;

    const scores = feedback
      .map((item) => item.sentimentScore)
      .filter(
        (score): score is number => score !== null
      );

    const averageSentimentScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) /
          scores.length
        : null;

    return NextResponse.json({
      total,
      sentiment: {
        positive,
        neutral,
        negative,
      },
      status: {
        new: newCount,
        reviewed,
        actioned,
      },
      averageSentimentScore,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Unable to load dashboard data." },
      { status: 500 }
    );
  }
}