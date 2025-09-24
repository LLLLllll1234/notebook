import Link from 'next/link'
import { ArrowLeft, FileX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-zinc-400 dark:text-zinc-600">
          <FileX className="mx-auto h-16 w-16" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            页面未找到
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
          
          <Link
            href="/dashboard/new"
            className="inline-flex items-center space-x-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span>创建新笔记</span>
          </Link>
        </div>
      </div>
    </div>
  )
}