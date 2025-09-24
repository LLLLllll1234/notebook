import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PostForm } from '@/components/PostForm'
import { DeletePostButton } from '@/components/DeletePostButton'
import { updatePost, deletePost } from '@/lib/actions'
import { Toaster } from 'react-hot-toast'

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
    tags: post.tags.map((tagOnPost: any) => tagOnPost.tag.name).join(', '),
    id: post.id
  }

  const updatePostWithId = updatePost.bind(null, post.id)
  const deletePostWithId = deletePost.bind(null, post.id)

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-right" />
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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              编辑笔记
            </h1>
          </div>

          <DeletePostButton action={deletePostWithId} />
        </div>
      </div>

      <PostForm action={updatePostWithId} initialData={initialData} />
    </div>
  )
}