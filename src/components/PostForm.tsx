'use client'

import { useState } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface PostFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: {
    title: string
    content: string
    tags: string
  }
}

export function PostForm({ action, initialData }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [tags, setTags] = useState(initialData?.tags || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await action(formData)
    } catch (error) {
      console.error('Failed to save post:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          标题
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-400 dark:focus:ring-blue-800"
          placeholder="输入笔记标题..."
        />
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          标签
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-400 dark:focus:ring-blue-800"
          placeholder="标签1, 标签2, 标签3 (用逗号分隔)"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            内容
          </label>
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="inline-flex items-center space-x-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            {isPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>编辑模式</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>预览模式</span>
              </>
            )}
          </button>
        </div>

        {isPreview ? (
          <div className="min-h-[400px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        ) : (
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-400 dark:focus:ring-blue-800 font-mono"
            placeholder="在这里用 Markdown 格式编写你的笔记内容..."
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          支持 Markdown 语法，包括代码高亮、表格、链接等
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? '保存中...' : '保存笔记'}</span>
        </button>
      </div>
    </form>
  )
}