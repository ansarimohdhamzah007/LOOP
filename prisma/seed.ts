
import {
  PrismaClient,
  UserRole,
  FeedbackStatus,
  Sentiment,
} from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting LOOP seed...");

  // Demo password — only for local/demo accounts.
  const passwordHash = await bcrypt.hash("demo-password", 10);

  // 1. Demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "LOOP Demo Workspace",
    },
  });

  console.log("✅ Workspace created");

  // 2. Three users — one for each role
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@loop.demo",
        passwordHash,
        role: UserRole.ADMIN,
        workspaceId: workspace.id,
      },
    }),

    prisma.user.create({
      data: {
        name: "Analyst User",
        email: "analyst@loop.demo",
        passwordHash,
        role: UserRole.ANALYST,
        workspaceId: workspace.id,
      },
    }),

    prisma.user.create({
      data: {
        name: "Viewer User",
        email: "viewer@loop.demo",
        passwordHash,
        role: UserRole.VIEWER,
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // 3. Demo themes
  const themeNames = [
    "Pricing",
    "Customer Support",
    "Product Quality",
    "Performance",
    "User Experience",
    "Features",
  ];

  const themes = await Promise.all(
    themeNames.map((name) =>
      prisma.theme.create({
        data: {
          name,
          description: `${name} related customer feedback`,
          color: "#6366f1",
          workspaceId: workspace.id,
        },
      }),
    ),
  );

  console.log(`✅ Created ${themes.length} themes`);

  // 4. Realistic feedback templates
  const feedbackTemplates = [
    "The product is easy to use and the interface feels intuitive.",
    "Customer support took too long to respond to my issue.",
    "The pricing is reasonable compared to similar products.",
    "The application becomes slow when I have many records.",
    "I would love to see more reporting features.",
    "The latest update improved the overall experience.",
    "The dashboard is useful but could be easier to navigate.",
    "The product quality has been consistently good.",
    "It took me a while to understand how this feature works.",
    "Support resolved my problem quickly and professionally.",
    "The subscription feels expensive for the features provided.",
    "The search functionality is fast and accurate.",
    "I had trouble finding the settings page.",
    "The mobile experience needs improvement.",
    "The new features are useful for our team.",
    "I received excellent help from the support team.",
    "The application crashed while I was uploading data.",
    "The reports give us useful information for decision making.",
    "I would like more customization options.",
    "The onboarding process was simple and clear.",
  ];

  const channels = [
    "EMAIL",
    "WEB",
    "CHAT",
    "SURVEY",
    "SOCIAL",
  ];

  const feedbackData = Array.from({ length: 120 }, (_, index) => {
    const content = feedbackTemplates[index % feedbackTemplates.length];

    const sentimentValues: Sentiment[] = [
      Sentiment.POS,
      Sentiment.NEU,
      Sentiment.NEG,
    ];

    const sentiment = sentimentValues[index % 3];

    const sentimentScore =
      sentiment === Sentiment.POS
        ? 0.6 + (index % 4) * 0.1
        : sentiment === Sentiment.NEG
          ? -(0.6 + (index % 4) * 0.1)
          : 0;

    const status =
      index % 3 === 0
        ? FeedbackStatus.NEW
        : index % 3 === 1
          ? FeedbackStatus.REVIEWED
          : FeedbackStatus.ACTIONED;

    return {
      content,
      channel: channels[index % channels.length],
      sourceRef: `demo-${index + 1}`,
      customerLabel: `Customer ${index + 1}`,
      sentiment,
      sentimentScore,
      status,
      workspaceId: workspace.id,
      createdAt: new Date(
        Date.now() - (120 - index) * 24 * 60 * 60 * 1000,
      ),
    };
  });

  await prisma.feedback.createMany({
    data: feedbackData,
  });

  console.log("✅ Created 120 feedback items");

  console.log("🌱 LOOP seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
