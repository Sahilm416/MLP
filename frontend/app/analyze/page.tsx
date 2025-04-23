"use client";
import { useState } from "react";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAnalyze } from "@/context/AnalyzeProvoder";
import { toast } from "sonner";
import { ModalResponse } from "@/types";

interface FormData {
  postUrl: string;
}

export default function Analyze() {
  const { setScrapedData, setPostUrl } = useAnalyze();
  const [formData, setFormData] = useState<FormData>({
    postUrl: "",
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate URL format
      if (!formData.postUrl.startsWith("https://www.facebook.com/share/p/")) {
        toast.error("Please enter a valid Facebook post URL");
        throw new Error("Please enter a valid Facebook post URL");
      }

      // Call the analysis endpoint
      const response = await fetch(
        process.env.NEXT_PUBLIC_SENTIMENT_ANALYSIS_ENDPOINT!,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_url: formData.postUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to analyze comments!");
        throw new Error(
          errorData.detail ||
            `Failed to analyze comments: ${response.statusText}`
        );
      }

      const analysisData = (await response.json()) as {
        comments: ModalResponse[];
        redirected_url: string;
        original_url: string;
      };
      setPostUrl(analysisData.redirected_url);
      setScrapedData(analysisData.comments);
      router.push("/results");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-start mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Facebook Comments Sentiment Analysis
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Analyze sentiment of Marathi comments on any Facebook post
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="profile-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Facebook Post URL
              </label>
              <input
                disabled={loading}
                id="profile-url"
                type="url"
                placeholder="https://www.facebook.com/share/p/"
                value={formData.postUrl}
                onChange={(e) =>
                  setFormData({ ...formData, postUrl: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Comments...
                </>
              ) : (
                <>
                  Analyze Comments
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                What are we analyzing?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sentiment of comments in Marathi language</li>
                <li>• Comment author information</li>
                <li>• Confidence scores for sentiment predictions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
