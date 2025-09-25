'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MarkdownRenderer } from '@/components/editor'
import { FloatingTOC } from '@/components/navigation'
import { AttachmentManager } from '@/components/post'
import { formatDate } from '@/lib/utils/utils'
import { Calendar, Tag, ArrowLeft, Edit, Paperclip, List } from 'lucide-react'

interface PostPageProps {
  params: {
    slug: string
  }
}

export default function PostPage({ params }: PostPageProps) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showTOC, setShowTOC] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data.post)
        } else {
          setPost(null)
        }
      } catch (error) {
        console.error('获取文章失败:', error)
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  return (
    <div className="relative">
      {/* 目录功能 */}
      {showTOC && post && (
        <FloatingTOC 
          content={post.content} 
          visible={showTOC}
          position="right"
          onToggle={() => setShowTOC(false)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回首页</span>
            </Link>
            
            {!showTOC && (
              <button
                onClick={() => setShowTOC(true)}
                className="inline-flex items-center space-x-2 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <List className="h-4 w-4" />
                <span>显示目录</span>
              </button>
            )}
          </div>

        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>更新于 {formatDate(new Date(post.updatedAt))}</span>
            </div>

            {post.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tagOnPost: any) => (
                    <Link
                      key={tagOnPost.tag.id}
                      href={`/?q=${encodeURIComponent('#' + tagOnPost.tag.name)}`}
                      className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      #{tagOnPost.tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={`/dashboard/edit/${post.id}`}
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>编辑</span>
            </Link>
          </div>
        </header>
      </div>

      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <MarkdownRenderer content={post.content} />
      </article>

      {/* Attachments Section */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center space-x-2 mb-4">
            <Paperclip className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              附件
            </h3>
          </div>
          <AttachmentManager
            attachments={post.attachments.map((att: any) => ({
              id: att.id,
              originalName: att.originalName,
              fileName: att.fileName,
              filePath: att.filePath,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
              uploadedAt: att.uploadedAt
            }))}
            showActions={false}
          />
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            创建于 {formatDate(new Date(post.createdAt))}
          </div>
          
          <Link
            href={`/dashboard/edit/${post.id}`}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>编辑文章</span>
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}