import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import slugify from 'slugify'
// 移除默认的 highlight.js 主题，我们将自定义样式
// import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 生成标题ID的函数
  const generateHeadingId = (children: any) => {
    let text = typeof children === 'string' ? children : 
      Array.isArray(children) ? children.join('') :
      children?.toString() || ''
    
    // 清理标题前缀（如"一级标题："、"二级标题："等）
    text = text.replace(/^(一级标题|二级标题|三级标题|四级标题|五级标题|六级标题)：/, '')
    text = text.replace(/^(Level\s*\d+|H\d+)\s*[:：]\s*/, '')
    text = text.trim()
    
    const id = slugify(text, { lower: true, strict: true, locale: 'zh' })
    console.log('Generated heading ID:', { originalText: children, cleanedText: text, id }) // 调试信息
    return id
  }
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h1 id={id} className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              {children}
            </h1>
          )
        },
        h2: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h2 id={id} className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              {children}
            </h2>
          )
        },
        h3: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h3 id={id} className="text-lg font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              {children}
            </h3>
          )
        },
        h4: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h4 id={id} className="text-base font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              {children}
            </h4>
          )
        },
        h5: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h5 id={id} className="text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              {children}
            </h5>
          )
        },
        h6: ({ children }) => {
          const id = generateHeadingId(children)
          return (
            <h6 id={id} className="text-xs font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              {children}
            </h6>
          )
        },
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
          <pre className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4 rounded-lg overflow-x-auto mb-4 text-zinc-900 dark:text-zinc-100">
            {children}
          </pre>
        ),
        code: ({ children, className }: any) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono border border-zinc-200 dark:border-zinc-600">
                {children}
              </code>
            )
          }
          // 代码块中的代码元素，使用更高对比度的颜色
          return (
            <code className={`${className} text-zinc-900 dark:text-zinc-100 font-mono`}>
              {children}
            </code>
          )
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