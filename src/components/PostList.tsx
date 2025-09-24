import Link from 'next/link'
import { PostWithTags } from '@/lib/types'
import { formatDate, extractContent } from '@/lib/utils'
import { Calendar, Tag } from 'lucide-react'

interface PostListProps {
  posts: PostWithTags[]
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-400 dark:text-zinc-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          暂无笔记
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          开始创建你的第一篇学习笔记吧
        </p>
        <Link
          href="/dashboard/new"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          创建笔记
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="space-y-4">
            <div>
              <Link
                href={`/post/${post.slug}`}
                className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {post.title}
              </Link>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {extractContent(post.content)}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(new Date(post.updatedAt))}</span>
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
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}