"use client";

import { useEffect, useState } from "react";

type Feedback = {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sourceRef: string | null;
  sentiment: "POS" | "NEU" | "NEG" | null;
  sentimentScore?: number | null;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  createdAt: string;
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [search, setSearch] = useState("");

  const [sentimentFilter, setSentimentFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [channelFilter, setChannelFilter] =
    useState("ALL");

  const [showForm, setShowForm] = useState(false);

  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("Email");
  const [customerLabel, setCustomerLabel] =
    useState("");
  const [sourceRef, setSourceRef] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  /*
   * =====================================================
   * LOAD FEEDBACK
   * =====================================================
   */

  async function loadFeedback() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/feedback",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch feedback"
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid feedback response"
        );
      }

      setFeedback(data);
    } catch (error) {
      console.error(
        "Load feedback error:",
        error
      );

      setError(
        "Unable to load feedback."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    loadFeedback();
  }, []);

  /*
   * =====================================================
   * ADD FEEDBACK
   * =====================================================
   */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!content.trim()) {
      setError(
        "Please enter feedback."
      );

      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/feedback",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            content: content.trim(),
            channel,
            customerLabel:
              customerLabel.trim() || null,
            sourceRef:
              sourceRef.trim() || null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create feedback."
        );
      }

      /*
       * Reset form
       */

      setContent("");
      setChannel("Email");
      setCustomerLabel("");
      setSourceRef("");

      setShowForm(false);

      /*
       * Reload feedback
       * so AI classification is visible.
       */

      await loadFeedback();
    } catch (error) {
      console.error(
        "Create feedback error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create feedback."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * UPDATE STATUS
   * =====================================================
   */

  async function updateStatus(
    id: string,
    status: Feedback["status"]
  ) {
    try {
      setError("");
      setUpdatingId(id);

      const response = await fetch(
        "/api/feedback",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update status."
        );
      }

      setFeedback((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status:
                  data.status,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * =====================================================
   * FILTER FEEDBACK
   * =====================================================
   */

  const filteredFeedback =
    feedback.filter((item) => {
      const searchText =
        `${item.content} ${
          item.customerLabel ?? ""
        } ${item.channel} ${
          item.sourceRef ?? ""
        }`.toLowerCase();

      const matchesSearch =
        searchText.includes(
          search.toLowerCase()
        );

      const matchesSentiment =
        sentimentFilter === "ALL" ||
        item.sentiment ===
          sentimentFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status ===
          statusFilter;

      const matchesChannel =
        channelFilter === "ALL" ||
        item.channel ===
          channelFilter;

      return (
        matchesSearch &&
        matchesSentiment &&
        matchesStatus &&
        matchesChannel
      );
    });

  /*
   * =====================================================
   * SENTIMENT LABEL
   * =====================================================
   */

  function getSentimentLabel(
    sentiment: Feedback["sentiment"]
  ) {
    if (sentiment === "POS") {
      return "Positive";
    }

    if (sentiment === "NEG") {
      return "Negative";
    }

    if (sentiment === "NEU") {
      return "Neutral";
    }

    return "Not analyzed";
  }

  /*
   * =====================================================
   * SENTIMENT SCORE
   * =====================================================
   *
   * IMPORTANT:
   *
   * sentimentScore is a value from -1 to +1.
   * It is NOT technically a confidence percentage.
   *
   * Therefore we display it as Score.
   */

  function getSentimentScore(
    score: number | null | undefined
  ) {
    if (
      typeof score !== "number" ||
      !Number.isFinite(score)
    ) {
      return "Score unavailable";
    }

    const percentage =
      Math.round(score * 100);

    const sign =
      percentage > 0 ? "+" : "";

    return `Score: ${sign}${percentage}%`;
  }

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Feedback
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and review customer feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {showForm
              ? "Cancel"
              : "+ Add Feedback"}
          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            ADD FEEDBACK FORM
        ================================================= */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-xl border bg-white p-6 shadow-sm"
          >

            <h2 className="mb-5 text-xl font-semibold text-gray-900">
              Add Feedback
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              {/* Feedback */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Feedback
                </label>

                <textarea
                  value={content}
                  onChange={(e) =>
                    setContent(
                      e.target.value
                    )
                  }
                  placeholder="Enter customer feedback..."
                  rows={5}
                  disabled={saving}
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
                />

              </div>

              {/* Channel */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Channel
                </label>

                <select
                  value={channel}
                  onChange={(e) =>
                    setChannel(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
                >
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>Website</option>
                  <option>Phone</option>
                  <option>Social Media</option>
                  <option>Other</option>
                </select>

              </div>

              {/* Customer */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer
                </label>

                <input
                  type="text"
                  value={customerLabel}
                  onChange={(e) =>
                    setCustomerLabel(
                      e.target.value
                    )
                  }
                  placeholder="Customer name or label"
                  disabled={saving}
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
                />

              </div>

              {/* Source Reference */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Source Reference
                </label>

                <input
                  type="text"
                  value={sourceRef}
                  onChange={(e) =>
                    setSourceRef(
                      e.target.value
                    )
                  }
                  placeholder="Optional reference"
                  disabled={saving}
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* Submit */}

            <div className="mt-6 flex justify-end">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Feedback"}
              </button>

            </div>

          </form>
        )}

        {/* =================================================
            SEARCH & FILTERS
        ================================================= */}

        <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm">

          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-3">

            {/* Sentiment */}

            <select
              value={sentimentFilter}
              onChange={(e) =>
                setSentimentFilter(
                  e.target.value
                )
              }
              className="rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Sentiments
              </option>

              <option value="POS">
                Positive
              </option>

              <option value="NEU">
                Neutral
              </option>

              <option value="NEG">
                Negative
              </option>
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="NEW">
                New
              </option>

              <option value="REVIEWED">
                Reviewed
              </option>

              <option value="ACTIONED">
                Actioned
              </option>
            </select>

            {/* Channel */}

            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(
                  e.target.value
                )
              }
              className="rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-black"
            >
              <option value="ALL">
                All Channels
              </option>

              <option value="Email">
                Email
              </option>

              <option value="WhatsApp">
                WhatsApp
              </option>

              <option value="Website">
                Website
              </option>

              <option value="Phone">
                Phone
              </option>

              <option value="Social Media">
                Social Media
              </option>

              <option value="Other">
                Other
              </option>
            </select>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              {/* Table Header */}

              <thead className="border-b bg-gray-50">

                <tr>

                  <th className="px-5 py-4 font-semibold">
                    Feedback
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Customer
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Channel
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Sentiment
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                </tr>

              </thead>

              {/* Table Body */}

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Loading feedback...
                    </td>

                  </tr>

                ) : filteredFeedback.length === 0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No feedback found.
                    </td>

                  </tr>

                ) : (

                  filteredFeedback.map(
                    (item) => (

                      <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >

                        {/* Feedback */}

                        <td className="max-w-md px-5 py-4 text-gray-900">

                          <div className="line-clamp-3">
                            {item.content ||
                              "-"}
                          </div>

                        </td>

                        {/* Customer */}

                        <td className="px-5 py-4 text-gray-600">

                          {item.customerLabel ||
                            "-"}

                        </td>

                        {/* Channel */}

                        <td className="px-5 py-4 text-gray-600">

                          {item.channel ||
                            "-"}

                        </td>

                        {/* Sentiment */}

                        <td className="px-5 py-4 text-gray-600">

                          {item.sentiment ? (

                            <div>

                              <div className="font-medium">

                                {getSentimentLabel(
                                  item.sentiment
                                )}

                              </div>

                              <div className="text-xs text-gray-400">

                                {getSentimentScore(
                                  item.sentimentScore
                                )}

                              </div>

                            </div>

                          ) : (

                            <div>

                              <div className="font-medium">
                                Not analyzed
                              </div>

                              <div className="text-xs text-gray-400">
                                Score unavailable
                              </div>

                            </div>

                          )}

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">

                          <select
                            value={item.status}
                            disabled={
                              updatingId ===
                              item.id
                            }
                            onChange={(e) =>
                              updateStatus(
                                item.id,
                                e.target
                                  .value as Feedback["status"]
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-black disabled:opacity-50"
                          >

                            <option value="NEW">
                              NEW
                            </option>

                            <option value="REVIEWED">
                              REVIEWED
                            </option>

                            <option value="ACTIONED">
                              ACTIONED
                            </option>

                          </select>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </main>
  );
}