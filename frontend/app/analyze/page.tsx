"use client";

import { useState } from "react";
import { Facebook, Twitter, ArrowRight, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormData {
  profileUrl: string;
  platform: "facebook" | "twitter" | null;
}

export default function Analyze() {
  const [formData, setFormData] = useState<FormData>({
    profileUrl: "",
    platform: "facebook",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlatformSelect = (platform: "facebook" | "twitter") => {
    setFormData({ ...formData, platform, profileUrl: "" });
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setLoading(false);
    router.push(`/results`);
  };

  const getPlaceholder = () => {
    if (formData.platform === "facebook") {
      return "https://facebook.com/username";
    }
    return "https://twitter.com/username";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-start mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Profile Analysis
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Analyze any social media profile in seconds
          </p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlatformSelect("facebook")}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                  formData.platform === "facebook"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Facebook className="w-5 h-5" />
                <span className="font-medium">Facebook</span>
              </button>

              <button
                onClick={() => handlePlatformSelect("twitter")}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                  formData.platform === "twitter"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Twitter className="w-5 h-5" />
                <span className="font-medium">Twitter</span>
              </button>
            </div>
          </div>

          {/* Profile URL Form */}
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="profile-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Profile URL
              </label>
              <div className="relative">
                <input
                  id="profile-url"
                  type="url"
                  placeholder={getPlaceholder()}
                  value={formData.profileUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, profileUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
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
                  Analyze Profile
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* What are we doing section */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                What are we doing?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analyzing sentiment patterns in user posts</li>
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
