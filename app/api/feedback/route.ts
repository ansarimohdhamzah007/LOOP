import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyFeedback } from "@/lib/ai";

export const dynamic = "force-dynamic";

// =====================================================
// GET THEMES
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

    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      include: {
        feedback: {
          include: {
            feedback: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = themes.map((theme) => {
      let positive = 0;
      let neutral = 0;
      let negative = 0;

      for (const relation of theme.feedback) {
        const sentiment = relation.feedback.sentiment;

        if (sentiment === "POS") positive++;
        if (sentiment === "NEU") neutral++;
        if (sentiment === "NEG") negative++;
      }

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        feedbackCount: theme.feedback.length,
        sentiment: {
          positive,
          neutral,
          negative,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Themes GET error:", error);

    return NextResponse.json(
      { error: "Unable to load themes." },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - CATEGORIZE ALL EXISTING FEEDBACK
// =====================================================

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    // Get all feedback from current workspace
    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json({
        message: "No feedback found.",
        processed: 0,
        themesCreated: 0,
        linksCreated: 0,
      });
    }

    let processed = 0;
    let themesCreated = 0;
    let linksCreated = 0;

    // =================================================
    // PROCESS EACH FEEDBACK
    // =================================================

    for (const item of feedback) {
      try {
        // Get current workspace themes
        const existingThemes = await prisma.theme.findMany({
          where: {
            workspaceId,
          },
          select: {
            id: true,
            name: true,
          },
        });

        const themeNames = existingThemes.map(
          (theme) => theme.name
        );

        // ---------------------------------------------
        // AI CLASSIFICATION
        // ---------------------------------------------

        const analysis = await classifyFeedback(
          item.content,
          themeNames
        );

        // ---------------------------------------------
        // UPDATE SENTIMENT
        // ---------------------------------------------

        await prisma.feedback.update({
          where: {
            id: item.id,
          },
          data: {
            sentiment: analysis.sentiment,
            sentimentScore: analysis.sentimentScore,
          },
        });

        // ---------------------------------------------
        // THEMES
        // ---------------------------------------------

        let themeNamesToProcess = [
          ...(analysis.themes || []),
        ];

        // Fallback to featureArea
        if (
          themeNamesToProcess.length === 0 &&
          analysis.featureArea
        ) {
          themeNamesToProcess = [
            analysis.featureArea,
          ];
        }

        // ---------------------------------------------
        // CREATE / FIND THEMES
        // ---------------------------------------------

        for (const rawThemeName of themeNamesToProcess) {
          const themeName =
            typeof rawThemeName === "string"
              ? rawThemeName.trim()
              : "";

          if (!themeName) {
            continue;
          }

          let theme = await prisma.theme.findFirst({
            where: {
              workspaceId,
              name: {
                equals: themeName,
                mode: "insensitive",
              },
            },
          });

          // Create theme if not found
          if (!theme) {
            theme = await prisma.theme.create({
              data: {
                name: themeName,
                description:
                  `${themeName} related customer feedback`,
                color: "#6366f1",
                workspaceId,
              },
            });

            themesCreated++;
          }

          // -------------------------------------------
          // CHECK EXISTING LINK
          // -------------------------------------------

          const existingLink =
            await prisma.feedbackTheme.findFirst({
              where: {
                feedbackId: item.id,
                themeId: theme.id,
              },
            });

          // -------------------------------------------
          // CREATE LINK
          // -------------------------------------------

          if (!existingLink) {
            await prisma.feedbackTheme.create({
              data: {
                feedbackId: item.id,
                themeId: theme.id,
                confidence: 1,
              },
            });

            linksCreated++;
          }
        }

        processed++;
      } catch (error) {
        console.error(
          `Failed to process feedback ${item.id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      message: "Feedback categorized successfully.",
      processed,
      totalFeedback: feedback.length,
      themesCreated,
      linksCreated,
    });
  } catch (error) {
    console.error("Themes POST error:", error);

    return NextResponse.json(
      {
        error: "Unable to categorize feedback.",
      },
      { status: 500 }
    );
  }
}