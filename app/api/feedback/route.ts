import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyFeedback } from "@/lib/ai";

export const dynamic = "force-dynamic";

// =====================================================
// GET - LOAD FEEDBACK
// =====================================================

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
      select: {
        id: true,
        content: true,
        channel: true,
        customerLabel: true,
        sourceRef: true,
        sentiment: true,
        sentimentScore: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to load feedback.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST - CREATE NEW FEEDBACK + AI ANALYSIS
// =====================================================

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const workspaceId =
      session.user.workspaceId;

    // -------------------------------------------------
    // READ REQUEST BODY
    // -------------------------------------------------

    const body = await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    const channel =
      typeof body.channel === "string" &&
      body.channel.trim()
        ? body.channel.trim()
        : "Other";

    const customerLabel =
      typeof body.customerLabel === "string"
        ? body.customerLabel.trim() || null
        : null;

    const sourceRef =
      typeof body.sourceRef === "string"
        ? body.sourceRef.trim() || null
        : null;

    if (!content) {
      return NextResponse.json(
        {
          error: "Feedback content is required.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // GET EXISTING THEMES
    // -------------------------------------------------

    const existingThemes =
      await prisma.theme.findMany({
        where: {
          workspaceId,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

    const existingThemeNames =
      existingThemes.map(
        (theme) => theme.name
      );

    // -------------------------------------------------
    // CREATE FEEDBACK FIRST
    // -------------------------------------------------

    const feedback =
      await prisma.feedback.create({
        data: {
          content,
          channel,
          customerLabel,
          sourceRef,
          status: "NEW",
          workspaceId,
        },
      });

    console.log(
      `Feedback created: ${feedback.id}`
    );

    // -------------------------------------------------
    // AI CLASSIFICATION
    // -------------------------------------------------

    let analysis: Awaited<
      ReturnType<typeof classifyFeedback>
    > | null = null;

    try {
      console.log(
        `Starting AI classification for ${feedback.id}`
      );

      analysis =
        await classifyFeedback(
          content,
          existingThemeNames
        );

      console.log(
        "AI classification result:",
        analysis
      );
    } catch (error) {
      console.error(
        `AI classification failed for ${feedback.id}:`,
        error
      );

      /*
       * IMPORTANT:
       * Feedback has already been saved.
       *
       * If AI fails, we keep the feedback in DB
       * instead of deleting it.
       */

      const savedFeedback =
        await prisma.feedback.findUnique({
          where: {
            id: feedback.id,
          },
          select: {
            id: true,
            content: true,
            channel: true,
            customerLabel: true,
            sourceRef: true,
            sentiment: true,
            sentimentScore: true,
            status: true,
            createdAt: true,
          },
        });

      return NextResponse.json(
        {
          ...savedFeedback,
          aiAnalyzed: false,
          aiError:
            "AI classification failed. Feedback was saved successfully.",
        },
        {
          status: 201,
        }
      );
    }

    // -------------------------------------------------
    // UPDATE SENTIMENT
    // -------------------------------------------------

    await prisma.feedback.update({
      where: {
        id: feedback.id,
      },
      data: {
        sentiment: analysis.sentiment,
        sentimentScore:
          analysis.sentimentScore,
      },
    });

    console.log(
      `Sentiment saved for ${feedback.id}`
    );

    // -------------------------------------------------
    // PREPARE THEMES
    // -------------------------------------------------

    let themeNamesToProcess =
      Array.isArray(analysis.themes)
        ? analysis.themes
        : [];

    /*
     * Fallback:
     * If Gemini somehow doesn't return themes,
     * use featureArea.
     */

    if (
      themeNamesToProcess.length === 0 &&
      analysis.featureArea
    ) {
      themeNamesToProcess = [
        analysis.featureArea,
      ];
    }

    // -------------------------------------------------
    // CREATE / FIND THEMES
    // -------------------------------------------------

    for (const rawThemeName of themeNamesToProcess) {
      const themeName =
        typeof rawThemeName === "string"
          ? rawThemeName.trim()
          : "";

      if (!themeName) {
        continue;
      }

      // -----------------------------------------------
      // FIND EXISTING THEME
      // -----------------------------------------------

      let theme =
        await prisma.theme.findFirst({
          where: {
            workspaceId,
            name: {
              equals: themeName,
              mode: "insensitive",
            },
          },
        });

      // -----------------------------------------------
      // CREATE THEME IF NEEDED
      // -----------------------------------------------

      if (!theme) {
        theme =
          await prisma.theme.create({
            data: {
              name: themeName,
              description:
                `${themeName} related customer feedback`,
              color: "#6366f1",
              workspaceId,
            },
          });

        console.log(
          `Created new theme: ${themeName}`
        );
      }

      // -----------------------------------------------
      // CHECK EXISTING FEEDBACK-THEME LINK
      // -----------------------------------------------

      const existingLink =
        await prisma.feedbackTheme.findUnique({
          where: {
            feedbackId_themeId: {
              feedbackId: feedback.id,
              themeId: theme.id,
            },
          },
        });

      // -----------------------------------------------
      // CREATE LINK
      // -----------------------------------------------

      if (!existingLink) {
        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId: theme.id,
            confidence: 1,
          },
        });

        console.log(
          `Linked ${feedback.id} -> ${theme.name}`
        );
      }
    }

    // -------------------------------------------------
    // GET FINAL FEEDBACK
    // -------------------------------------------------

    const finalFeedback =
      await prisma.feedback.findUnique({
        where: {
          id: feedback.id,
        },
        select: {
          id: true,
          content: true,
          channel: true,
          customerLabel: true,
          sourceRef: true,
          sentiment: true,
          sentimentScore: true,
          status: true,
          createdAt: true,
        },
      });

    // -------------------------------------------------
    // RETURN SUCCESS
    // -------------------------------------------------

    return NextResponse.json(
      {
        ...finalFeedback,
        aiAnalyzed: true,
        analysis: {
          themes: analysis.themes,
          featureArea:
            analysis.featureArea ?? null,
          rationale: analysis.rationale,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Feedback POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create feedback.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH - UPDATE FEEDBACK STATUS
// =====================================================

export async function PATCH(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const workspaceId =
      session.user.workspaceId;

    // -------------------------------------------------
    // READ BODY
    // -------------------------------------------------

    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status = body.status;

    if (!id) {
      return NextResponse.json(
        {
          error: "Feedback ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // VALIDATE STATUS
    // -------------------------------------------------

    const validStatuses = [
      "NEW",
      "REVIEWED",
      "ACTIONED",
    ] as const;

    if (
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid feedback status.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // CHECK FEEDBACK BELONGS TO WORKSPACE
    // -------------------------------------------------

    const existingFeedback =
      await prisma.feedback.findFirst({
        where: {
          id,
          workspaceId,
        },
        select: {
          id: true,
        },
      });

    if (!existingFeedback) {
      return NextResponse.json(
        {
          error: "Feedback not found.",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------

    const updated =
      await prisma.feedback.update({
        where: {
          id,
        },
        data: {
          status,
        },
        select: {
          id: true,
          status: true,
        },
      });

    // -------------------------------------------------
    // RETURN SUCCESS
    // -------------------------------------------------

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error(
      "Feedback PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update feedback.",
      },
      {
        status: 500,
      }
    );
  }
}