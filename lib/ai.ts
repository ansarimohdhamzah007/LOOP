import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/*
 * =====================================================
 * GEMINI CLIENT
 * =====================================================
 */

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
    })
  : null;

/*
 * =====================================================
 * CLASSIFICATION SCHEMA
 * =====================================================
 */

const classificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),

  sentimentScore: z.number().min(-1).max(1),

  themes: z.array(z.string()).min(1).max(5),

  featureArea: z.string().nullable().optional(),

  rationale: z.string(),
});

/*
 * =====================================================
 * TYPE
 * =====================================================
 */

export type FeedbackClassification =
  z.infer<typeof classificationSchema>;

/*
 * =====================================================
 * CLASSIFY FEEDBACK
 * =====================================================
 */

export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<FeedbackClassification> {
  /*
   * ---------------------------------------------------
   * CHECK API KEY
   * ---------------------------------------------------
   */

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  /*
   * ---------------------------------------------------
   * CHECK CLIENT
   * ---------------------------------------------------
   */

  if (!ai) {
    throw new Error(
      "Gemini AI client could not be initialized."
    );
  }

  /*
   * ---------------------------------------------------
   * EXISTING THEMES
   * ---------------------------------------------------
   */

  const themeList =
    existingThemes.length > 0
      ? existingThemes.join(", ")
      : "No existing themes.";

  /*
   * ---------------------------------------------------
   * PROMPT
   * ---------------------------------------------------
   */

  const prompt = `
You are the AI classification engine for LOOP,
a customer feedback analytics platform.

Analyze the following customer feedback.

CUSTOMER FEEDBACK:
${content}

EXISTING THEMES:
${themeList}

CLASSIFICATION RULES:

1. Return exactly one sentiment:
POS, NEU, or NEG.

2. sentimentScore must be between -1 and 1.

3. Always return at least one theme.

4. Prefer an existing theme if it clearly matches.

5. If no existing theme matches, create a short,
meaningful theme.

6. Normally return only 1-3 themes.

7. Identify the main feature area.

8. If no feature area can be identified,
return null.

9. Give a short one-sentence rationale.

VALID THEME EXAMPLES:

Support
Pricing
Delivery
Performance
UX
Billing
Account
Features
Product
Authentication
Mobile App
Website

SENTIMENT:

POS = positive
NEU = neutral, factual, or mixed
NEG = negative

SCORE:

-1 = extremely negative
-0.5 = moderately negative
0 = neutral
0.5 = moderately positive
1 = extremely positive

IMPORTANT:

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code fences.
Do NOT add any text outside the JSON.

Return exactly this structure:

{
  "sentiment": "NEG",
  "sentimentScore": -0.75,
  "themes": ["Delivery"],
  "featureArea": "Delivery",
  "rationale": "The customer is unhappy because the delivery was delayed."
}
`;

  /*
   * ---------------------------------------------------
   * GEMINI REQUEST
   * ---------------------------------------------------
   */

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Gemini classification attempt ${attempt}/3`
      );

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      });

      /*
       * -------------------------------------------------
       * RESPONSE TEXT
       * -------------------------------------------------
       */

      const text = response.text?.trim();

      if (!text) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      console.log(
        `Gemini classification succeeded on attempt ${attempt}`
      );

      console.log(
        "Gemini classification response:",
        text
      );

      /*
       * -------------------------------------------------
       * CLEAN RESPONSE
       * -------------------------------------------------
       */

      let cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /*
       * -------------------------------------------------
       * EXTRACT JSON OBJECT
       * -------------------------------------------------
       */

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        cleaned = cleaned.slice(
          firstBrace,
          lastBrace + 1
        );
      }

      /*
       * -------------------------------------------------
       * PARSE JSON
       * -------------------------------------------------
       */

      let parsed: unknown;

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(
          "Gemini JSON parsing failed:"
        );

        console.error(cleaned);

        throw new Error(
          "Gemini returned invalid JSON."
        );
      }

      /*
       * -------------------------------------------------
       * VALIDATE RESPONSE
       * -------------------------------------------------
       */

      const validation =
        classificationSchema.safeParse(parsed);

      if (!validation.success) {
        console.error(
          "Gemini response validation failed:"
        );

        console.error(
          validation.error.issues
        );

        throw new Error(
          "Gemini returned incomplete classification data."
        );
      }

      /*
       * -------------------------------------------------
       * NORMALIZE THEMES
       * -------------------------------------------------
       */

      const themes = validation.data.themes
        .map((theme) => theme.trim())
        .filter(Boolean);

      if (themes.length === 0) {
        throw new Error(
          "Gemini returned no valid themes."
        );
      }

      /*
       * -------------------------------------------------
       * FINAL RESULT
       * -------------------------------------------------
       */

      return {
        sentiment:
          validation.data.sentiment,

        sentimentScore:
          validation.data.sentimentScore,

        themes,

        featureArea:
          validation.data.featureArea ?? null,

        rationale:
          validation.data.rationale.trim(),
      };
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini classification attempt ${attempt} failed:`,
        error
      );

      if (attempt < 3) {
        const delay = attempt * 1500;

        console.log(
          `Retrying Gemini in ${delay / 1000} seconds...`
        );

        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }

  /*
   * ---------------------------------------------------
   * ALL ATTEMPTS FAILED
   * ---------------------------------------------------
   */

  console.error(
    "Gemini classification failed after 3 attempts:",
    lastError
  );

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    "Gemini classification failed."
  );
}