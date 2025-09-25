import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Maximize2,
  Minimize2,
  Copy,
  Link,
  Info
} from 'lucide-react'
import { AttachmentData } from '@/lib/types/types'
import toast from 'react-hot-toast'

interface ImagePreviewProps {
  image: AttachmentData
  isOpen: boolean
  onClose: () => void
  showEditTools?: boolean
}

export function ImagePreview({ 
  image, 
  isOpen, 
  onClose, 
  showEditTools = true 
}: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Reset transformations when opening
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setIsFullscreen(false)
      setShowInfo(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case 'r':
          handleRotateRight()
          break
        case 'R':
          handleRotateLeft()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'i':
          setShowInfo(!showInfo)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showInfo])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90)
  }

  const handleRotateRight = () => {
    setRotation(prev => prev + 90)
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.01
    const newZoom = Math.min(Math.max(zoom * (1 + delta), 0.1), 5)
    setZoom(newZoom)
  }

  const copyImageUrl = () => {
    navigator.clipboard.writeText(image.filePath)
    toast.success('图片链接已复制到剪贴板')
  }

  const copyMarkdownLink = () => {
    const markdown = `![${image.originalName}](${image.filePath})`
    navigator.clipboard.writeText(markdown)
    toast.success('Markdown链接已复制到剪贴板')
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = image.filePath
    link.download = image.originalName
    link.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center ${
          isFullscreen ? '' : 'p-4'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">
              <span className="text-sm">{image.originalName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            >
              <Info className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        {showEditTools && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center space-x-2 bg-black bg-opacity-50 p-3 rounded-lg">
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="缩小 (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-white text-sm px-2 min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="放大 (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-white bg-opacity-30" />
              
              <button
                onClick={handleRotateLeft}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="左转 (Shift+R)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleRotateRight}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="右转 (R)"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-white bg-opacity-30" />
              
              <button
                onClick={copyImageUrl}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="复制图片链接"
              >
                <Link className="h-4 w-4" />
              </button>
              
              <button
                onClick={copyMarkdownLink}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="复制Markdown链接"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={downloadImage}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-all"
                title="下载图片"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Image Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-16 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-sm z-10"
            >
              <h3 className="font-semibold mb-3">图片信息</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-300">文件名:</span>
                  <p className="break-all">{image.originalName}</p>
                </div>
                <div>
                  <span className="text-gray-300">大小:</span>
                  <span className="ml-2">{formatFileSize(image.fileSize)}</span>
                </div>
                {image.compressedSize && (
                  <div>
                    <span className="text-gray-300">压缩后:</span>
                    <span className="ml-2 text-green-400">
                      {formatFileSize(image.compressedSize)}
                      ({Math.round(((image.fileSize - image.compressedSize) / image.fileSize) * 100)}% 压缩)
                    </span>
                  </div>
                )}
                {image.dimensions && (
                  <div>
                    <span className="text-gray-300">尺寸:</span>
                    <span className="ml-2">
                      {image.dimensions.width} × {image.dimensions.height}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-300">格式:</span>
                  <span className="ml-2">{image.mimeType}</span>
                </div>
                <div>
                  <span className="text-gray-300">上传时间:</span>
                  <span className="ml-2">{formatDate(image.uploadedAt)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <motion.img
            ref={imageRef}
            src={image.filePath}
            alt={image.originalName}
            className="max-w-none select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            draggable={false}
          />
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          <div>快捷键: Esc 关闭 | +/- 缩放 | R 旋转 | F 全屏 | I 信息</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}