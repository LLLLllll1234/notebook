'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/utils'
import { Plus, Edit, Calendar, Tag, Upload, Download, FileText } from 'lucide-react'
import { PostList } from '@/components/post'
import { BulkOperationToolbar } from '@/components/bulk'
import { PostWithTags } from '@/lib/types/types'
import { useSelectionStore } from '@/lib/stores'
import toast, { Toaster } from 'react-hot-toast'

export default function DashboardPage() {
  const [posts, setPosts] = useState<PostWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalTags: 0,
    monthlyUpdates: 0
  })
  const { clearSelection } = useSelectionStore()

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // 使用API返回的统计数据
        const totalPosts = data.stats?.totalPosts || data.posts?.length || 0
        const totalTags = data.stats?.totalTags || 0
        const monthlyUpdates = data.posts?.filter((post: any) => {
          const postDate = new Date(post.updatedAt)
          const now = new Date()
          return postDate.getMonth() === now.getMonth() && 
                 postDate.getFullYear() === now.getFullYear()
        }).length || 0
        
        setStats({
          totalPosts,
          totalTags,
          monthlyUpdates
        })
      } else {
        console.error('API返回错误:', response.status)
        toast.error('加载数据失败')
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // 清理选择状态
    return () => clearSelection()
  }, [])

  const handlePostsChange = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="animate-pulse flex items-center space-x-3">
                <div className="bg-zinc-200 dark:bg-zinc-700 rounded-lg w-10 h-10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            管理后台
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            管理你的学习笔记
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/import-export"
            className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>导入导出</span>
          </Link>
          
          <Link
            href="/dashboard/new"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新建笔记</span>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">总笔记数</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
              <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">标签数量</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalTags}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
              <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">本月更新</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.monthlyUpdates}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 批量操作工具栏 */}
      <BulkOperationToolbar posts={posts} onPostsChange={handlePostsChange} />

      {/* Posts List */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            最近的笔记
          </h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="p-12 text-center">
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
        ) : (
          <div className="p-6">
            <PostList posts={posts} />
          </div>
        )}
      </div>
    </div>
  )
}