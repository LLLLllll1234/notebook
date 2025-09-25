'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Package, Calendar, Tag, Settings, CheckCircle, AlertCircle, X } from 'lucide-react'
import { ExportResponse } from '@/lib/types'
import toast from 'react-hot-toast'

interface ExportComponentProps {
  availableTags?: string[]
  className?: string
}

interface ExportOptions {
  format: 'md' | 'json' | 'pdf' | 'zip'
  includeAttachments: boolean
  tagFilter: string
  dateRange: {
    from: string
    to: string
  }
}

export function ExportComponent({ availableTags = [], className = '' }: ExportComponentProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<NonNullable<ExportResponse['data']> | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeAttachments: false,
    tagFilter: '',
    dateRange: {
      from: '',
      to: ''
    }
  })

  const exportData = async () => {
    try {
      setIsExporting(true)
      setExportResult(null)
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: options.format,
          includeAttachments: options.includeAttachments,
          tagFilter: options.tagFilter || undefined,
          dateRange: (options.dateRange.from || options.dateRange.to) ? {
            from: options.dateRange.from || undefined,
            to: options.dateRange.to || undefined
          } : undefined
        })
      })

      const result: ExportResponse = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '导出失败')
      }

      setExportResult(result.data)
      setShowResult(true)
      toast.success(result.data.message)
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadFile = () => {
    if (exportResult?.downloadUrl) {
      const link = document.createElement('a')
      link.href = exportResult.downloadUrl
      link.download = exportResult.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const closeResult = () => {
    setShowResult(false)
    setExportResult(null)
  }

  const formatDescriptions = {
    json: 'JSON格式，包含完整的笔记数据，便于备份和迁移',
    md: '单个Markdown文件（单篇）或ZIP包（多篇），保持原格式',
    pdf: 'PDF文档，适合打印和分享',
    zip: 'ZIP压缩包，包含Markdown文件和附件'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Format Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          选择导出格式
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formatDescriptions).map(([format, description]) => (
            <motion.label
              key={format}
              className={`
                relative flex cursor-pointer rounded-lg border p-4 transition-all
                ${options.format === format
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="radio"
                name="format"
                value={format}
                checked={options.format === format}
                onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                className="sr-only"
              />
              
              <div className="flex w-full items-start space-x-3">
                <div className="flex-shrink-0">
                  {format === 'json' && <FileText className="h-5 w-5 text-blue-500" />}
                  {format === 'md' && <FileText className="h-5 w-5 text-green-500" />}
                  {format === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
                  {format === 'zip' && <Package className="h-5 w-5 text-purple-500" />}
                </div>
                
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {format.toUpperCase()}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                  </span>
                </div>
              </div>
              
              {options.format === format && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </motion.label>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>高级选项</span>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              {/* Include Attachments */}
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.includeAttachments}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeAttachments: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    包含附件文件
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    仅在ZIP格式导出时有效
                  </p>
                </div>
              </label>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  标签筛选
                </label>
                {availableTags.length > 0 ? (
                  <select
                    value={options.tagFilter}
                    onChange={(e) => setOptions(prev => ({ ...prev, tagFilter: e.target.value }))}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">所有标签</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={options.tagFilter}
                    onChange={(e) => setOptions(prev => ({ ...prev, tagFilter: e.target.value }))}
                    placeholder="输入标签名称..."
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={options.dateRange.from}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, from: e.target.value }
                    }))}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={options.dateRange.to}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, to: e.target.value }
                    }))}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={exportData}
          disabled={isExporting}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          whileHover={!isExporting ? { scale: 1.05 } : {}}
          whileTap={!isExporting ? { scale: 0.95 } : {}}
        >
          {isExporting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Download className="h-5 w-5" />
            </motion.div>
          ) : (
            <Download className="h-5 w-5" />
          )}
          <span>{isExporting ? '导出中...' : '开始导出'}</span>
        </motion.button>
      </div>

      {/* Export Result */}
      <AnimatePresence>
        {showResult && exportResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                    导出成功
                  </h4>
                  
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    {exportResult.message}
                  </p>
                  
                  <div className="mt-3 flex items-center space-x-3">
                    <button
                      onClick={downloadFile}
                      className="inline-flex items-center space-x-1 text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 font-medium"
                    >
                      <Download className="h-4 w-4" />
                      <span>下载文件</span>
                    </button>
                    
                    <span className="text-xs text-green-600 dark:text-green-400">
                      文件名: {exportResult.fileName}
                    </span>
                  </div>
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
    </div>
  )
}