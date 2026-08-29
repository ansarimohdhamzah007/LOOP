import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const [
      totalFeedback,
      positive,
      neutral,
      negative,
      newFeedback,
      reviewed,
      actioned,
    ] = await Promise.all([
      prisma.feedback.count({
        where: { workspaceId },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "POS",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "NEU",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "NEG",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "NEW",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "REVIEWED",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "ACTIONED",
        },
      }),
    ]);

    const analyzed =
      positive + neutral + negative;

    const averageSentimentScore =
      analyzed > 0
        ? Math.round(
            ((positive * 100) +
              (neutral * 50) +
              (negative * 0)) /
              analyzed
          )
        : 0;

    const recentFeedback =
      await prisma.feedback.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          content: true,
          channel: true,
          customerLabel: true,
          sentiment: true,
          sentimentScore: true,
          status: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      stats: {
        totalFeedback,
        positive,
        neutral,
        negative,
        newFeedback,
        reviewed,
        actioned,
        averageSentimentScore,
      },
      recentFeedback,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      {
        error: "Unable to load dashboard analytics.",
      },
      { status: 500 }
    );
  }
}