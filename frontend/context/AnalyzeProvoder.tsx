"use client";
import { createContext, useContext, useState } from "react";
import { ModalResponse } from "@/types";

const AnalyzeContext = createContext<{
  scrapedData: ModalResponse[] | null;
  setScrapedData: React.Dispatch<React.SetStateAction<ModalResponse[] | null>>;
  postUrl: string | null;
  setPostUrl: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

export const AnalyzeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ModalResponse[] | null>(null);

  return (
    <AnalyzeContext.Provider
      value={{
        scrapedData,
        setScrapedData,
        postUrl,
        setPostUrl,
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
