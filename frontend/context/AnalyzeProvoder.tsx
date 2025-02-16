"use client";
import { createContext, useContext, useState } from "react";

export type ScrapedData = {
  comments: { comment: string }[];
  metadataL: {
    total_comments: number;
    scraped_at: string;
    comment_limit_reached: boolean;
  };
  post: {
    content: string;
    image_alt: string;
    post_url: string;
  };
};

export type ResultsData = {
  results: {
    type: "post" | "comment";
    content: string;
    sentiment: string;
    score: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }[];
};

const AnalyzeContext = createContext<{
  scrapedData: ScrapedData | null;
  setScrapedData: React.Dispatch<React.SetStateAction<ScrapedData | null>>;
  resultsData: ResultsData | null;
  setResultsData: React.Dispatch<React.SetStateAction<ResultsData | null>>;
} | null>(null);

export const AnalyzeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>({
    comments: [{ comment: "This is a sample comment." }],
    metadataL: {
      total_comments: 1,
      scraped_at: "2024-02-16T12:00:00Z",
      comment_limit_reached: false,
    },
    post: {
      content: "This is a sample post content.",
      image_alt: "Sample image description.",
      post_url: "https://example.com/sample-post",
    },
  });

  const [resultsData, setResultsData] = useState<ResultsData | null>({
    results: [
      {
        type: "post",
        content: "This is a sample analysis result for the post.",
        sentiment: "positive",
        score: {
          positive: 0.8,
          negative: 0.1,
          neutral: 0.1,
        },
      },
      {
        type: "comment",
        content: "This is a sample analysis result for a comment.",
        sentiment: "neutral",
        score: {
          positive: 0.3,
          negative: 0.3,
          neutral: 0.4,
        },
      },
    ],
  });

  return (
    <AnalyzeContext.Provider
      value={{
        scrapedData,
        setScrapedData,
        resultsData,
        setResultsData,
      }}
    >
      {children}
    </AnalyzeContext.Provider>
  );
};

export const useAnalyze = () => {
  const context = useContext(AnalyzeContext);
  if (context === null) {
    throw new Error("useAnalyze must be used within a AnalyzeProvider");
  }
  return context;
};