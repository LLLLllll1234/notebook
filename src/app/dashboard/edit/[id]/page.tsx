import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PostForm } from '@/components/PostForm'
import { updatePost, deletePost } from '@/lib/actions'

interface EditPostPageProps {
  params: {
    id: string
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!post) {
    notFound()
  }

  const initialData = {
    title: post.title,
    content: post.content,
    tags: post.tags.map(tagOnPost => tagOnPost.tag.name).join(', ')
  }

  const updatePostWithId = updatePost.bind(null, post.id)
  const deletePostWithId = deletePost.bind(null, post.id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回管理后台</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              编辑笔记
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              修改你的学习笔记内容
            </p>
          </div>

          <form action={deletePostWithId}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm('确定要删除这篇笔记吗？此操作不可撤销。')) {
                  e.preventDefault()
                }
              }}
              className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>删除</span>
            </button>
          </form>
        </div>
      </div>

      <PostForm action={updatePostWithId} initialData={initialData} />
    </div>
  )
}