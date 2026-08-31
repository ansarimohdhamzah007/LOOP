"use client";

import { useEffect, useState } from "react";

type ReportData = {
  totalFeedback: number;

  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };

  status: {
    new: number;
    reviewed: number;
    actioned: number;
  };

  averageSentimentScore: number | null;

  topChannels: {
    channel: string;
    count: number;
  }[];
};

type SavedReport = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);

  const [savedReports, setSavedReports] = useState<
    SavedReport[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadReportData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load reports."
        );
      }

      setReport(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedReports() {
    try {
      const response = await fetch("/api/reports/saved");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setSavedReports(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadReportData();
    loadSavedReports();
  }, []);

  async function generateReport() {
    try {
      setGenerating(true);
      setError("");

      const response = await fetch("/api/reports", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate report."
        );
      }

      alert("Report generated successfully.");

      await loadSavedReports();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate report."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Analyze customer feedback and generate reports.
            </p>
          </div>

          <button
            onClick={generateReport}
            disabled={
              generating ||
              !report ||
              report.totalFeedback === 0
            }
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : "Generate Report"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading analytics...
          </div>
        ) : !report ? (
          <div className="rounded-xl border bg-white p-12 text-center text-gray-500 shadow-sm">
            Unable to load analytics.
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Feedback
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {report.totalFeedback}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Positive
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {report.sentiment.positive}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Neutral
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {report.sentiment.neutral}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Negative
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {report.sentiment.negative}
                </p>
              </div>

            </div>

            {/* Analysis */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* Sentiment */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sentiment Analysis
                </h2>

                <div className="mt-6 space-y-5">

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Positive</span>

                      <span className="font-medium">
                        {report.sentiment.positive}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width:
                            report.totalFeedback > 0
                              ? `${
                                  (report.sentiment.positive /
                                    report.totalFeedback) *
                                  100
                                }%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Neutral</span>

                      <span className="font-medium">
                        {report.sentiment.neutral}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-yellow-500"
                        style={{
                          width:
                            report.totalFeedback > 0
                              ? `${
                                  (report.sentiment.neutral /
                                    report.totalFeedback) *
                                  100
                                }%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Negative</span>

                      <span className="font-medium">
                        {report.sentiment.negative}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width:
                            report.totalFeedback > 0
                              ? `${
                                  (report.sentiment.negative /
                                    report.totalFeedback) *
                                  100
                                }%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                </div>

                <div className="mt-8 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Average Sentiment Score
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {report.averageSentimentScore !== null
                      ? report.averageSentimentScore.toFixed(2)
                      : "Not analyzed"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Feedback Status
                </h2>

                <div className="mt-6 grid grid-cols-3 gap-4">

                  <div className="rounded-xl bg-gray-50 p-5 text-center">
                    <p className="text-sm text-gray-500">
                      New
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {report.status.new}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-5 text-center">
                    <p className="text-sm text-gray-500">
                      Reviewed
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {report.status.reviewed}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-5 text-center">
                    <p className="text-sm text-gray-500">
                      Actioned
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {report.status.actioned}
                    </p>
                  </div>

                </div>

                <h3 className="mt-8 text-sm font-semibold text-gray-900">
                  Feedback Channels
                </h3>

                <div className="mt-4 space-y-3">
                  {report.topChannels.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No channel data available.
                    </p>
                  ) : (
                    report.topChannels.map((item) => (
                      <div
                        key={item.channel}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <span className="text-sm text-gray-700">
                          {item.channel}
                        </span>

                        <span className="font-semibold text-gray-900">
                          {item.count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Saved Reports */}
            <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Generated Reports
              </h2>

              {savedReports.length === 0 ? (
                <div className="mt-5 rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No reports generated yet.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Click &quot;Generate Report&quot; to create your first report.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">
                          Report
                        </th>

                        <th className="px-4 py-3 font-semibold">
                          Period
                        </th>

                        <th className="px-4 py-3 font-semibold">
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {savedReports.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {item.title}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {new Date(
                              item.periodStart
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              item.periodEnd
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {new Date(
                              item.createdAt
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}