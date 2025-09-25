'use client'

import React, { useEffect, useState, useRef } from 'react'
import { TOCItem } from '@/lib/types'
import { List, ChevronRight, ChevronDown, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import slugify from 'slugify'

interface FloatingTOCProps {
  content: string
  visible?: boolean
  position?: 'left' | 'right'
  onToggle?: () => void
}

interface TOCItemComponentProps {
  item: TOCItem
  depth: number
  isActive: boolean
  hasChildren: boolean
  onScrollToHeading: (anchor: string) => void
  renderTOCItem: (item: TOCItem, depth?: number) => React.ReactNode
}

// TOCItem 组件，使用独立的 hooks
function TOCItemComponent({ 
  item, 
  depth, 
  isActive, 
  hasChildren, 
  onScrollToHeading, 
  renderTOCItem 
}: TOCItemComponentProps) {
  const [expanded, setExpanded] = useState(true)
  
  // 计算缩进和样式
  const getIndentStyle = (level: number, depth: number) => {
    // 基于标题级别计算缩进，每级增加 16px
    const levelIndent = (level - 1) * 16
    // 嵌套深度额外缩进
    const depthIndent = depth * 8
    return {
      paddingLeft: `${levelIndent + depthIndent + 12}px`
    }
  }
  
  // 获取标题级别对应的样式
  const getLevelStyles = (level: number) => {
    switch (level) {
      case 1:
        return 'font-bold text-sm'
      case 2:
        return 'font-semibold text-sm'
      case 3:
        return 'font-medium text-sm'
      case 4:
        return 'font-normal text-xs'
      case 5:
        return 'font-normal text-xs opacity-90'
      case 6:
        return 'font-normal text-xs opacity-80'
      default:
        return 'font-normal text-sm'
    }
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1.5 px-1 cursor-pointer rounded transition-colors group relative ${
          isActive
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        style={getIndentStyle(item.level, depth)}
        onClick={() => onScrollToHeading(item.anchor)}
      >
        {/* 级别指示线 */}
        {item.level > 1 && (
          <div 
            className="absolute left-2 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-600"
            style={{ left: `${(item.level - 2) * 16 + 8}px` }}
          />
        )}
        
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="mr-2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {/* 级别标识符 */}
        <div className={`flex-shrink-0 mr-2 w-1 h-1 rounded-full ${
          item.level === 1 ? 'bg-blue-600' :
          item.level === 2 ? 'bg-green-500' :
          item.level === 3 ? 'bg-yellow-500' :
          item.level === 4 ? 'bg-orange-500' :
          item.level === 5 ? 'bg-red-500' :
          'bg-purple-500'
        }`} />
        
        <span 
          className={`flex-1 truncate ${getLevelStyles(item.level)}`}
          title={item.text}
        >
          {item.text}
        </span>
        
        {isActive && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
        )}
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {item.children.map(child => renderTOCItem(child, depth + 1))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FloatingTOC({ 
  content, 
  visible = true, 
  position = 'left',
  onToggle 
}: FloatingTOCProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredItems, setFilteredItems] = useState<TOCItem[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 解析 Markdown 内容生成目录
  useEffect(() => {
    const parseMarkdownHeadings = (markdown: string): TOCItem[] => {
      const lines = markdown.split('\n')
      const headings: TOCItem[] = []
      let position = 0

      lines.forEach((line, index) => {
        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
          const level = match[1].length
          let text = match[2].trim()
          
          // 清理标题前缀（如"一级标题："、"二级标题："等）
          text = text.replace(/^(一级标题|二级标题|三级标题|四级标题|五级标题|六级标题)：/, '')
          text = text.replace(/^(Level\s*\d+|H\d+)\s*[:：]\s*/, '')
          text = text.trim()
          
          // 确保 anchor 生成与 MarkdownRenderer 一致
          const anchor = slugify(text, { 
            lower: true, 
            strict: true,
            locale: 'zh'
          })
          
          console.log('Found heading:', { originalText: match[2], cleanedText: text, anchor, level }) // 调试信息

          headings.push({
            id: `heading-${index}`,
            text,
            level,
            anchor,
            children: [],
            position
          })
        }
        position += line.length + 1 // +1 for newline
      })

      // 构建层级结构
      const buildHierarchy = (items: TOCItem[]): TOCItem[] => {
        const result: TOCItem[] = []
        const stack: TOCItem[] = []

        items.forEach(item => {
          // 找到适当的父级
          while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
            stack.pop()
          }

          if (stack.length === 0) {
            result.push(item)
          } else {
            stack[stack.length - 1].children.push(item)
          }

          stack.push(item)
        })

        return result
      }

      return buildHierarchy(headings)
    }

    const items = parseMarkdownHeadings(content)
    console.log('Parsed TOC items:', items) // 调试信息
    setTocItems(items)
    setFilteredItems(items)
  }, [content])

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(tocItems)
      return
    }

    const filterItems = (items: TOCItem[]): TOCItem[] => {
      return items.reduce((acc: TOCItem[], item) => {
        const matchesQuery = item.text.toLowerCase().includes(searchQuery.toLowerCase())
        const filteredChildren = filterItems(item.children)

        if (matchesQuery || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren
          })
        }

        return acc
      }, [])
    }

    setFilteredItems(filterItems(tocItems))
  }, [searchQuery, tocItems])

  // 监听滚动位置
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
      let currentId = null

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 0) {
          currentId = heading.id
        }
      })

      setActiveId(currentId)
    }

    // 设置 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -80% 0px'
      }
    )

    // 观察所有标题元素
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
    headings.forEach((heading) => observer.observe(heading))

    observerRef.current = observer
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [tocItems])

  const scrollToHeading = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const renderTOCItem = (item: TOCItem, depth = 0) => {
    const isActive = activeId === item.anchor
    const hasChildren = item.children.length > 0

    return (
      <TOCItemComponent 
        key={item.id}
        item={item}
        depth={depth}
        isActive={isActive}
        hasChildren={hasChildren}
        onScrollToHeading={scrollToHeading}
        renderTOCItem={renderTOCItem}
      />
    )
  }

  // 添加更详细的调试信息
  console.log('FloatingTOC render state:', {
    visible,
    tocItemsLength: tocItems.length,
    contentLength: content.length,
    contentPreview: content.substring(0, 200)
  })

  if (!visible) {
    console.log('FloatingTOC hidden: visible=false')
    return null
  }

  if (tocItems.length === 0) {
    console.log('FloatingTOC hidden: no TOC items found')
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed top-20 ${position === 'left' ? 'left-4' : 'right-4'} z-50 w-64 max-h-[calc(100vh-6rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <List className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            目录
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            title={collapsed ? '展开' : '收起'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              title="关闭目录"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-hidden"
          >
            {/* 搜索框 */}
            {tocItems.length > 5 && (
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="搜索标题..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-zinc-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 目录列表 */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => renderTOCItem(item))
              ) : (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                  {searchQuery ? '未找到匹配的标题' : '暂无目录'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}