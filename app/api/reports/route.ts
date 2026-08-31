import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalFeedback = feedback.length;

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

    const reviewedCount = feedback.filter(
      (item) => item.status === "REVIEWED"
    ).length;

    const actionedCount = feedback.filter(
      (item) => item.status === "ACTIONED"
    ).length;

    const analyzedFeedback = feedback.filter(
      (item) => item.sentimentScore !== null
    );

    const averageSentimentScore =
      analyzedFeedback.length > 0
        ? analyzedFeedback.reduce(
            (sum, item) => sum + (item.sentimentScore ?? 0),
            0
          ) / analyzedFeedback.length
        : null;

    const channelCounts: Record<string, number> = {};

    for (const item of feedback) {
      channelCounts[item.channel] =
        (channelCounts[item.channel] || 0) + 1;
    }

    const topChannels = Object.entries(channelCounts)
      .map(([channel, count]) => ({
        channel,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalFeedback,
      sentiment: {
        positive,
        neutral,
        negative,
      },
      status: {
        new: newCount,
        reviewed: reviewedCount,
        actioned: actionedCount,
      },
      averageSentimentScore,
      topChannels,
    });
  } catch (error) {
    console.error("Reports GET error:", error);

    return NextResponse.json(
      { error: "Unable to generate report data." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const userId = session.user.id;

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json(
        { error: "No feedback available to generate a report." },
        { status: 400 }
      );
    }

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

    const reviewedCount = feedback.filter(
      (item) => item.status === "REVIEWED"
    ).length;

    const actionedCount = feedback.filter(
      (item) => item.status === "ACTIONED"
    ).length;

    const analyzedFeedback = feedback.filter(
      (item) => item.sentimentScore !== null
    );

    const averageSentimentScore =
      analyzedFeedback.length > 0
        ? analyzedFeedback.reduce(
            (sum, item) => sum + (item.sentimentScore ?? 0),
            0
          ) / analyzedFeedback.length
        : null;

    const channelCounts: Record<string, number> = {};

    for (const item of feedback) {
      channelCounts[item.channel] =
        (channelCounts[item.channel] || 0) + 1;
    }

    const topChannels = Object.entries(channelCounts)
      .map(([channel, count]) => ({
        channel,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const periodStart = feedback[0].createdAt;
    const periodEnd =
      feedback[feedback.length - 1].createdAt;

    const reportData = {
      totalFeedback: feedback.length,

      sentiment: {
        positive,
        neutral,
        negative,
      },

      status: {
        new: newCount,
        reviewed: reviewedCount,
        actioned: actionedCount,
      },

      averageSentimentScore,

      topChannels,

      generatedAt: new Date().toISOString(),
    };

    const report = await prisma.report.create({
      data: {
        title: `Feedback Report - ${new Date().toLocaleDateString(
          "en-IN"
        )}`,

        periodStart,
        periodEnd,

        contentJson: reportData,

        workspaceId,

        generatedBy: userId,
      },
    });

    return NextResponse.json(report, {
      status: 201,
    });
  } catch (error) {
    console.error("Reports POST error:", error);

    return NextResponse.json(
      { error: "Unable to create report." },
      { status: 500 }
    );
  }
}
