import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const classificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),

  sentimentScore: z
    .number()
    .min(-1)
    .max(1),

  themes: z
    .array(z.string())
    .min(1)
    .max(5),

  featureArea: z
    .string()
    .nullable()
    .optional(),

  rationale: z.string(),
});

export type FeedbackClassification = z.infer<
  typeof classificationSchema
>;

export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<FeedbackClassification> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured"
    );
  }

  const themeList =
    existingThemes.length > 0
      ? existingThemes.join(", ")
      : "No themes exist yet. You MUST create suitable themes.";

  const prompt = `
You are the AI classification engine for LOOP,
a customer feedback analytics platform.

Analyze this customer feedback:

CUSTOMER FEEDBACK:
${content}

EXISTING THEMES:
${themeList}

IMPORTANT THEME RULES:

1. Always return at least ONE theme.

2. If an existing theme clearly matches the feedback,
   use that existing theme.

3. Choose a relevant existing theme whenever possible.

4. If no existing theme is suitable, create a new concise theme name based on the feedback.

5. Theme names should be short and meaningful.
   Examples:
   Support, Pricing, Delivery, Performance, UX, Billing, Account, Features

6. Do not create multiple themes unless the feedback clearly belongs to multiple topics.
7. A feedback can have multiple relevant themes,
   but normally return only 1-3 themes.

SENTIMENT RULES:

sentiment must be exactly:

POS
NEU
NEG

sentimentScore must be between -1 and 1.

-1 = extremely negative
0 = neutral
+1 = extremely positive

FEATURE AREA:

Identify the main product or business area.

Examples:
Customer Support
Delivery
Product
Pricing
Billing
UX
Account
Performance

RATIONALE:

Give one short sentence explaining the classification.

RETURN ONLY VALID JSON.

Do not use markdown.
Do not add explanations outside JSON.

Use exactly this structure:

{
  "sentiment": "NEG",
  "sentimentScore": -0.75,
  "themes": ["Delivery"],
  "featureArea": "Delivery",
  "rationale": "The customer is unhappy because the delivery was significantly delayed."
}
`;

  const response =
    await anthropic.messages.create({
      model: "claude-sonnet-4-6",

      max_tokens: 500,

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

  const text = response.content
    .filter(
      (block) => block.type === "text"
    )
    .map(
      (block) => block.text
    )
    .join("")
    .trim();

  const cleaned = text
    .replace(
      /^```json\s*/i,
      ""
    )
    .replace(
      /^```\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "AI JSON parsing failed:",
      cleaned
    );

    throw new Error(
      "AI returned invalid JSON"
    );
  }

  return classificationSchema.parse(
    parsed
  );
}