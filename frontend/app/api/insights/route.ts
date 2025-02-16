import { NextRequest } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const data = (await req.json()) as {
    distribution: {
      positive: string;
      negative: string;
      neutral: string;
    };
    post: {
      content: string;
      sentiment: string;
    };
  };

  console.log(data);

  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    system: `
    You are an analytical assistant tasked with providing a comprehensive analysis of the sentiment of a post and its associated comment sentiments. You are provided with:
    - The post's content and its overall sentiment.
    - The distribution of comments across three sentiment categories: positive, negative, and neutral (provided as percentages).

    In your analysis, please:
    - Present a detailed overview of the post sentiment and the comment sentiment distribution.
    - Explain the possible reasons behind the given post sentiment.
    - Compare and contrast the post sentiment with the comment sentiments, highlighting any discrepancies or alignments.
    - Offer solid reasons and observations based on the provided data.
    - Format your response in markdown.
    - Use only the English language without any additional headers or footers.

    USE ONLY ENGLISH LANGUAGE FOR YOUR RESPONSE.
    `,
    messages: [
      {
        role: "user",
        content: `
               ## Post Content:
               ${data.post.content}
               
               -----------------------
               
               ## Post Sentiment:
               ${data.post.sentiment}
               
               -----------------------
               
               ## Comment Sentiment Distribution:
               ${JSON.stringify(data.distribution)}
            `,
      },
    ],
  });

  return NextResponse.json({ text });
};
