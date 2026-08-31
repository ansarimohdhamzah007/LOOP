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
        createdAt: true,
        sentiment: true,
        sentimentScore: true,
        channel: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // =====================================================
    // DAILY TREND
    // =====================================================

    const dailyData: Record<
      string,
      {
        date: string;
        total: number;
        positive: number;
        neutral: number;
        negative: number;
        scores: number[];
      }
    > = {};

    for (const item of feedback) {
      const date = item.createdAt
        .toISOString()
        .split("T")[0];

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          scores: [],
        };
      }

      dailyData[date].total += 1;

      if (item.sentiment === "POS") {
        dailyData[date].positive += 1;
      }

      if (item.sentiment === "NEU") {
        dailyData[date].neutral += 1;
      }

      if (item.sentiment === "NEG") {
        dailyData[date].negative += 1;
      }

      if (item.sentimentScore !== null) {
        dailyData[date].scores.push(
          item.sentimentScore
        );
      }
    }

    const trend = Object.values(dailyData).map(
      (item) => ({
        date: item.date,
        total: item.total,
        positive: item.positive,
        neutral: item.neutral,
        negative: item.negative,

        averageScore:
          item.scores.length > 0
            ? item.scores.reduce(
                (sum, score) => sum + score,
                0
              ) / item.scores.length
            : null,
      })
    );

    // =====================================================
    // CHANNEL DISTRIBUTION
    // =====================================================

    const channelData: Record<string, number> = {};

    for (const item of feedback) {
      channelData[item.channel] =
        (channelData[item.channel] || 0) + 1;
    }

    const channels = Object.entries(channelData)
      .map(([channel, count]) => ({
        channel,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // =====================================================
    // SENTIMENT
    // =====================================================

    const positive = feedback.filter(
      (item) => item.sentiment === "POS"
    ).length;

    const neutral = feedback.filter(
      (item) => item.sentiment === "NEU"
    ).length;

    const negative = feedback.filter(
      (item) => item.sentiment === "NEG"
    ).length;

    // =====================================================
    // AVERAGE SENTIMENT SCORE
    // =====================================================

    const analyzedFeedback = feedback.filter(
      (item) => item.sentimentScore !== null
    );

    const averageSentimentScore =
      analyzedFeedback.length > 0
        ? analyzedFeedback.reduce(
            (sum, item) =>
              sum + (item.sentimentScore ?? 0),
            0
          ) / analyzedFeedback.length
        : null;

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      totalFeedback: feedback.length,

      sentiment: {
        positive,
        neutral,
        negative,
      },

      averageSentimentScore,

      trend,

      channels,
    });
  } catch (error) {
    console.error("Trends GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate trends.",
      },
      {
        status: 500,
      }
    );
  }
}