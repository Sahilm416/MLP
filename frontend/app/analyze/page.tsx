"use client";
import { useEffect, useState } from "react";
import {
  Facebook,
  Twitter,
  ArrowRight,
  Loader2,
  Info,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  ResultsData,
  ScrapedData,
  useAnalyze,
} from "@/context/AnalyzeProvoder";
import { toast } from "sonner";

interface FormData {
  postUrl: string;
  platform: "facebook" | "twitter" | null;
}

interface AnalysisResult {
  type: "post" | "comment";
  content: string;
  sentiment: string;
  score: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface SentimentResponse {
  Sentiment_Analysis: string;
  cleaned_tweet: string;
  original_tweet: string;
  predicted_probabilities: {
    Negative: number;
    Positive: number;
    Neutral: number;
  };
}

export default function Analyze() {
  const { setScrapedData, setResultsData, scrapedData } = useAnalyze();
  const [formData, setFormData] = useState<FormData>({
    postUrl: "",
    platform: "facebook",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // const handlePlatformSelect = (platform: "facebook" | "twitter") => {
  //   setFormData({ ...formData, platform, postUrl: "" });
  //   setError(null);
  // };

  const analyzeSentiment = async (text: string): Promise<SentimentResponse> => {
    const sentimentEndpoint = process.env.NEXT_PUBLIC_SENTIMENT_ANALYSIS_ENDPOINT!;
    const response = await fetch(sentimentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tweet: text }),
    });

    if (!response.ok) {
      toast.error(`Sentiment analysis failed!`);
      throw new Error(`Sentiment analysis failed: ${response.statusText}`);
    }

    return response.json();
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.platform) {
        throw new Error("Please select a platform");
      }

      // Validate URL format
      if (!formData.postUrl.startsWith("https://www.facebook.com/share/p/")) {
        toast.error(`Please enter a valid ${formData.platform} URL`);
        throw new Error(`Please enter a valid ${formData.platform} URL`);
      }

      // Scraping endpoint configuration
      const scrapeEndpoint =
        formData.platform === "facebook"
          ? process.env.NEXT_PUBLIC_FACEBOOK_SCRAPER!
          : process.env.NEXT_PUBLIC_TWITTER_SCRAPER!;

      const payload = {
        post_url: formData.postUrl,
        ...(formData.platform === "facebook" && {
          email: process.env.NEXT_PUBLIC_FACEBOOK_EMAIL,
          password: process.env.NEXT_PUBLIC_FACEBOOK_PASSWORD,
        }),
      };

      // Fetch scraped data
      const scrapeResponse = await fetch(scrapeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        toast.error(errorData.detail || `Failed to scrape post!`);
        throw new Error(
          errorData.detail ||
            `Failed to scrape post: ${scrapeResponse.statusText}`
        );
      }

      const scrapedData = (await scrapeResponse.json()) as ScrapedData;

      // Analyze post sentiment
      const postSentiment = await analyzeSentiment(scrapedData.post.content);

      const initialResults: AnalysisResult[] = [
        {
          type: "post",
          content: scrapedData.post.content,
          sentiment: postSentiment.Sentiment_Analysis,
          score: {
            positive: postSentiment.predicted_probabilities.Positive,
            negative: postSentiment.predicted_probabilities.Negative,
            neutral: postSentiment.predicted_probabilities.Neutral,
          },
        },
      ];

      // Analyze comments in batches of 5 to prevent rate limiting
      toast.info(`Analyzing comments...`);
      const commentResults: AnalysisResult[] = [];
      for (let i = 0; i < scrapedData.comments.length; i += 5) {
        const batch = scrapedData.comments.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map(async (comment) => {
            try {
              const sentiment = await analyzeSentiment(comment.comment);
              return {
                type: "comment" as const,
                content: comment.comment,
                sentiment: sentiment.Sentiment_Analysis,
                score: {
                  positive: sentiment.predicted_probabilities.Positive,
                  negative: sentiment.predicted_probabilities.Negative,
                  neutral: sentiment.predicted_probabilities.Neutral,
                },
              };
            } catch (error) {
              toast.warning(`Failed to analyze one comment!`);
              console.error(`Error analyzing comment: ${error}`);
              return null;
            }
          })
        );
        commentResults.push(
          ...(batchResults.filter(Boolean) as AnalysisResult[])
        );
      }

      // Update state with results
      setScrapedData(scrapedData);
      setResultsData({
        results: [...initialResults, ...commentResults],
      });

      // Navigate to results page
      router.push("/results");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-start mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Post Sentiment Analysis
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Analyze any marathi social media post in seconds
          </p>
        </div>

        {/* <AlertDialog open={Boolean(error)}>
          <AlertDialogContent>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <AlertDialogDescription className="text-sm text-gray-600">
                  {error}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog> */}

        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          {/* Platform selection buttons removed as per your code */}

          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="profile-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Post URL
              </label>
              <input
                disabled={loading}
                id="profile-url"
                type="url"
                placeholder="https://www.facebook.com/share/p"
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
              disabled={!formData.platform || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Analyze Post
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
                What are we doing?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analyzing sentiment patterns in posts and comments</li>
                <li>• Measuring emotional impact and engagement</li>
                <li>• Understanding audience reactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
