'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Download, CheckCircle, AlertCircle, X, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImportResponse } from '@/lib/types'
import toast from 'react-hot-toast'

interface ImportComponentProps {
  onImportComplete?: (result: any) => void
  className?: string
}

interface ImportResult {
  recordId: string
  itemCount: number
  createdPosts: string[]
  message: string
  errors: string[]
}

const acceptedFiles = {
  'text/markdown': ['.md'],
  'text/plain': ['.txt'],
  'application/json': ['.json'],
  'application/zip': ['.zip']
}

export function ImportComponent({ onImportComplete, className = '' }: ImportComponentProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'overwrite' | 'rename'>('rename')
  const [showResult, setShowResult] = useState(false)

  const importFile = async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conflictStrategy', conflictStrategy)

    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData
    })

    const result: ImportResponse = await response.json()
    
    if (!result.success || !result.data) {
      throw new Error(result.error || '导入失败')
    }

    return result.data
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    try {
      setIsImporting(true)
      setImportResult(null)
      
      const result = await importFile(file)
      setImportResult(result)
      setShowResult(true)
      
      if (result.createdPosts.length > 0) {
        toast.success(result.message)
        onImportComplete?.(result)
      } else {
        toast.error(result.message)
      }
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxFiles: 1,
    disabled: isImporting
  })

  const closeResult = () => {
    setShowResult(false)
    setImportResult(null)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Conflict Strategy Selection */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              冲突处理策略
            </h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="conflictStrategy"
                  value="rename"
                  checked={conflictStrategy === 'rename'}
                  onChange={(e) => setConflictStrategy(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  重命名 - 为重复标题添加后缀 (推荐)
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="conflictStrategy"
                  value="skip"
                  checked={conflictStrategy === 'skip'}
                  onChange={(e) => setConflictStrategy(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  跳过 - 忽略已存在的笔记
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="conflictStrategy"
                  value="overwrite"
                  checked={conflictStrategy === 'overwrite'}
                  onChange={(e) => setConflictStrategy(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  覆盖 - 替换已存在的笔记 (谨慎使用)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        whileHover={!isImporting ? { scale: 1.01 } : {}}
        whileTap={!isImporting ? { scale: 0.99 } : {}}
      >
        <input {...getInputProps()} disabled={isImporting} />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            {isImporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Upload className="h-6 w-6 text-blue-500" />
              </motion.div>
            ) : (
              <FileText className={`h-6 w-6 ${isDragActive ? 'text-green-500' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isImporting ? '正在导入...' : 
               isDragActive ? '放下文件以导入' : '选择文件导入笔记'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              支持 Markdown (.md), 文本 (.txt), JSON (.json), 压缩包 (.zip)
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Import Progress */}
      {isImporting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Upload className="h-5 w-5 text-blue-500" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                正在处理文件...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                请稍候，正在解析和导入笔记内容
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Import Result */}
      <AnimatePresence>
        {showResult && importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border rounded-lg p-4 ${
              importResult.createdPosts.length > 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {importResult.createdPosts.length > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${
                    importResult.createdPosts.length > 0
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    导入结果
                  </h4>
                  
                  <p className={`text-sm mt-1 ${
                    importResult.createdPosts.length > 0
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {importResult.message}
                  </p>
                  
                  {importResult.createdPosts.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                        成功导入的笔记:
                      </p>
                      <div className="space-y-1">
                        {importResult.createdPosts.slice(0, 5).map((slug, index) => (
                          <a
                            key={index}
                            href={`/post/${slug}`}
                            className="inline-block text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline mr-2"
                          >
                            {slug}
                          </a>
                        ))}
                        {importResult.createdPosts.length > 5 && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ...还有 {importResult.createdPosts.length - 5} 个
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                        错误详情:
                      </p>
                      <div className="space-y-1">
                        {importResult.errors.slice(0, 3).map((error, index) => (
                          <p key={index} className="text-xs text-red-700 dark:text-red-300">
                            • {error}
                          </p>
                        ))}
                        {importResult.errors.length > 3 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ...还有 {importResult.errors.length - 3} 个错误
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={closeResult}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format Help */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          支持的导入格式
        </h4>
        
        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Markdown (.md):</span>
            <p>支持 Front Matter 格式，自动提取标题、标签和日期</p>
          </div>
          
          <div>
            <span className="font-medium">JSON (.json):</span>
            <p>格式: {`{ "posts": [{ "title": "标题", "content": "内容", "tags": ["标签"] }] }`}</p>
          </div>
          
          <div>
            <span className="font-medium">文本 (.txt):</span>
            <p>纯文本内容，文件名将作为标题</p>
          </div>
          
          <div>
            <span className="font-medium">压缩包 (.zip):</span>
            <p>包含多个 Markdown, JSON 或文本文件的压缩包</p>
          </div>
        </div>
      </div>
    </div>
  )
}