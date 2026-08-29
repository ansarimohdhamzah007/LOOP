import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function analyzeSentiment(text: string) {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "helpful",
    "love",
    "happy",
    "awesome",
    "perfect",
    "fast",
    "easy",
    "friendly",
    "satisfied",
    "best",
    "wonderful",
  ];

  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "hate",
    "angry",
    "slow",
    "late",
    "delay",
    "delayed",
    "problem",
    "issue",
    "worst",
    "horrible",
    "disappointed",
    "unhappy",
    "difficult",
  ];

  const words = text.toLowerCase().split(/\s+/);

  let positive = 0;
  let negative = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:"()]/g, "");

    if (positiveWords.includes(cleanWord)) {
      positive++;
    }

    if (negativeWords.includes(cleanWord)) {
      negative++;
    }
  }

  if (positive === 0 && negative === 0) {
    return {
      sentiment: "NEU" as const,
      sentimentScore: 0.5,
    };
  }

  if (positive > negative) {
    const score = Math.min(
      0.99,
      0.5 + positive * 0.1 - negative * 0.05
    );

    return {
      sentiment: "POS" as const,
      sentimentScore: Number(score.toFixed(2)),
    };
  }

  if (negative > positive) {
    const score = Math.min(
      0.99,
      0.5 + negative * 0.1 - positive * 0.05
    );

    return {
      sentiment: "NEG" as const,
      sentimentScore: Number(score.toFixed(2)),
    };
  }

  return {
    sentiment: "NEU" as const,
    sentimentScore: 0.5,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Get feedback error:", error);

    return NextResponse.json(
      { error: "Unable to fetch feedback." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const content = body.content?.trim();
    const channel = body.channel?.trim();
    const customerLabel = body.customerLabel?.trim();
    const sourceRef = body.sourceRef?.trim();

    if (!content || !channel) {
      return NextResponse.json(
        {
          error:
            "Feedback content and channel are required.",
        },
        { status: 400 }
      );
    }

    // Automatically analyze sentiment
    const analysis = analyzeSentiment(content);

    const feedback = await prisma.feedback.create({
      data: {
        content,
        channel,
        customerLabel: customerLabel || null,
        sourceRef: sourceRef || null,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(feedback, {
      status: 201,
    });
  } catch (error) {
    console.error("Create feedback error:", error);

    return NextResponse.json(
      { error: "Unable to create feedback." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = body.id;
    const status = body.status;

    if (!id || !status) {
      return NextResponse.json(
        {
          error: "Feedback ID and status are required.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "NEW",
      "REVIEWED",
      "ACTIONED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid feedback status." },
        { status: 400 }
      );
    }

    const existingFeedback =
      await prisma.feedback.findFirst({
        where: {
          id,
          workspaceId: session.user.workspaceId,
        },
      });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found." },
        { status: 404 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error("Update feedback error:", error);

    return NextResponse.json(
      { error: "Unable to update feedback." },
      { status: 500 }
    );
  }
}