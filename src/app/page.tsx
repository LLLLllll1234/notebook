import { prisma } from '@/lib/prisma'
import { PostList } from '@/components/PostList'
import { SearchBar } from '@/components/SearchBar'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q || ''
  
  let posts
  if (query) {
    // Search functionality
    if (query.startsWith('#')) {
      const tagName = query.substring(1).trim()
      posts = await prisma.post.findMany({
        where: {
          tags: {
            some: {
              tag: {
                name: {
                  contains: tagName
                }
              }
            }
          }
        },
        include: {
          tags: {
            include: {
              tag: true,
              post: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    } else {
      posts = await prisma.post.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query
              }
            },
            {
              content: {
                contains: query
              }
            }
          ]
        },
        include: {
          tags: {
            include: {
              tag: true,
              post: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    }
  } else {
    posts = await prisma.post.findMany({
      include: {
        tags: {
          include: {
            tag: true,
            post: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            学习笔记
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            记录学习过程，分享知识心得
          </p>
        </div>
        
        <Link
          href="/dashboard/new"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>新建笔记</span>
        </Link>
      </div>

      <SearchBar initialQuery={query} />

      {query && (
        <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>搜索结果：</span>
          <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
            {query}
          </code>
          <span>({posts.length} 篇)</span>
        </div>
      )}

      <PostList posts={posts} />
    </div>
  )
}