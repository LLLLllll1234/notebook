import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  Files,
  Image as ImageIcon,
  FileText,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface StorageStats {
  totalFiles: number
  totalSize: number
  imageFiles: number
  documentFiles: number
  imageSize: number
  documentSize: number
  diskUsage: {
    totalSize: number
    usedSize: number
    availableSize: number
  }
}

interface CleanupResult {
  removedFiles: number
  freedSpace: number
  errors: string[]
}

export function StorageManager() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)

  useEffect(() => {
    fetchStorageStats()
  }, [])

  const fetchStorageStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/storage?action=stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        toast.error('获取存储统计失败')
      }
    } catch (error) {
      console.error('Fetch storage stats error:', error)
      toast.error('获取存储统计失败')
    } finally {
      setLoading(false)
    }
  }

  const performCleanup = async () => {
    try {
      setCleaning(true)
      const response = await fetch('/api/storage?action=cleanup')
      const result = await response.json()
      
      if (result.success) {
        setCleanupResult(result.data)
        
        if (result.data.removedFiles > 0) {
          toast.success(`清理完成：删除 ${result.data.removedFiles} 个文件，释放 ${formatFileSize(result.data.freedSpace)} 空间`)
        } else {
          toast.success('清理完成：没有找到需要清理的文件')
        }
        
        // 重新获取统计信息
        await fetchStorageStats()
      } else {
        toast.error('存储清理失败')
      }
    } catch (error) {
      console.error('Storage cleanup error:', error)
      toast.error('存储清理失败')
    } finally {
      setCleaning(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const calculatePercentage = (used: number, total: number): number => {
    return total > 0 ? Math.round((used / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          无法加载存储统计信息
        </p>
        <button
          onClick={fetchStorageStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          存储管理
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStorageStats}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
          
          <button
            onClick={performCleanup}
            disabled={cleaning}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className={`h-4 w-4 ${cleaning ? 'animate-pulse' : ''}`} />
            <span>{cleaning ? '清理中...' : '清理存储'}</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                总文件数
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalFiles}
              </p>
            </div>
            <Files className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                图片文件
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.imageFiles}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(stats.imageSize)}
              </p>
            </div>
            <ImageIcon className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                文档文件
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.documentFiles}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(stats.documentSize)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                总大小
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatFileSize(stats.totalSize)}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* 磁盘使用情况 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          磁盘使用情况
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">已使用</span>
            <span className="font-medium">{formatFileSize(stats.diskUsage.usedSize)}</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${calculatePercentage(stats.diskUsage.usedSize, stats.diskUsage.totalSize)}%` 
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>0 B</span>
            <span>{formatFileSize(stats.diskUsage.totalSize)}</span>
          </div>
        </div>
      </motion.div>

      {/* 清理结果 */}
      {cleanupResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            最近清理结果
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              删除文件: <span className="font-medium">{cleanupResult.removedFiles}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              释放空间: <span className="font-medium">{formatFileSize(cleanupResult.freedSpace)}</span>
            </p>
            
            {cleanupResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  清理过程中的错误:
                </p>
                <ul className="mt-2 space-y-1">
                  {cleanupResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-500 dark:text-red-400">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}