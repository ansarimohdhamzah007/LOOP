"use client";

import { useEffect, useState } from "react";

type Theme = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  feedbackCount: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorizing, setCategorizing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // LOAD THEMES
  // =====================================================

  async function loadThemes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/themes", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load themes."
        );
      }

      setThemes(data);
    } catch (error) {
      console.error("Load themes error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load themes."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // CATEGORIZE EXISTING FEEDBACK
  // =====================================================

  async function categorizeFeedback() {
    try {
      setCategorizing(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/themes", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to categorize feedback."
        );
      }

      setMessage(
        data.message ||
          "Feedback categorized successfully."
      );

      // Reload themes after categorization
      await loadThemes();
    } catch (error) {
      console.error(
        "Categorization error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to categorize feedback."
      );
    } finally {
      setCategorizing(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadThemes();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Themes
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Understand the main topics appearing in
              customer feedback.
            </p>
          </div>

          {/* CATEGORIZE BUTTON */}
          <button
            type="button"
            onClick={categorizeFeedback}
            disabled={categorizing}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {categorizing
              ? "Categorizing..."
              : "Categorize Existing Feedback"}
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading themes...
          </div>
        ) : themes.length === 0 ? (
          /* NO THEMES */
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              No themes found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Themes will appear here once feedback has
              been categorized.
            </p>

            <button
              type="button"
              onClick={categorizeFeedback}
              disabled={categorizing}
              className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {categorizing
                ? "Categorizing..."
                : "Categorize Existing Feedback"}
            </button>
          </div>
        ) : (
          /* THEMES */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {themes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >

                {/* THEME HEADER */}
                <div className="mb-4 flex items-start justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {theme.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {theme.description ||
                        "Customer feedback theme"}
                    </p>
                  </div>

                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        theme.color ||
                        "#18181b",
                    }}
                  />
                </div>

                {/* FEEDBACK COUNT */}
                <div className="mb-5 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Feedback
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {theme.feedbackCount}
                  </p>
                </div>

                {/* SENTIMENT */}
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Sentiment
                  </p>

                  <div className="space-y-2 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Positive
                      </span>

                      <span className="font-medium text-gray-900">
                        {theme.sentiment.positive}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Neutral
                      </span>

                      <span className="font-medium text-gray-900">
                        {theme.sentiment.neutral}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Negative
                      </span>

                      <span className="font-medium text-gray-900">
                        {theme.sentiment.negative}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}