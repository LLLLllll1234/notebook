'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
// Removed framer-motion dependency
import toast from 'react-hot-toast'

interface MarkdownUploadProps {
  onFileProcessed?: (data: { title: string; content: string; tags?: string }) => void
  onError?: (error: string) => void
  className?: string
}

interface ProcessedFile {
  name: string
  title: string
  content: string
  tags: string
  status: 'processing' | 'completed' | 'error'
  error?: string
}

export function MarkdownUpload({ 
  onFileProcessed, 
  onError,
  className = '' 
}: MarkdownUploadProps) {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const processMarkdownFile = async (file: File): Promise<ProcessedFile> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          
          // 解析 Markdown 内容
          const lines = content.split('\n')
          let title = ''
          let actualContent = content
          let tags = ''
          
          // 尝试从文件名提取标题
          const fileNameTitle = file.name.replace(/\.md$/i, '').replace(/[-_]/g, ' ')
          
          // 查找标题（# 开头的第一行）
          const titleLineIndex = lines.findIndex(line => line.trim().startsWith('#'))
          if (titleLineIndex !== -1) {
            title = lines[titleLineIndex].replace(/^#+\s*/, '').trim()
            // 移除标题行，避免重复
            lines.splice(titleLineIndex, 1)
            actualContent = lines.join('\n').trim()
          } else {
            title = fileNameTitle
          }
          
          // 查找 frontmatter 中的标签
          if (content.startsWith('---')) {
            const frontmatterEnd = content.indexOf('---', 3)
            if (frontmatterEnd !== -1) {
              const frontmatter = content.substring(3, frontmatterEnd)
              const tagMatch = frontmatter.match(/tags?\s*:\s*(.+)/i)
              if (tagMatch) {
                // 处理不同格式的标签
                const tagString = tagMatch[1].trim()
                if (tagString.startsWith('[') && tagString.endsWith(']')) {
                  // 数组格式: [tag1, tag2]
                  tags = tagString.slice(1, -1).split(',').map(t => t.trim().replace(/['"]/g, '')).join(', ')
                } else {
                  // 简单字符串格式
                  tags = tagString.replace(/['"]/g, '')
                }
              }
              
              // 移除 frontmatter
              actualContent = content.substring(frontmatterEnd + 3).trim()
            }
          }
          
          // 如果还没有标题，使用文件名
          if (!title) {
            title = fileNameTitle
          }
          
          resolve({
            name: file.name,
            title,
            content: actualContent,
            tags,
            status: 'completed'
          })
        } catch (error) {
          resolve({
            name: file.name,
            title: '',
            content: '',
            tags: '',
            status: 'error',
            error: error instanceof Error ? error.message : '解析失败'
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          name: file.name,
          title: '',
          content: '',
          tags: '',
          status: 'error',
          error: '文件读取失败'
        })
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // 过滤只保留 Markdown 文件
    const markdownFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.md') || 
      file.type === 'text/markdown' || 
      file.type === 'text/plain'
    )

    if (markdownFiles.length === 0) {
      toast.error('请选择 Markdown 文件 (.md)')
      return
    }

    setIsProcessing(true)
    
    // 初始化处理状态
    const initialFiles: ProcessedFile[] = markdownFiles.map(file => ({
      name: file.name,
      title: '',
      content: '',
      tags: '',
      status: 'processing'
    }))
    
    setProcessedFiles(prev => [...prev, ...initialFiles])

    try {
      // 处理所有文件
      const results = await Promise.all(
        markdownFiles.map(processMarkdownFile)
      )

      // 更新处理结果
      setProcessedFiles(prev => {
        const updated = [...prev]
        results.forEach((result, index) => {
          const fileIndex = updated.findIndex(f => f.name === result.name && f.status === 'processing')
          if (fileIndex !== -1) {
            updated[fileIndex] = result
          }
        })
        return updated
      })

      // 成功处理的文件
      const successfulFiles = results.filter(f => f.status === 'completed')
      const failedFiles = results.filter(f => f.status === 'error')

      if (successfulFiles.length > 0) {
        toast.success(`成功解析 ${successfulFiles.length} 个 Markdown 文件`)
      }

      if (failedFiles.length > 0) {
        toast.error(`${failedFiles.length} 个文件解析失败`)
        failedFiles.forEach(file => {
          onError?.(file.error || '解析失败')
        })
      }

    } catch (error) {
      console.error('Processing error:', error)
      toast.error('文件处理过程中发生错误')
    } finally {
      setIsProcessing(false)
    }
  }, [onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.md']
    },
    multiple: true
  })

  const handleUseFile = (file: ProcessedFile) => {
    if (file.status === 'completed') {
      onFileProcessed?.(file)
      toast.success(`已导入 "${file.title}"`)
    }
  }

  const removeFile = (index: number) => {
    setProcessedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setProcessedFiles([])
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
        >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
            <FileText className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragActive ? '松开以上传文件' : '拖拽 Markdown 文件到这里'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              或点击选择文件 • 支持 .md 格式 • 支持多文件
            </p>
          </div>
          
          {!isDragActive && (
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105 active:scale-95"
            >
              <Upload className="h-4 w-4 inline mr-2" />
              选择文件
            </button>
          )}          
        </div>
      </div>

      {/* Processed Files */}
      {processedFiles.length > 0 && (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                已解析的文件 ({processedFiles.length})
              </h3>
              {processedFiles.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  清空全部
                </button>
              )}
            </div>

            {processedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </span>
                      
                      {file.status === 'processing' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                      )}
                      {file.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    
                    {file.status === 'completed' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">标题:</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {file.title || '无标题'}
                          </p>
                        </div>
                        {file.tags && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">标签:</span>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {file.tags}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">内容预览:</span>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {file.content.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {file.error}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {file.status === 'completed' && (
                      <button
                        onClick={() => handleUseFile(file)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        使用此文件
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}