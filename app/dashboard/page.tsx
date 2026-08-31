import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  const feedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // =====================================================
  // ANALYTICS
  // =====================================================

  const totalFeedback = feedback.length;

  const positiveCount = feedback.filter(
    (item) => item.sentiment === "POS"
  ).length;

  const neutralCount = feedback.filter(
    (item) => item.sentiment === "NEU"
  ).length;

  const negativeCount = feedback.filter(
    (item) => item.sentiment === "NEG"
  ).length;

  const newCount = feedback.filter(
    (item) => item.status === "NEW"
  ).length;

  const reviewedCount = feedback.filter(
    (item) => item.status === "REVIEWED"
  ).length;

  const actionedCount = feedback.filter(
    (item) => item.status === "ACTIONED"
  ).length;

  const scoredFeedback = feedback.filter(
    (item) => item.sentimentScore !== null
  );

  const averageSentimentScore =
    scoredFeedback.length > 0
      ? scoredFeedback.reduce(
          (total, item) =>
            total + (item.sentimentScore ?? 0),
          0
        ) / scoredFeedback.length
      : null;

  const averageScorePercentage =
    averageSentimentScore !== null
      ? Math.round(averageSentimentScore * 100)
      : null;

  function percentage(count: number) {
    if (totalFeedback === 0) {
      return 0;
    }

    return Math.round(
      (count / totalFeedback) * 100
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              LOOP Dashboard
            </h1>

            <p className="mt-2 text-zinc-500">
              Feedback management and customer insights workspace
            </p>
          </div>

          {/* NAVIGATION */}

          <nav className="flex flex-wrap items-center gap-2">

            <Link
              href="/dashboard"
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/feedback"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Feedback
            </Link>

            <Link
              href="/themes"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Themes
            </Link>

            <Link
              href="/trends"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Trends
            </Link>

            <Link
              href="/reports"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Reports
            </Link>

            <LogoutButton />

          </nav>

        </div>

        {/* =====================================================
            WORKSPACE INFORMATION
        ===================================================== */}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-semibold text-zinc-900">
            Workspace Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">
                Name
              </p>

              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {session.user.name}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                {session.user.email}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">
                Role
              </p>

              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {session.user.role}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">
                Workspace
              </p>

              <p className="mt-1 break-all text-xs font-medium text-zinc-900">
                {workspaceId}
              </p>
            </div>

          </div>
        </div>

        {/* =====================================================
            ANALYTICS
        ===================================================== */}

        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">
            Feedback Analytics
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Overview of customer feedback in your workspace.
          </p>
        </div>

        {/* MAIN ANALYTICS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Total Feedback
            </p>

            <p className="mt-3 text-3xl font-bold text-zinc-900">
              {totalFeedback}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              All feedback entries
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Positive
            </p>

            <p className="mt-3 text-3xl font-bold text-green-600">
              {positiveCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              {percentage(positiveCount)}% of feedback
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Neutral
            </p>

            <p className="mt-3 text-3xl font-bold text-yellow-600">
              {neutralCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              {percentage(neutralCount)}% of feedback
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Negative
            </p>

            <p className="mt-3 text-3xl font-bold text-red-600">
              {negativeCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              {percentage(negativeCount)}% of feedback
            </p>
          </div>

        </div>

        {/* SECOND ANALYTICS ROW */}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              New
            </p>

            <p className="mt-3 text-3xl font-bold text-blue-600">
              {newCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Awaiting review
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Reviewed
            </p>

            <p className="mt-3 text-3xl font-bold text-purple-600">
              {reviewedCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Feedback reviewed
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Actioned
            </p>

            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {actionedCount}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Actions completed
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Avg. Sentiment Score
            </p>

            <p className="mt-3 text-3xl font-bold text-zinc-900">
              {averageScorePercentage !== null
                ? `${averageScorePercentage}%`
                : "N/A"}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Based on analyzed feedback
            </p>
          </div>

        </div>

        {/* =====================================================
            SENTIMENT DISTRIBUTION
        ===================================================== */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              Sentiment Distribution
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Breakdown of analyzed customer feedback.
            </p>
          </div>

          <div className="space-y-5">

            {/* POSITIVE */}

            <div>
              <div className="mb-2 flex items-center justify-between">

                <span className="text-sm font-medium text-zinc-700">
                  Positive
                </span>

                <span className="text-sm text-zinc-500">
                  {positiveCount} ({percentage(positiveCount)}%)
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">

                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${percentage(positiveCount)}%`,
                  }}
                />

              </div>
            </div>

            {/* NEUTRAL */}

            <div>
              <div className="mb-2 flex items-center justify-between">

                <span className="text-sm font-medium text-zinc-700">
                  Neutral
                </span>

                <span className="text-sm text-zinc-500">
                  {neutralCount} ({percentage(neutralCount)}%)
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">

                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{
                    width: `${percentage(neutralCount)}%`,
                  }}
                />

              </div>
            </div>

            {/* NEGATIVE */}

            <div>
              <div className="mb-2 flex items-center justify-between">

                <span className="text-sm font-medium text-zinc-700">
                  Negative
                </span>

                <span className="text-sm text-zinc-500">
                  {negativeCount} ({percentage(negativeCount)}%)
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">

                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: `${percentage(negativeCount)}%`,
                  }}
                />

              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            RECENT FEEDBACK
        ===================================================== */}

        <div className="mt-8 rounded-2xl bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-zinc-100 p-6">

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Recent Feedback
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Latest feedback received.
              </p>
            </div>

            <Link
              href="/feedback"
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              View all →
            </Link>

          </div>

          {feedback.length === 0 ? (

            <div className="p-10 text-center text-sm text-zinc-500">
              No feedback available yet.
            </div>

          ) : (

            <div className="divide-y divide-zinc-100">

              {feedback.slice(0, 5).map((item) => (

                <div
                  key={item.id}
                  className="p-5 hover:bg-zinc-50"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div className="min-w-0">

                      <p className="line-clamp-2 text-sm font-medium text-zinc-900">
                        {item.content}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">

                        <span>
                          {item.customerLabel || "Unknown customer"}
                        </span>

                        <span>•</span>

                        <span>
                          {item.channel}
                        </span>

                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-2">

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
                        {item.sentiment || "Not analyzed"}
                      </span>

                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                        {item.status}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* =====================================================
            QUICK NAVIGATION
        ===================================================== */}

        <div className="mt-8">

          <h2 className="mb-4 text-xl font-bold text-zinc-900">
            Explore LOOP
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* FEEDBACK */}

            <Link
              href="/feedback"
              className="rounded-2xl bg-zinc-900 p-6 text-white shadow-sm transition hover:bg-zinc-800"
            >

              <h3 className="text-lg font-semibold">
                Feedback
              </h3>

              <p className="mt-2 text-sm text-zinc-300">
                Add, search and manage customer feedback.
              </p>

              <p className="mt-4 text-sm font-medium">
                Open Feedback →
              </p>

            </Link>

            {/* THEMES */}

            <Link
              href="/themes"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:bg-zinc-50"
            >

              <h3 className="text-lg font-semibold text-zinc-900">
                Themes
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Explore AI-generated feedback themes and categories.
              </p>

              <p className="mt-4 text-sm font-medium text-zinc-900">
                Open Themes →
              </p>

            </Link>

            {/* TRENDS */}

            <Link
              href="/trends"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:bg-zinc-50"
            >

              <h3 className="text-lg font-semibold text-zinc-900">
                Trends
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Analyze sentiment and customer feedback trends.
              </p>

              <p className="mt-4 text-sm font-medium text-zinc-900">
                Open Trends →
              </p>

            </Link>

            {/* REPORTS */}

            <Link
              href="/reports"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:bg-zinc-50"
            >

              <h3 className="text-lg font-semibold text-zinc-900">
                Reports
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Generate and review customer feedback reports.
              </p>

              <p className="mt-4 text-sm font-medium text-zinc-900">
                Open Reports →
              </p>

            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}