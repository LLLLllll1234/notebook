import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium mb-2 text-zinc-900 dark:text-zinc-100">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 pl-6 list-disc">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 pl-6 list-decimal">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="mb-1 text-zinc-700 dark:text-zinc-300">
            {children}
          </li>
        ),
        pre: ({ children }) => (
          <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto mb-4">
            {children}
          </pre>
        ),
        code: ({ inline, children }) => {
          if (inline) {
            return (
              <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            )
          }
          return <code>{children}</code>
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic mb-4 text-zinc-600 dark:text-zinc-400">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-600">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 text-left font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-300 dark:border-zinc-600 px-4 py-2">
            {children}
          </td>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
}