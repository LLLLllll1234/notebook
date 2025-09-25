import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from '@/components/post'
import { createPost } from '@/lib/actions'
import { Toaster } from 'react-hot-toast'

export default function NewPostPage() {
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
      </div>

      <PostForm action={createPost} />
    </div>
  )
}