'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, MessageCircle, ThumbsUp, Share2, Smile, Meh, Frown, ChevronDown, ChevronUp } from 'lucide-react';

// Mock data - replace with actual API data
const mockData = {
  overallSentiment: 'Positive',
  sentimentScore: 0.75,
  totalPosts: 45,
  totalComments: 156,
  sentimentDistribution: {
    positive: 65,
    neutral: 25,
    negative: 10,
  },
  recentPosts: [
    {
      id: 1,
      content: 'आज खूप छान दिवस होता! नवीन प्रोजेक्ट सुरू केला. टीम मध्ये सर्वांनी छान सहकार्य केले.',
      sentiment: 'positive',
      sentimentScore: 0.85,
      engagement: {
        likes: 45,
        comments: 12,
        shares: 5,
      },
      timestamp: '2024-01-20',
      comments: [
        {
          id: 1,
          content: 'अभिनंदन! प्रोजेक्ट बद्दल अधिक सांगा.',
          sentiment: 'positive',
          sentimentScore: 0.78,
        },
        {
          id: 2,
          content: 'खूप छान काम करत आहात!',
          sentiment: 'positive',
          sentimentScore: 0.92,
        }
      ]
    },
    {
      id: 2,
      content: 'काम करताना थोडी अडचण आली पण सोडवली. पुढच्या वेळी अजून चांगले करू.',
      sentiment: 'neutral',
      sentimentScore: 0.45,
      engagement: {
        likes: 23,
        comments: 8,
        shares: 2,
      },
      timestamp: '2024-01-19',
      comments: [
        {
          id: 3,
          content: 'कशी सोडवलीत?',
          sentiment: 'neutral',
          sentimentScore: 0.5,
        },
        {
          id: 4,
          content: 'हो, पुढच्या वेळी नक्की सुधारणा होईल.',
          sentiment: 'positive',
          sentimentScore: 0.65,
        }
      ]
    },
    {
      id: 3,
      content: 'आजचा दिवस खूप वाईट गेला. सर्व काही चुकत आहे. काहीच व्यवस्थित होत नाही.',
      sentiment: 'negative',
      sentimentScore: 0.25,
      engagement: {
        likes: 15,
        comments: 6,
        shares: 1,
      },
      timestamp: '2024-01-18',
      comments: [
        {
          id: 5,
          content: 'काळजी करू नका, सर्व ठीक होईल.',
          sentiment: 'positive',
          sentimentScore: 0.72,
        },
        {
          id: 6,
          content: 'खूप वाईट झाले.',
          sentiment: 'negative',
          sentimentScore: 0.28,
        },
        {
          id: 7,
          content: 'तुम्ही नक्की यातून बाहेर पडाल.',
          sentiment: 'neutral',
          sentimentScore: 0.55,
        }
      ]
    }
  ],
};

export default function Results() {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts'>('overview');
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-yellow-500" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const togglePostExpansion = (postId: number) => {
    setExpandedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl font-bold text-gray-900">Sentiment Analysis Results</h1>
        <p className="text-sm text-gray-600 mt-1">Analysis of your social media activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'posts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Posts Analysis
        </button>
      </div>

      {activeTab === 'overview' ? (
        /* Overview Tab */
        <div className="space-y-6">
          {/* Overall Sentiment Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Overall Sentiment</h3>
              <span className="text-sm text-blue-600 font-medium">
                {mockData.sentimentScore * 100}% Positive
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${mockData.sentimentScore * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Posts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{mockData.totalPosts}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Comments</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{mockData.totalComments}</p>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
            <div className="space-y-3">
              {Object.entries(mockData.sentimentDistribution).map(([sentiment, percentage]) => (
                <div key={sentiment} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{sentiment}</span>
                    <span className="font-medium text-gray-900">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sentiment === 'positive'
                          ? 'bg-green-500'
                          : sentiment === 'neutral'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post Sentiments Analysis */}
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-semibold text-gray-900 mb-4">Post & Comment Sentiments</h3>
            <div className="space-y-4">
              {mockData.recentPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-3">
                  {/* Post Content and Sentiment */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-shrink-0 mt-1">
                      {getSentimentIcon(post.sentiment)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-medium ${getSentimentColor(post.sentimentScore)}`}>
                          Sentiment Score: {(post.sentimentScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePostExpansion(post.id)}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {expandedPosts.includes(post.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Comments Analysis */}
                  {expandedPosts.includes(post.id) && post.comments.length > 0 && (
                    <div className="mt-3 pl-8 space-y-3">
                      <p className="text-sm font-medium text-gray-700">Comments Analysis:</p>
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 bg-gray-50 p-2 rounded-md">
                          <div className="flex-shrink-0">
                            {getSentimentIcon(comment.sentiment)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{comment.content}</p>
                            <span className={`text-xs font-medium ${getSentimentColor(comment.sentimentScore)}`}>
                              Sentiment: {(comment.sentimentScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Metrics */}
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1 text-gray-500">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{post.engagement.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{post.engagement.comments}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">{post.engagement.shares}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">{post.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Posts Analysis Tab */
        <div className="space-y-4">
          {mockData.recentPosts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-xl border space-y-3">
              {/* Post Content */}
              <div className="flex items-start gap-3">
                {getSentimentIcon(post.sentiment)}
                <p className="text-gray-800 flex-1">{post.content}</p>
              </div>

              {/* Post Metrics */}
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-1 text-gray-500">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{post.engagement.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.engagement.comments}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">{post.engagement.shares}</span>
                </div>
                <span className="text-xs text-gray-400 ml-auto">{post.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
