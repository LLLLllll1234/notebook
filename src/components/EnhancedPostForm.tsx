'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bold, Italic, Strikethrough, Code, Link, Image, List, ListOrdered, 
  Quote, Minus, Table, Eye, EyeOff, Type, AlignLeft, Maximize2,
  Save, Paperclip, RotateCcw, RotateCw, Search
} from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { FileUpload } from './FileUpload'
import { AttachmentManager } from './AttachmentManager'
import { AttachmentData } from '@/lib/types'
import toast from 'react-hot-toast'

interface EnhancedPostFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: {
    title: string
    content: string
    tags: string
    id?: string
  }
}

interface EditorAction {
  icon: React.ComponentType<any>
  label: string
  shortcut?: string
  action: () => void
  separator?: boolean
}

export function EnhancedPostForm({ action, initialData }: EnhancedPostFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [tags, setTags] = useState(initialData?.tags || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // Editor state
  const [history, setHistory] = useState<string[]>([content])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 })

  // Save to history for undo/redo
  const saveToHistory = useCallback((newContent: string) => {
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newContent)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }, [history, historyIndex])

  // Update cursor position
  const updateCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current
      setCursorPosition({ start: selectionStart, end: selectionEnd })
    }
  }, [])

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string, offset = 0) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    
    setContent(newContent)
    saveToHistory(newContent)
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + text.length + offset
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }, [content, saveToHistory])

  // Wrap selected text
  const wrapText = useCallback((before: string, after: string = before) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = before + selectedText + after
    const newContent = content.substring(0, start) + newText + content.substring(end)
    
    setContent(newContent)
    saveToHistory(newContent)
    
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length)
      } else {
        const newPosition = start + before.length
        textarea.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }, [content, saveToHistory])

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setContent(history[newIndex])
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setContent(history[newIndex])
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            wrapText('**')
            break
          case 'i':
            e.preventDefault()
            wrapText('*')
            break
          case 'k':
            e.preventDefault()
            insertAtCursor('[]()', -1)
            break
          case 'z':
            e.preventDefault()
            undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'f':
            e.preventDefault()
            setShowSearch(true)
            break
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key) {
          case 'Z':
            e.preventDefault()
            redo()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [wrapText, insertAtCursor, undo, redo])

  // Editor actions
  const editorActions: EditorAction[] = [
    {
      icon: Bold,
      label: '粗体',
      shortcut: 'Ctrl+B',
      action: () => wrapText('**')
    },
    {
      icon: Italic,
      label: '斜体',
      shortcut: 'Ctrl+I',
      action: () => wrapText('*')
    },
    {
      icon: Strikethrough,
      label: '删除线',
      action: () => wrapText('~~')
    },
    {
      icon: Code,
      label: '行内代码',
      action: () => wrapText('`')
    },
    {
      icon: Quote,
      label: '引用',
      action: () => insertAtCursor('> '),
      separator: true
    },
    {
      icon: List,
      label: '无序列表',
      action: () => insertAtCursor('- ')
    },
    {
      icon: ListOrdered,
      label: '有序列表',
      action: () => insertAtCursor('1. ')
    },
    {
      icon: Link,
      label: '链接',
      shortcut: 'Ctrl+K',
      action: () => insertAtCursor('[]()', -1)
    },
    {
      icon: Image,
      label: '图片',
      action: () => insertAtCursor('![]()', -1)
    },
    {
      icon: Table,
      label: '表格',
      action: () => insertAtCursor('\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n'),
      separator: true
    },
    {
      icon: Minus,
      label: '分割线',
      action: () => insertAtCursor('\n---\n')
    }
  ]

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await action(formData)
    } catch (error) {
      console.error('Failed to save post:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadComplete = (newFiles: AttachmentData[]) => {
    setAttachments(prev => [...prev, ...newFiles])
    // Insert markdown links for images
    const imageFiles = newFiles.filter(file => file.mimeType.startsWith('image/'))
    if (imageFiles.length > 0) {
      const imageMarkdown = imageFiles
        .map(file => `![${file.originalName}](${file.filePath})`)
        .join('\n')
      insertAtCursor('\n' + imageMarkdown + '\n')
    }
  }

  const handleAttachmentDeleted = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      <div className={`space-y-6 ${isFullscreen ? 'h-full p-6 overflow-auto' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {initialData?.id ? '编辑笔记' : '新建笔记'}
          </h1>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
              title="搜索 (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
              title="全屏模式"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索内容..."
                className="w-full px-3 py-1 text-sm border border-yellow-300 dark:border-yellow-700 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        <form action={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标题
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-800"
              placeholder="输入笔记标题..."
            />
          </div>

          {/* Tags Input */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-800"
              placeholder="标签1, 标签2, 标签3 (用逗号分隔)"
            />
          </div>

          {/* Editor Toolbar */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {/* History Controls */}
                  <button
                    type="button"
                    onClick={undo}
                    disabled={historyIndex === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                    title="撤销 (Ctrl+Z)"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                    title="重做 (Ctrl+Y)"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

                  {/* Formatting Tools */}
                  {editorActions.map((actionItem, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        type="button"
                        onClick={actionItem.action}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded"
                        title={`${actionItem.label}${actionItem.shortcut ? ` (${actionItem.shortcut})` : ''}`}
                      >
                        <actionItem.icon className="h-4 w-4" />
                      </button>
                      {actionItem.separator && (
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors px-2 py-1 rounded"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>附件 ({attachments.length})</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                  >
                    {isPreview ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>编辑</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>预览</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <AnimatePresence>
              {showAttachments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <FileUpload
                    onUploadComplete={handleUploadComplete}
                    postId={initialData?.id}
                    className="mb-4"
                  />
                  
                  {attachments.length > 0 && (
                    <AttachmentManager
                      attachments={attachments}
                      onAttachmentDeleted={handleAttachmentDeleted}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editor/Preview Area */}
            <div className="relative">
              {isPreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[400px] p-4 bg-white dark:bg-gray-900"
                >
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <MarkdownRenderer content={content} />
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
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      saveToHistory(e.target.value)
                    }}
                    onSelect={updateCursorPosition}
                    onKeyUp={updateCursorPosition}
                    onClick={updateCursorPosition}
                    required
                    rows={isFullscreen ? 30 : 20}
                    className="w-full border-0 px-4 py-3 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 font-mono resize-none focus:outline-none"
                    placeholder="在这里用 Markdown 格式编写你的笔记内容..."
                  />
                  
                  {/* Word Count */}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded">
                    {content.length} 字符 | {content.split(/\\s+/).filter(Boolean).length} 词
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Submit Area */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              支持 Markdown 语法，包括代码高亮、表格、链接等
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? '保存中...' : '保存笔记'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}