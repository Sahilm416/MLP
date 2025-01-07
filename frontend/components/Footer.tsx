import { Github, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-gray-100">
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 p-5">
        <a 
          href="https://github.com/sahilm416/MLP" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <Github className="w-6 h-6 text-gray-800 mb-2" />
          <span className="text-sm font-medium text-gray-800">GitHub</span>
        </a>

        <Link 
          href="/docs"
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <FileText className="w-6 h-6 text-gray-800 mb-2" />
          <span className="text-sm font-medium text-gray-800">Docs</span>
        </Link>
      </div>

      {/* Project Info */}
      <div className="px-5 py-6 text-center border-t border-gray-100">            
        <p className="text-sm text-gray-500 mb-2">
          Open-source Marathi language sentiment analysis
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>© 2024</span>
          <span>•</span>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
} 