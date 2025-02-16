"use client";
import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  Share2,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useAnalyze } from "@/context/AnalyzeProvoder";
import { toast } from "sonner";
import { Markdown } from "./_components/markdown";

export default function Results() {
  const { scrapedData, resultsData } = useAnalyze();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "posts" | "AI Insights"
  >("overview");
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);

  // Calculate aggregated statistics
  const stats = useMemo(() => {
    if (!resultsData?.results) return null;

    const total = resultsData.results.length;
    const positive = resultsData.results.filter(
      (r) => r.sentiment === "Positive"
    ).length;
    const negative = resultsData.results.filter(
      (r) => r.sentiment === "Negative"
    ).length;
    const neutral = resultsData.results.filter(
      (r) => r.sentiment === "Neutral"
    ).length;

    return {
      totalPosts: scrapedData ? 1 : 0, // Main post
      totalComments: scrapedData?.comments?.length || 0,
      sentimentDistribution: {
        positive: Math.round((positive / total) * 100),
        negative: Math.round((negative / total) * 100),
        neutral: Math.round((neutral / total) * 100),
      },
      overallScore: positive / total,
    };
  }, [resultsData, scrapedData]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <Smile className="w-5 h-5 text-green-500" />;
      case "neutral":
        return <Meh className="w-5 h-5 text-yellow-500" />;
      case "negative":
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const togglePostExpansion = (postId: number) => {
    setExpandedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return "text-green-500";
    if (score >= 0.4) return "text-yellow-500";
    return "text-red-500";
  };

  if (!scrapedData || !resultsData || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleFetchAIInsights = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post: {
            content: scrapedData?.post?.content || "",
            sentiment: resultsData.results[0].sentiment || "",
          },
          distribution: {
            positive: stats.sentimentDistribution.positive,
            negative: stats.sentimentDistribution.negative,
            neutral: stats.sentimentDistribution.neutral,
          },
        }),
      });

      if (!res.ok) {
        toast.error("Failed to fetch AI insights");
      } else {
        const data = await res.json();
        setAiInsights(data.text);
      }
    } catch {
      toast.error("Failed to fetch AI insights");
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "AI Insights" && !aiInsights) {
      handleFetchAIInsights();
    }
  }, [activeTab]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl font-bold text-gray-900">
          Sentiment Analysis Results
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Analysis of your social media post and comments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "posts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Comments Analysis
        </button>
        <button
          onClick={() => setActiveTab("AI Insights")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "AI Insights"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          AI Insights
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {/* Overall Sentiment Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Overall Sentiment</h3>
              <span className="text-sm text-blue-600 font-medium">
                {Math.round(stats.overallScore * 100)}% Positive
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${stats.overallScore * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Main Post
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPosts}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Comments
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalComments}
              </p>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-semibold text-gray-900 mb-4">
              Sentiment Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.sentimentDistribution).map(
                ([sentiment, percentage]) => (
                  <div key={sentiment} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-600">
                        {sentiment}
                      </span>
                      <span className="font-medium text-gray-900">
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sentiment === "positive"
                            ? "bg-green-500"
                            : sentiment === "neutral"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main Post Analysis */}
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-semibold text-gray-900 mb-4">Post Analysis</h3>
            <div className="border rounded-lg p-3">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 mt-1">
                  {getSentimentIcon(resultsData.results[0].sentiment)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800">{scrapedData.post.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-sm font-medium ${getSentimentColor(
                        resultsData.results[0].score.positive
                      )}`}
                    >
                      Sentiment Score:{" "}
                      {Math.round(resultsData.results[0].score.positive * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "posts" ? (
        /* Comments Analysis Tab */
        <div className="space-y-4">
          {resultsData.results.slice(1).map((result, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl border space-y-3"
            >
              <div className="flex items-start gap-3">
                {getSentimentIcon(result.sentiment)}
                <div className="flex-1">
                  <p className="text-gray-800">{result.content}</p>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium ${getSentimentColor(
                        result.score.positive
                      )}`}
                    >
                      Sentiment Score: {Math.round(result.score.positive * 100)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "AI Insights" ? (
        /* AI Insights Tab */
        <div className="space-y-4">
          {insightLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border">
              <h3 className="font-semibold text-gray-900 mb-4">AI Insights</h3>
              <Markdown>{aiInsights!}</Markdown>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
