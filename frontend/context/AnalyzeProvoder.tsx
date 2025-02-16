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
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
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
