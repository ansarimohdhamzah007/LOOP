import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyFeedback } from "@/lib/ai";

export const dynamic = "force-dynamic";

// =====================================================
// GET /api/themes
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
            feedback: {
              select: {
                sentiment: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = themes.map((theme) => {
      const positive = theme.feedback.filter(
        (item) => item.feedback.sentiment === "POS"
      ).length;

      const neutral = theme.feedback.filter(
        (item) => item.feedback.sentiment === "NEU"
      ).length;

      const negative = theme.feedback.filter(
        (item) => item.feedback.sentiment === "NEG"
      ).length;

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
// POST /api/themes
// CATEGORIZE ALL EXISTING FEEDBACK
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
    const feedbackList = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (feedbackList.length === 0) {
      return NextResponse.json(
        {
          error:
            "No feedback found in the current workspace.",
        },
        { status: 400 }
      );
    }

    // Get existing themes
    let existingThemes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    let categorized = 0;
    let linksCreated = 0;

    const processedThemes: {
      id: string;
      name: string;
    }[] = [];

    // =================================================
    // PROCESS EACH FEEDBACK
    // =================================================

    for (const feedback of feedbackList) {
      try {
        const themeNames = existingThemes.map(
          (theme) => theme.name
        );

        let analysis;

        try {
          analysis = await classifyFeedback(
            feedback.content,
            themeNames
          );
        } catch (aiError) {
          console.error(
            `AI failed for feedback ${feedback.id}:`,
            aiError
          );

          // If AI fails, use simple fallback
          analysis = {
            sentiment:
              feedback.sentiment || "NEU",
            sentimentScore:
              feedback.sentimentScore ?? 0,
            themes: [],
            featureArea: "General Feedback",
            rationale:
              "Theme generated using fallback categorization.",
          };
        }

        // ---------------------------------------------
        // Get theme names from AI
        // ---------------------------------------------

        let themeNamesToProcess = [
          ...(analysis.themes || []),
        ];

        // Feature area fallback
        if (
          themeNamesToProcess.length === 0 &&
          analysis.featureArea
        ) {
          themeNamesToProcess = [
            analysis.featureArea,
          ];
        }

        // Final fallback
        if (themeNamesToProcess.length === 0) {
          themeNamesToProcess = [
            "General Feedback",
          ];
        }

        // ---------------------------------------------
        // Update sentiment if missing
        // ---------------------------------------------

        await prisma.feedback.update({
          where: {
            id: feedback.id,
          },
          data: {
            sentiment:
              feedback.sentiment ||
              analysis.sentiment,
            sentimentScore:
              feedback.sentimentScore ??
              analysis.sentimentScore,
          },
        });

        // ---------------------------------------------
        // CREATE / MATCH THEMES
        // ---------------------------------------------

        for (const rawName of themeNamesToProcess) {
          const themeName =
            typeof rawName === "string"
              ? rawName.trim()
              : "";

          if (!themeName) {
            continue;
          }

          // Check existing theme
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

          // Create theme if missing
          if (!theme) {
            theme = await prisma.theme.create({
              data: {
                name: themeName,
                description: `${themeName} related customer feedback`,
                color: "#6366f1",
                workspaceId,
              },
            });

            // Update local theme list
            existingThemes.push({
              id: theme.id,
              name: theme.name,
            });
          }

          // -------------------------------------------
          // Check whether link already exists
          // -------------------------------------------

          const existingLink =
            await prisma.feedbackTheme.findUnique({
              where: {
                feedbackId_themeId: {
                  feedbackId: feedback.id,
                  themeId: theme.id,
                },
              },
            });

          // Create link
          if (!existingLink) {
            await prisma.feedbackTheme.create({
              data: {
                feedbackId: feedback.id,
                themeId: theme.id,
                confidence: 1,
              },
            });

            linksCreated++;
          }

          if (
            !processedThemes.some(
              (item) => item.id === theme.id
            )
          ) {
            processedThemes.push({
              id: theme.id,
              name: theme.name,
            });
          }
        }

        categorized++;
      } catch (feedbackError) {
        console.error(
          `Failed to categorize feedback ${feedback.id}:`,
          feedbackError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Feedback categorized successfully.",
      feedbackProcessed: categorized,
      linksCreated,
      themesCreatedOrUsed: processedThemes,
    });
  } catch (error) {
    console.error(
      "Themes POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to categorize feedback.",
      },
      { status: 500 }
    );
  }
}