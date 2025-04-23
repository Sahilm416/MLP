"use client";
import { useMemo, useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Smile,
  Meh,
  Frown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Scale,
} from "lucide-react";
import { useAnalyze } from "@/context/AnalyzeProvoder";
import { FacebookEmbed } from "react-social-media-embed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "./_components/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export default function Results() {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"post" | "comments" | "ai">(
    "post"
  );

  useEffect(() => {
    const fetchAIInsights = async () => {
      try {
        setAiInsights(null);
        const response = await fetch(`/api/insights`, {
          method: "POST",
          body: JSON.stringify({
            distribution: {
              positive: stats?.distribution.positive,
              neutral: stats?.distribution.neutral,
              negative: stats?.distribution.negative,
            },
            comments: scrapedData,
          }),
        });
        const data = await response.json();
        setAiInsights(data.text);
      } catch (error) {}
    };
    currentTab === "ai" &&
      stats &&
      scrapedData &&
      !aiInsights &&
      fetchAIInsights();
  }, [currentTab]);

  const { scrapedData, postUrl } = useAnalyze();
  // Calculate stats once
  const stats = useMemo(() => {
    if (!scrapedData) return null;

    const total = scrapedData.length;
    const positive = scrapedData.filter(
      (c) => c.sentiment === "Positive"
    ).length;
    const negative = scrapedData.filter(
      (c) => c.sentiment === "Negative"
    ).length;
    const neutral = scrapedData.filter((c) => c.sentiment === "Neutral").length;
    const avgConfidence = Math.round(
      (scrapedData.reduce((acc, curr) => acc + curr.confidence, 0) / total) *
        100
    );

    return {
      total,
      positive,
      negative,
      neutral,
      avgConfidence,
      distribution: {
        positive: Math.round((positive / total) * 100),
        negative: Math.round((negative / total) * 100),
        neutral: Math.round((neutral / total) * 100),
      },
    };
  }, [scrapedData]);

  if (!scrapedData || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Sentiment Analysis
          </h1>

          <Tabs
            value={currentTab}
            onValueChange={(value) =>
              setCurrentTab(value as "post" | "comments" | "ai")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="post">Post</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            </TabsList>

            {/* Post Stats Tab */}
            <TabsContent value="post" className="mt-4 space-y-4 pb-20">
              {/* Main Sentiment Card */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                <h3 className="text-lg font-semibold mb-2">
                  Negative Feedback
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold mb-1">
                      {stats.distribution.negative}%
                    </p>
                    {/* <p className="text-sm text-blue-100">Negative Feedback</p> */}
                  </div>
                  <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                    <ThumbsDown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Confidence</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgConfidence}%
                  </p>
                </div>
              </div>

              {/* Sentiment Breakdown */}
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Sentiment Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Smile className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          Positive
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.positive}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${stats.distribution.positive}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Meh className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          Neutral
                        </span>
                        <span className="text-sm font-medium text-yellow-600">
                          {stats.neutral}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${stats.distribution.neutral}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Frown className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          Negative
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.negative}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${stats.distribution.negative}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {postUrl && (
                <div className="bg-white rounded-xl p-4 w-full flex justify-center items-center flex-col">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Original Post
                  </h3>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <FacebookEmbed
                      className="border-2  shadow-sm"
                      url={postUrl}
                      width={350}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-4">
              <div className="divide-y divide-gray-200">
                {scrapedData.map((comment, index) => (
                  <div key={index} className="bg-white px-4 py-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {comment.author}
                          </span>
                        </div>

                        <p className="text-gray-800 text-sm mt-1">
                          {comment.comment}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {comment.sentiment === "Positive" ? (
                            <Smile className="w-4 h-4 text-green-500" />
                          ) : comment.sentiment === "Neutral" ? (
                            <Meh className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Frown className="w-4 h-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              comment.sentiment === "Positive"
                                ? "text-green-600"
                                : comment.sentiment === "Neutral"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {comment.sentiment}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {Math.round(comment.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="ai" className="mt-4">
              {aiInsights ? (
                <Card>
                  <CardContent>
                    <Markdown>{aiInsights}</Markdown>
                  </CardContent>
                </Card>
              ) : (
                <Skeleton className="w-full rounded-lg h-[600px]" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
