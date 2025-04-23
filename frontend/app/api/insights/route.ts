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
    comments: {
      comment: string;
      sentiment: string;
      author: string;
    }[];
  };

  console.log(data);

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `
    You are an ai facebook post analysis assistant. 
    You will be given post comments and the overall sentiment of the post comments.
    Your job is to analyze the post comments and provide a summary of the post comments.
    Be detailed and to the point.
    Do not include any other text than the summary.
    Only use Marathi, No other language. DO NOT USE ENGLISH. DO NOT ADD RESPONSE HEADERS LIKE "Here is the summary"
    Format your response in markdown in following format:
    General Summary -> What are most of the comments about? -> conclusion.
    Remember to respond in Marathi only.
    `,
    messages: [
      {
        role: "user",
        content: `
               Post Sentiments: ${JSON.stringify(data.distribution)}
               Comments: ${JSON.stringify(data.comments)}
            `,
      },
    ],
  });

  return NextResponse.json({ text });
};
