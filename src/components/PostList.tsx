'use client'

import { PostWithTags } from '@/lib/types'
import { formatDate, extractContent } from '@/lib/utils'
import { Calendar, Tag, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { useSelectionStore } from '@/lib/stores'
import { motion } from 'framer-motion'
import { useHotkeys } from 'react-hotkeys-hook'

interface PostListProps {
  posts: PostWithTags[]
}

export function PostList({ posts }: PostListProps) {
  const {
    selectedPosts,
    bulkOperationMode,
    isSelected,
    togglePost,
    selectAll,
    clearSelection
  } = useSelectionStore()

  // 快捷键支持
  useHotkeys('ctrl+a', (e) => {
    if (bulkOperationMode) {
      e.preventDefault()
      selectAll(posts.map(p => p.id))
    }
  }, { enableOnFormTags: true })

  useHotkeys('escape', () => {
    if (bulkOperationMode) {
      clearSelection()
    }
  }, { enableOnFormTags: true })

  const handlePostClick = (post: PostWithTags, event: React.MouseEvent) => {
    if (bulkOperationMode) {
      event.preventDefault()
      togglePost(post.id)
    }
  }
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
      {posts.map((post, index) => {
        const selected = isSelected(post.id)
        
        return (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white dark:bg-zinc-900 rounded-lg border transition-all duration-200 ${
              bulkOperationMode
                ? selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
                : 'border-zinc-200 dark:border-zinc-700 hover:shadow-md'
            } p-6 ${bulkOperationMode ? 'cursor-pointer' : ''}`}
            onClick={(e) => handlePostClick(post, e)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {bulkOperationMode ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePost(post.id)
                        }}
                        className="flex-shrink-0 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        {selected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-zinc-400" />
                        )}
                      </button>
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {post.title}
                      </h3>
                    </div>
                  ) : (
                    <Link
                      href={`/post/${post.slug}`}
                      className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                    >
                      {post.title}
                    </Link>
                  )}
                </div>
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
                          onClick={(e) => bulkOperationMode && e.stopPropagation()}
                          className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          #{tagOnPost.tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 选择状态指示器 */}
              {bulkOperationMode && selected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
                >
                  已选择
                </motion.div>
              )}
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}