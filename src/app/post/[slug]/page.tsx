import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { AttachmentManager } from '@/components/AttachmentManager'
import { formatDate } from '@/lib/utils'
import { Calendar, Tag, ArrowLeft, Edit, Paperclip } from 'lucide-react'

interface PostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, content: true }
  })

  if (!post) {
    return {
      title: '文章未找到'
    }
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160)
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      attachments: true
    }
  })

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回首页</span>
        </Link>

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
                  {post.tags.map((tagOnPost) => (
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
            attachments={post.attachments.map(att => ({
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
  )
}