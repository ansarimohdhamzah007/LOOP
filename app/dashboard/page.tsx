"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

type DashboardStats = {
  totalFeedback: number;
  positive: number;
  neutral: number;
  negative: number;
  newFeedback: number;
  reviewed: number;
  actioned: number;
  averageSentimentScore: number;
};

type RecentFeedback = {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: "POS" | "NEU" | "NEG" | null;
  sentimentScore: number | null;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  createdAt: string;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentFeedback: RecentFeedback[];
};

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard");

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load dashboard."
        );
      }

      setData(result);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.stats;

  return (
    <main className="min-h-screen bg-zinc-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              LOOP Dashboard
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Feedback management and analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/feedback"
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              View Feedback
            </Link>

            <LogoutButton />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-zinc-500">
              Loading dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Analytics Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {/* Total */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Total Feedback
                </p>

                <p className="mt-3 text-4xl font-bold text-zinc-900">
                  {stats?.totalFeedback ?? 0}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  All feedback in workspace
                </p>
              </div>

              {/* Positive */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Positive
                </p>

                <p className="mt-3 text-4xl font-bold text-green-600">
                  {stats?.positive ?? 0}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Positive feedback
                </p>
              </div>

              {/* Neutral */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Neutral
                </p>

                <p className="mt-3 text-4xl font-bold text-yellow-600">
                  {stats?.neutral ?? 0}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Neutral feedback
                </p>
              </div>

              {/* Negative */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Negative
                </p>

                <p className="mt-3 text-4xl font-bold text-red-600">
                  {stats?.negative ?? 0}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Negative feedback
                </p>
              </div>
            </div>

            {/* Second Row */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              {/* Sentiment Overview */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      Sentiment Overview
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Overall feedback sentiment
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-zinc-900">
                      {stats?.averageSentimentScore ?? 0}%
                    </p>

                    <p className="text-xs text-zinc-500">
                      sentiment score
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">

                  {/* Positive */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-600">
                        Positive
                      </span>

                      <span className="font-medium text-zinc-900">
                        {stats?.positive ?? 0}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${
                            stats?.totalFeedback
                              ? (stats.positive /
                                  stats.totalFeedback) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Neutral */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-600">
                        Neutral
                      </span>

                      <span className="font-medium text-zinc-900">
                        {stats?.neutral ?? 0}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${
                            stats?.totalFeedback
                              ? (stats.neutral /
                                  stats.totalFeedback) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Negative */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-600">
                        Negative
                      </span>

                      <span className="font-medium text-zinc-900">
                        {stats?.negative ?? 0}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${
                            stats?.totalFeedback
                              ? (stats.negative /
                                  stats.totalFeedback) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Status Overview */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <h2 className="text-lg font-semibold text-zinc-900">
                  Feedback Status
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Track feedback processing
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4">

                  <div className="rounded-xl bg-zinc-50 p-5 text-center">
                    <p className="text-3xl font-bold text-zinc-900">
                      {stats?.newFeedback ?? 0}
                    </p>

                    <p className="mt-2 text-xs font-medium text-zinc-500">
                      NEW
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-5 text-center">
                    <p className="text-3xl font-bold text-zinc-900">
                      {stats?.reviewed ?? 0}
                    </p>

                    <p className="mt-2 text-xs font-medium text-zinc-500">
                      REVIEWED
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-5 text-center">
                    <p className="text-3xl font-bold text-zinc-900">
                      {stats?.actioned ?? 0}
                    </p>

                    <p className="mt-2 text-xs font-medium text-zinc-500">
                      ACTIONED
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Recent Feedback
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Latest feedback from your workspace
                  </p>
                </div>

                <Link
                  href="/feedback"
                  className="text-sm font-medium text-zinc-900 hover:underline"
                >
                  View all
                </Link>
              </div>

              {!data?.recentFeedback?.length ? (
                <div className="p-10 text-center text-sm text-zinc-500">
                  No feedback found.
                </div>
              ) : (
                <div className="divide-y">

                  {data.recentFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                    >

                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">
                          {item.content}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {item.customerLabel || "Unknown customer"}
                          {" · "}
                          {item.channel}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.sentiment === "POS"
                              ? "bg-green-100 text-green-700"
                              : item.sentiment === "NEG"
                              ? "bg-red-100 text-red-700"
                              : item.sentiment === "NEU"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {item.sentiment || "NOT ANALYZED"}
                        </span>

                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                          {item.status}
                        </span>

                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}