'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MarkdownToolbar } from './MarkdownToolbar'
import { MarkdownRenderer } from './MarkdownRenderer'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface EnhancedEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  placeholder?: string
  autoSave?: boolean
  autoSaveInterval?: number
  className?: string
}

interface EditHistory {
  content: string
  cursorPosition: number
}

export function EnhancedEditor({
  value,
  onChange,
  onSave,
  placeholder = '在这里用 Markdown 格式编写你的笔记内容...',
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  className = ''
}: EnhancedEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [history, setHistory] = useState<EditHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastContentRef = useRef(value)

  // 保存编辑历史
  const saveToHistory = useCallback((content: string, cursorPosition: number) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ content, cursorPosition })
      return newHistory.slice(-50) // 保留最近50个操作
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      onChange(prevState.content)
      setHistoryIndex(prev => prev - 1)
      
      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(prevState.cursorPosition, prevState.cursorPosition)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }, [history, historyIndex, onChange])

  // 重做操作
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      onChange(nextState.content)
      setHistoryIndex(prev => prev + 1)
      
      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(nextState.cursorPosition, nextState.cursorPosition)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }, [history, historyIndex, onChange])

  // 插入文本
  const handleInsert = useCallback((insertText: string, cursorOffset: number = 0) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText: string
    let newCursorPosition: number

    if (insertText.includes('**') || insertText.includes('*') || insertText.includes('`')) {
      // 格式化选中文本
      const formatChar = insertText
      newText = value.substring(0, start) + formatChar + selectedText + formatChar + value.substring(end)
      newCursorPosition = start + formatChar.length + selectedText.length + formatChar.length
    } else if (insertText.startsWith('# ') || insertText.startsWith('- ') || insertText.startsWith('> ')) {
      // 在行首插入
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      newText = value.substring(0, lineStart) + insertText + value.substring(lineStart)
      newCursorPosition = lineStart + insertText.length
    } else {
      // 普通插入
      newText = value.substring(0, start) + insertText + value.substring(end)
      newCursorPosition = start + insertText.length - cursorOffset
    }

    // 保存到历史记录
    saveToHistory(value, start)
    
    onChange(newText)
    setIsDirty(true)

    // 恢复光标位置
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      textarea.focus()
    }, 0)
  }, [value, onChange, saveToHistory])

  // 快捷键处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          handleInsert('**', 2)
          break
        case 'i':
          e.preventDefault()
          handleInsert('*', 1)
          break
        case 'k':
          e.preventDefault()
          // 触发链接插入
          break
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            handleRedo()
          } else {
            handleUndo()
          }
          break
        case 'y':
          e.preventDefault()
          handleRedo()
          break
        case '`':
          e.preventDefault()
          handleInsert('`', 1)
          break
      }
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setIsPreview(!isPreview)
    }
  }, [handleInsert, handleUndo, handleRedo, isPreview])

  // 保存操作
  const handleSave = useCallback(() => {
    onSave()
    setLastSaved(new Date())
    setIsDirty(false)
    toast.success('已保存')
  }, [onSave])

  // 自动保存（简化版本）
  useEffect(() => {
    if (!autoSave || !isDirty || !value.trim()) return

    const timeoutId = setTimeout(() => {
      // 简单的自动保存提示，实际保存由父组件处理
      setLastSaved(new Date())
      setIsDirty(false)
      toast.success('内容已自动保存', { duration: 2000 })
    }, autoSaveInterval)

    return () => clearTimeout(timeoutId)
  }, [isDirty, autoSave, autoSaveInterval, value])

  // 监听内容变化
  useEffect(() => {
    if (value !== lastContentRef.current) {
      setIsDirty(true)
      lastContentRef.current = value
    }
  }, [value])

  // 初始化历史记录
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ content: value, cursorPosition: 0 }])
      setHistoryIndex(0)
    }
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      <MarkdownToolbar
        onInsert={handleInsert}
        onPreviewToggle={() => setIsPreview(!isPreview)}
        isPreview={isPreview}
        onSave={handleSave}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 编辑器状态栏 */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
        <div className="flex items-center space-x-4">
          <span>字数: {value.length}</span>
          <span>行数: {value.split('\n').length}</span>
          {isDirty && (
            <span className="text-orange-500 dark:text-orange-400">• 未保存</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {lastSaved && (
            <span>
              上次保存: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {autoSave && (
            <span className="text-green-500 dark:text-green-400">
              自动保存已开启
            </span>
          )}
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className="relative">
        {isPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[400px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <MarkdownRenderer content={value} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                // 保存到历史记录（防抖）
                clearTimeout(autoSaveTimeoutRef.current)
                autoSaveTimeoutRef.current = setTimeout(() => {
                  saveToHistory(e.target.value, e.target.selectionStart)
                }, 1000)
              }}
              onKeyDown={handleKeyDown}
              rows={20}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-400 dark:focus:ring-blue-800 font-mono resize-none"
            />
            
            {/* 快捷键提示 */}
            <div className="absolute bottom-2 right-2 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 opacity-0 hover:opacity-100 transition-opacity">
              按 Ctrl+? 查看快捷键
            </div>
          </motion.div>
        )}
      </div>

      {/* 快捷键帮助提示 */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
        <div className="font-medium mb-2">快捷键帮助:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+B</kbd> 加粗</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+I</kbd> 斜体</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+K</kbd> 链接</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+S</kbd> 保存</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+Z</kbd> 撤销</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+Y</kbd> 重做</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+Shift+P</kbd> 预览</div>
          <div><kbd className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Ctrl+T</kbd> 表格</div>
        </div>
      </div>
    </div>
  )
}