"use server";
import { Redis } from "@upstash/redis";
/**
 * Get the server URL from the Upstash Redis database
 * @returns The server URL
 */
export const getServerURL = async () => {
  const url = process.env.UPSTASH_URL;
  const token = process.env.UPSTASH_TOKEN;

  if (!url || !token) {
    throw new Error("UPSTASH_URL and UPSTASH_TOKEN must be set");
  }

  const redis = new Redis({
    url,
    token,
  });

  const serverURL = (await redis.get("serverURL")) as string;
  console.log("serverURL", serverURL);

  if (!serverURL) {
    throw new Error("Server URL not found");
  }

  return serverURL;
};
