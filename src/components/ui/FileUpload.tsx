'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, Image, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadResponse, AttachmentData } from '@/lib/types/types'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onUploadComplete?: (files: AttachmentData[]) => void
  postId?: string
  maxFiles?: number
  accept?: Record<string, string[]>
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  result?: AttachmentData
  error?: string
}

const defaultAccept = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.md'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/zip': ['.zip']
}

export function FileUpload({ 
  onUploadComplete, 
  postId, 
  maxFiles = 10, 
  accept = defaultAccept,
  className = ''
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const uploadFile = async (file: File): Promise<AttachmentData> => {
    const formData = new FormData()
    formData.append('file', file)
    if (postId) {
      formData.append('postId', postId)
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result: UploadResponse = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error(result.error || '上传失败')
    }

    return result.data
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Check if total files would exceed limit
    if (uploadingFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    // Initialize uploading state
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Upload files
    const uploadPromises = acceptedFiles.map(async (file, index) => {
      try {
        // Simulate progress updates
        const fileIndex = uploadingFiles.length + index
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const updated = [...prev]
            if (updated[fileIndex] && updated[fileIndex].status === 'uploading') {
              updated[fileIndex].progress = Math.min(updated[fileIndex].progress + 10, 90)
            }
            return updated
          })
        }, 200)

        const result = await uploadFile(file)
        
        clearInterval(progressInterval)
        
        setUploadingFiles(prev => {
          const updated = [...prev]
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress: 100,
            status: 'completed',
            result
          }
          return updated
        })

        return result
      } catch (error) {
        setUploadingFiles(prev => {
          const updated = [...prev]
          updated[uploadingFiles.length + index] = {
            ...updated[uploadingFiles.length + index],
            status: 'error',
            error: error instanceof Error ? error.message : '上传失败'
          }
          return updated
        })
        throw error
      }
    })

    try {
      const results = await Promise.allSettled(uploadPromises)
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<AttachmentData> => 
          result.status === 'fulfilled')
        .map(result => result.value)

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads)
        toast.success(`成功上传 ${successfulUploads.length} 个文件`)
      }

      const failedUploads = results.filter(result => result.status === 'rejected')
      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} 个文件上传失败`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传过程中发生错误')
    }
  }, [uploadingFiles.length, maxFiles, postId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    } else if (file.type === 'application/pdf') {
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div {...getRootProps()}>
        <motion.div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${(isDragActive || dropzoneActive)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploadingFiles.length > 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
          `}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Upload className={`h-6 w-6 ${(isDragActive || dropzoneActive) ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {(isDragActive || dropzoneActive) ? '放下文件以上传' : '拖拽文件到此处上传'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              或点击选择文件 (最大 {maxFiles} 个文件，每个文件最大 10MB)
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              支持: 图片 (JPG, PNG, GIF, WebP), 文档 (PDF, DOC, DOCX, TXT, MD), 压缩包 (ZIP)
            </p>
          </div>
        </motion.div>
        </motion.div>
      </div>

      {/* Uploading Files List */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              上传进度 ({uploadingFiles.length})
            </h4>
            
            {uploadingFiles.map((uploadingFile, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(uploadingFile.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadingFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadingFile.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {uploadingFile.progress}%
                        </span>
                      </div>
                    )}
                    
                    {uploadingFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    
                    {uploadingFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}

                    <button
                      onClick={() => removeUploadingFile(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {uploadingFile.error && (
                  <p className="text-xs text-red-500 mt-2">{uploadingFile.error}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}