'use client';

import { Menu, ArrowRight, Globe2, Sparkles, BarChart3, Zap, Github, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <main className="">
        {/* Hero Section */}
        <section className="px-5 py-8">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 bg-blue-100/80 px-4 py-1.5 rounded-full text-blue-700 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Analysis
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Marathi Language
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                  {' '}Processing
                </span>
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Analyze Marathi social media content with our advanced sentiment analysis platform
              </p>
            </div>

            <Link 
              href="/analyze"
              className="inline-flex items-center justify-center w-full gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              Start Analysis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-5 py-10 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-7">Key Features</h2>
          
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100/80 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Social Media Analysis</h3>
              <p className="text-gray-600 leading-relaxed">Analyze Facebook and Twitter profiles in Marathi</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100/80 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Processing</h3>
              <p className="text-gray-600 leading-relaxed">Get instant analysis results</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100/80 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Detailed Reports</h3>
              <p className="text-gray-600 leading-relaxed">Get comprehensive sentiment insights</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="p-5">
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100/80">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Ready to start?</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Begin analyzing Marathi content now
            </p>
            <Link 
              href="/analyze"
              className="inline-flex items-center justify-center w-full gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
