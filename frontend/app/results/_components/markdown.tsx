import Link from "next/link";
import React, { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-full overflow-x-auto bg-[#202020] border border-[#353535] text-white p-4 rounded-lg my-4 dark:bg-zinc-800 sm:text-xs sm:p-2`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-1 px-2 rounded-md sm:text-xs sm:py-0.5 sm:px-1`}
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-outside ml-6 my-4 space-y-2 sm:ml-4" {...props}>
          {children}
        </ol>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-disc list-outside ml-6 my-4 space-y-2 sm:ml-4" {...props}>
          {children}
        </ul>
      );
    },
    p: ({ node, children, ...props }: any) => {
      return (
        <p className="my-4 leading-relaxed sm:my-2" {...props}>
          {children}
        </p>
      );
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <span className="font-bold" {...props}>
          {children}
        </span>
      );
    },
    a: ({ node, children, ...props }: any) => {
      return (
        <Link
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </Link>
      );
    },
    img: ({ node, children, ...props }: any) => {
      return (
        <div className="relative w-full">
          {isLoading && (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-full h-48 rounded-lg sm:h-24" />
          )}
          <img 
            className={`w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
            onLoad={() => setIsLoading(false)}
            {...props}
          />
        </div>
      );
    },
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h2 className="text-2xl font-bold mt-6 mb-3" {...props}>{children}</h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h3 className="text-xl font-bold mt-5 mb-2" {...props}>{children}</h3>
      );
    },
    h4: ({ node, children, ...props }: any) => {
      return (
        <h4 className="text-lg font-bold mt-4 mb-1" {...props}>{children}</h4>
      );
    },
    h5: ({ node, children, ...props }: any) => {
      return (
        <h5 className="text-base font-bold mt-3 mb-0" {...props}>{children}</h5>
      );
    },
    h6: ({ node, children, ...props }: any) => {
      return (
        <h6 className="text-sm font-bold mt-2 mb-0" {...props}>{children}</h6>
      );
    },
    table: ({ node, children, ...props }: any) => {
      return (
        <div className="w-full overflow-x-auto my-4">
          <div className="inline-block min-w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-full align-middle">
            <table className="w-full divide-y divide-gray-200 dark:divide-zinc-700 border dark:border-zinc-700" {...props}>
              {children}
            </table>
          </div>
        </div>
      );
    },
    thead: ({ node, children, ...props }: any) => {
      return (
        <thead className="bg-gray-50 dark:bg-zinc-800/50" {...props}>
          {children}
        </thead>
      );
    },
    tbody: ({ node, children, ...props }: any) => {
      return (
        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 bg-white dark:bg-transparent" {...props}>
          {children}
        </tbody>
      );
    },
    tr: ({ node, children, ...props }: any) => {
      return (
        <tr 
          className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors" 
          {...props}
        >
          {children}
        </tr>
      );
    },
    th: ({ node, children, ...props }: any) => {
      return (
        <th 
          className="px-3 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 break-words sm:px-2 sm:py-2"
          {...props}
        >
          {children}
        </th>
      );
    },
    td: ({ node, children, ...props }: any) => {
      return (
        <td 
          className="px-3 py-3 text-sm text-gray-500 dark:text-gray-300 break-words sm:px-2 sm:py-2"
          {...props}
        >
          {children}
        </td>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);