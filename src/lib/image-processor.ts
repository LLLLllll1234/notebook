import sharp from 'sharp'
import path from 'path'
import { promises as fs } from 'fs'

export interface ImageProcessOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
  generateThumbnail?: boolean
  thumbnailSize?: number
}

export interface ProcessedImage {
  originalPath: string
  compressedPath?: string
  thumbnailPath?: string
  originalSize: number
  compressedSize?: number
  thumbnailSize?: number
  format: string
  dimensions: {
    width: number
    height: number
  }
}

export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: Required<ImageProcessOptions> = {
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'webp',
    generateThumbnail: true,
    thumbnailSize: 300
  }

  /**
   * 处理图片：压缩、格式转换、生成缩略图
   */
  static async processImage(
    inputBuffer: Buffer,
    fileName: string,
    outputDir: string,
    options: Partial<ImageProcessOptions> = {}
  ): Promise<ProcessedImage> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true })

    // 获取图片信息
    const image = sharp(inputBuffer)
    const metadata = await image.metadata()
    
    if (!metadata.width || !metadata.height) {
      throw new Error('无法获取图片尺寸信息')
    }

    const baseName = path.parse(fileName).name
    const result: ProcessedImage = {
      originalPath: '',
      originalSize: inputBuffer.length,
      format: opts.format,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      }
    }

    // 计算压缩尺寸
    const { width: resizeWidth, height: resizeHeight } = this.calculateResizedimensions(
      metadata.width,
      metadata.height,
      opts.maxWidth,
      opts.maxHeight
    )

    // 生成压缩图片
    const compressedFileName = `${baseName}.${opts.format}`
    const compressedPath = path.join(outputDir, compressedFileName)
    
    let compressedImage = image.resize(resizeWidth, resizeHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })

    // 根据格式设置压缩选项
    switch (opts.format) {
      case 'jpeg':
        compressedImage = compressedImage.jpeg({ quality: opts.quality })
        break
      case 'png':
        compressedImage = compressedImage.png({ 
          quality: opts.quality,
          compressionLevel: 9
        })
        break
      case 'webp':
        compressedImage = compressedImage.webp({ quality: opts.quality })
        break
    }

    const compressedBuffer = await compressedImage.toBuffer()
    await fs.writeFile(compressedPath, compressedBuffer)
    
    result.compressedPath = compressedPath
    result.compressedSize = compressedBuffer.length

    // 生成缩略图
    if (opts.generateThumbnail) {
      const thumbnailFileName = `${baseName}_thumb.${opts.format}`
      const thumbnailPath = path.join(outputDir, thumbnailFileName)
      
      const thumbnailBuffer = await sharp(inputBuffer)
        .resize(opts.thumbnailSize, opts.thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer()
      
      await fs.writeFile(thumbnailPath, thumbnailBuffer)
      result.thumbnailPath = thumbnailPath
      result.thumbnailSize = thumbnailBuffer.length
    }

    return result
  }

  /**
   * 批量处理图片
   */
  static async processBatch(
    images: Array<{ buffer: Buffer; fileName: string }>,
    outputDir: string,
    options: Partial<ImageProcessOptions> = {}
  ): Promise<ProcessedImage[]> {
    const results = await Promise.allSettled(
      images.map(({ buffer, fileName }) => 
        this.processImage(buffer, fileName, outputDir, options)
      )
    )

    const processed: ProcessedImage[] = []
    const errors: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processed.push(result.value)
      } else {
        errors.push(`处理 ${images[index].fileName} 失败: ${result.reason.message}`)
      }
    })

    if (errors.length > 0) {
      console.warn('批量处理中的错误:', errors)
    }

    return processed
  }

  /**
   * 计算压缩后的尺寸
   */
  private static calculateResizedimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight }
    }

    const widthRatio = maxWidth / originalWidth
    const heightRatio = maxHeight / originalHeight
    const ratio = Math.min(widthRatio, heightRatio)

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    }
  }

  /**
   * 获取图片信息
   */
  static async getImageInfo(buffer: Buffer): Promise<{
    width: number
    height: number
    format: string
    size: number
  }> {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length
    }
  }

  /**
   * 检查是否为图片文件
   */
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * 获取推荐的输出格式
   */
  static getRecommendedFormat(inputFormat: string, hasTransparency: boolean = false): 'jpeg' | 'png' | 'webp' {
    // 如果有透明度，使用PNG或WebP
    if (hasTransparency) {
      return 'webp' // WebP 支持透明度且压缩率更好
    }
    
    // 对于照片类图片，使用WebP
    if (inputFormat === 'jpeg' || inputFormat === 'jpg') {
      return 'webp'
    }
    
    // 默认使用WebP
    return 'webp'
  }
}

/**
 * 计算压缩比例
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}