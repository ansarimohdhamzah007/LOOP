"use client";

import { useEffect, useState } from "react";

type TrendItem = {
  date: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  averageScore: number | null;
};

type ChannelItem = {
  channel: string;
  count: number;
};

type TrendsData = {
  totalFeedback: number;

  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };

  averageSentimentScore: number | null;

  trend: TrendItem[];

  channels: ChannelItem[];
};

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD TRENDS
  // =====================================================

  async function loadTrends() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/trends", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load trends."
        );
      }

      setData(result);
    } catch (error) {
      console.error("Trends page error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load trends."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrends();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">
              Loading trends...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-700">
              Unable to load trends
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadTrends}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // EMPTY DATA
  // =====================================================

  if (!data || data.totalFeedback === 0) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Trends
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track sentiment and feedback trends over time.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No trend data available
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add feedback to start seeing trends.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const total = data.totalFeedback;

  const positivePercentage =
    total > 0
      ? Math.round(
          (data.sentiment.positive / total) * 100
        )
      : 0;

  const neutralPercentage =
    total > 0
      ? Math.round(
          (data.sentiment.neutral / total) * 100
        )
      : 0;

  const negativePercentage =
    total > 0
      ? Math.round(
          (data.sentiment.negative / total) * 100
        )
      : 0;

  const score =
    data.averageSentimentScore !== null
      ? data.averageSentimentScore.toFixed(2)
      : "N/A";

  const maxDailyFeedback =
    data.trend.length > 0
      ? Math.max(
          ...data.trend.map((item) => item.total),
          1
        )
      : 1;

  const maxChannelCount =
    data.channels.length > 0
      ? Math.max(
          ...data.channels.map((item) => item.count),
          1
        )
      : 1;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trends
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track sentiment and feedback trends over time.
            </p>
          </div>

          <button
            onClick={loadTrends}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {total}
            </p>
          </div>

          {/* Positive */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Positive
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.positive}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {positivePercentage}% of feedback
            </p>
          </div>

          {/* Neutral */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Neutral
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.neutral}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {neutralPercentage}% of feedback
            </p>
          </div>

          {/* Negative */}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Negative
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.negative}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {negativePercentage}% of feedback
            </p>
          </div>
        </div>

        {/* =================================================
            AVERAGE SENTIMENT
        ================================================= */}

        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Average Sentiment Score
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Overall sentiment across analyzed feedback.
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {score}
              </p>

              <p className="text-xs text-gray-500">
                Range: -1 to +1
              </p>
            </div>
          </div>

          {/* Score bar */}

          <div className="mt-6">
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-900 transition-all"
                style={{
                  width:
                    data.averageSentimentScore !== null
                      ? `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((data.averageSentimentScore + 1) /
                              2) *
                              100
                          )
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>-1 Negative</span>
              <span>0 Neutral</span>
              <span>+1 Positive</span>
            </div>
          </div>
        </div>

        {/* =================================================
            DAILY TREND
        ================================================= */}

        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Feedback Trend
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Feedback volume and sentiment by day.
            </p>
          </div>

          {data.trend.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No daily trend data available.
            </p>
          ) : (
            <div className="space-y-5">

              {data.trend.map((item) => {
                const width =
                  (item.total / maxDailyFeedback) * 100;

                return (
                  <div key={item.date}>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {new Date(
                          `${item.date}T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <span className="text-gray-500">
                        {item.total} feedback
                      </span>
                    </div>

                    <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-100">
                      <div
                        className="flex h-full items-center justify-end rounded-lg bg-gray-900 px-3 text-xs font-medium text-white"
                        style={{
                          width: `${Math.max(
                            width,
                            8
                          )}%`,
                        }}
                      >
                        {item.total}
                      </div>
                    </div>

                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>
                        Positive: {item.positive}
                      </span>

                      <span>
                        Neutral: {item.neutral}
                      </span>

                      <span>
                        Negative: {item.negative}
                      </span>

                      <span>
                        Score:{" "}
                        {item.averageScore !== null
                          ? item.averageScore.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =================================================
            CHANNEL DISTRIBUTION
        ================================================= */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Channel Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Where your customer feedback is coming from.
            </p>
          </div>

          {data.channels.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No channel data available.
            </p>
          ) : (
            <div className="space-y-5">

              {data.channels.map((item) => {
                const width =
                  (item.count / maxChannelCount) * 100;

                const percentage =
                  total > 0
                    ? Math.round(
                        (item.count / total) * 100
                      )
                    : 0;

                return (
                  <div key={item.channel}>

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm font-medium text-gray-700">
                        {item.channel}
                      </span>

                      <span className="text-sm text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gray-900"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}