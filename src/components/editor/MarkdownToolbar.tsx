'use client'

import { useState } from 'react'
import {
  Bold, Italic, Code, Link, Image, Table, List, ListOrdered,
  Quote, Heading1, Heading2, Heading3, Eye, EyeOff,
  ChevronDown, ChevronUp, Undo, Redo, Save, HelpCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToolbarAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  action: () => void
  separator?: boolean
}

interface MarkdownToolbarProps {
  onInsert: (text: string, cursorOffset?: number) => void
  onPreviewToggle: () => void
  isPreview: boolean
  onSave: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  className?: string
}

export function MarkdownToolbar({
  onInsert,
  onPreviewToggle,
  isPreview,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className = ''
}: MarkdownToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  // 基础格式化工具
  const formatActions: ToolbarAction[] = [
    {
      id: 'bold',
      icon: Bold,
      label: '加粗',
      shortcut: 'Ctrl+B',
      action: () => onInsert('**', 2)
    },
    {
      id: 'italic',
      icon: Italic,
      label: '斜体',
      shortcut: 'Ctrl+I',
      action: () => onInsert('*', 1)
    },
    {
      id: 'code',
      icon: Code,
      label: '行内代码',
      shortcut: 'Ctrl+`',
      action: () => onInsert('`', 1)
    },
    {
      id: 'separator1',
      icon: () => null,
      label: '',
      action: () => {},
      separator: true
    }
  ]

  // 标题工具
  const headingActions: ToolbarAction[] = [
    {
      id: 'h1',
      icon: Heading1,
      label: '一级标题',
      action: () => onInsert('# ', 0)
    },
    {
      id: 'h2',
      icon: Heading2,
      label: '二级标题',
      action: () => onInsert('## ', 0)
    },
    {
      id: 'h3',
      icon: Heading3,
      label: '三级标题',
      action: () => onInsert('### ', 0)
    },
    {
      id: 'separator2',
      icon: () => null,
      label: '',
      action: () => {},
      separator: true
    }
  ]

  // 列表和引用工具
  const listActions: ToolbarAction[] = [
    {
      id: 'ul',
      icon: List,
      label: '无序列表',
      action: () => onInsert('- ', 0)
    },
    {
      id: 'ol',
      icon: ListOrdered,
      label: '有序列表',
      action: () => onInsert('1. ', 0)
    },
    {
      id: 'quote',
      icon: Quote,
      label: '引用',
      action: () => onInsert('> ', 0)
    },
    {
      id: 'separator3',
      icon: () => null,
      label: '',
      action: () => {},
      separator: true
    }
  ]

  // 插入工具
  const insertActions: ToolbarAction[] = [
    {
      id: 'link',
      icon: Link,
      label: '链接',
      shortcut: 'Ctrl+K',
      action: () => setShowLinkDialog(true)
    },
    {
      id: 'image',
      icon: Image,
      label: '图片',
      action: () => onInsert('![图片描述](图片链接)', 12)
    },
    {
      id: 'table',
      icon: Table,
      label: '表格',
      shortcut: 'Ctrl+T',
      action: () => setShowTableDialog(true)
    }
  ]

  // 操作工具
  const actionTools: ToolbarAction[] = [
    {
      id: 'undo',
      icon: Undo,
      label: '撤销',
      shortcut: 'Ctrl+Z',
      action: onUndo
    },
    {
      id: 'redo',
      icon: Redo,
      label: '重做',
      shortcut: 'Ctrl+Y',
      action: onRedo
    },
    {
      id: 'save',
      icon: Save,
      label: '保存',
      shortcut: 'Ctrl+S',
      action: onSave
    },
    {
      id: 'preview',
      icon: isPreview ? EyeOff : Eye,
      label: isPreview ? '编辑模式' : '预览模式',
      shortcut: 'Ctrl+Shift+P',
      action: onPreviewToggle
    }
  ]

  const handleInsertTable = (rows: number, cols: number) => {
    const header = '| ' + Array(cols).fill('列标题').join(' | ') + ' |'
    const separator = '| ' + Array(cols).fill('---').join(' | ') + ' |'
    const bodyRows = Array(rows - 1).fill(0).map(() => 
      '| ' + Array(cols).fill('内容').join(' | ') + ' |'
    )
    
    const tableText = [header, separator, ...bodyRows].join('\n')
    onInsert('\n' + tableText + '\n', 0)
    setShowTableDialog(false)
  }

  const handleInsertLink = (text: string, url: string) => {
    if (text.trim() && url.trim()) {
      const linkText = `[${text}](${url})`
      onInsert(linkText, 0)
    }
    setShowLinkDialog(false)
  }

  const renderToolButton = (tool: ToolbarAction) => {
    if (tool.separator) {
      return (
        <div key={tool.id} className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1" />
      )
    }

    const Icon = tool.icon
    const isDisabled = (tool.id === 'undo' && !canUndo) || (tool.id === 'redo' && !canRedo)

    return (
      <button
        key={tool.id}
        type="button"
        onClick={tool.action}
        disabled={isDisabled}
        className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group relative ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={tool.label + (tool.shortcut ? ` (${tool.shortcut})` : '')}
      >
        <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {tool.label}
          {tool.shortcut && (
            <div className="text-zinc-400 dark:text-zinc-600">{tool.shortcut}</div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={`border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 ${className}`}>
      {/* 工具栏头部 */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            编辑工具
          </span>
          <HelpCircle className="h-4 w-4 text-zinc-400" />
        </div>
        
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          )}
        </button>
      </div>

      {/* 工具栏内容 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2"
          >
            {/* 格式化工具组 */}
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">格式化</span>
              {formatActions.map(renderToolButton)}
            </div>

            {/* 标题工具组 */}
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">标题</span>
              {headingActions.map(renderToolButton)}
            </div>

            {/* 列表工具组 */}
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">列表</span>
              {listActions.map(renderToolButton)}
            </div>

            {/* 插入工具组 */}
            <div className="flex items-center space-x-1 mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">插入</span>
              {insertActions.map(renderToolButton)}
            </div>

            {/* 操作工具组 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">操作</span>
                {actionTools.slice(0, 3).map(renderToolButton)}
              </div>
              
              <div className="flex items-center space-x-1">
                {renderToolButton(actionTools[3])}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 表格插入对话框 */}
      <AnimatePresence>
        {showTableDialog && (
          <TableInsertDialog
            onInsert={handleInsertTable}
            onClose={() => setShowTableDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* 链接插入对话框 */}
      <AnimatePresence>
        {showLinkDialog && (
          <LinkInsertDialog
            onInsert={handleInsertLink}
            onClose={() => setShowLinkDialog(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// 表格插入对话框组件
interface TableInsertDialogProps {
  onInsert: (rows: number, cols: number) => void
  onClose: () => void
}

function TableInsertDialog({ onInsert, onClose }: TableInsertDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-80 max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          插入表格
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              行数
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              列数
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 1)}
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-6">
          <button
            onClick={() => onInsert(rows, cols)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 px-4 transition-colors"
          >
            插入表格
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded py-2 px-4 transition-colors"
          >
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 链接插入对话框组件
interface LinkInsertDialogProps {
  onInsert: (text: string, url: string) => void
  onClose: () => void
}

function LinkInsertDialog({ onInsert, onClose }: LinkInsertDialogProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && url.trim()) {
      onInsert(text.trim(), url.trim())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-80 max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          插入链接
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              链接文字
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入链接显示的文字"
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              链接地址
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入链接地址"
              className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          
          <div className="flex items-center space-x-3 mt-6">
            <button
              type="submit"
              disabled={!text.trim() || !url.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded py-2 px-4 transition-colors"
            >
              插入链接
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded py-2 px-4 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}