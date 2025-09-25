'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { File, Image, FileText, Download, Trash2, ExternalLink } from 'lucide-react'
import { AttachmentData } from '@/lib/types/types'
import toast from 'react-hot-toast'

interface AttachmentManagerProps {
  postId?: string
  attachments?: AttachmentData[]
  onAttachmentDeleted?: (id: string) => void
  showActions?: boolean
  className?: string
}

export function AttachmentManager({
  postId,
  attachments: initialAttachments,
  onAttachmentDeleted,
  showActions = true,
  className = ''
}: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<AttachmentData[]>(initialAttachments || [])
  const [loading, setLoading] = useState(!initialAttachments)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!initialAttachments) {
      fetchAttachments()
    }
  }, [postId, initialAttachments])

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      const url = postId ? `/api/attachments?postId=${postId}` : '/api/attachments'
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setAttachments(result.data)
      } else {
        toast.error('获取附件失败')
      }
    } catch (error) {
      console.error('Fetch attachments error:', error)
      toast.error('获取附件失败')
    } finally {
      setLoading(false)
    }
  }

  const deleteAttachment = async (id: string) => {
    try {
      setDeleting(id)
      const response = await fetch(`/api/upload?id=${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAttachments(prev => prev.filter(att => att.id !== id))
        onAttachmentDeleted?.(id)
        toast.success('附件删除成功')
      } else {
        toast.error('删除附件失败')
      }
    } catch (error) {
      console.error('Delete attachment error:', error)
      toast.error('删除附件失败')
    } finally {
      setDeleting(null)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyMarkdownLink = (attachment: AttachmentData) => {
    const isImage = attachment.mimeType.startsWith('image/')
    const markdown = isImage 
      ? `![${attachment.originalName}](${attachment.filePath})`
      : `[${attachment.originalName}](${attachment.filePath})`
    
    navigator.clipboard.writeText(markdown)
    toast.success('Markdown链接已复制')
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {postId ? '此笔记暂无附件' : '暂无上传的文件'}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        附件 ({attachments.length})
      </h4>
      
      <AnimatePresence>
        {attachments.map((attachment) => (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {getFileIcon(attachment.mimeType)}
                
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.originalName}
                  </h5>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.fileSize)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(attachment.uploadedAt)}
                    </span>
                  </div>
                  
                  {/* Image Preview */}
                  {attachment.mimeType.startsWith('image/') && (
                    <div className="mt-2">
                      <img
                        src={attachment.filePath}
                        alt={attachment.originalName}
                        className="h-20 w-20 object-cover rounded border"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>

              {showActions && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => copyMarkdownLink(attachment)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
                    title="复制Markdown链接"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  
                  <a
                    href={attachment.filePath}
                    download={attachment.originalName}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded"
                    title="下载文件"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  
                  <button
                    onClick={() => deleteAttachment(attachment.id)}
                    disabled={deleting === attachment.id}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded disabled:opacity-50"
                    title="删除附件"
                  >
                    <Trash2 className={`h-4 w-4 ${deleting === attachment.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}