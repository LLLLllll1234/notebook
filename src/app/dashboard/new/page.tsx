import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from '@/components/PostForm'
import { createPost } from '@/lib/actions'

export default function NewPostPage() {
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

        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          创建新笔记
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          记录你的学习心得和知识点
        </p>
      </div>

      <PostForm action={createPost} />
    </div>
  )
}