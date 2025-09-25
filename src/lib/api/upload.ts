import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '../prisma'
import { ImageProcessor, ProcessedImage } from '../image-processor'
import crypto from 'crypto'

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for images
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/zip'
]

export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Create subdirectories with date-based structure
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  
  const subDirs = [
    'images',
    'documents', 
    'thumbnails',
    'temp',
    `images/${year}`,
    `images/${year}/${month}`,
    `documents/${year}`,
    `documents/${year}/${month}`,
    `thumbnails/${year}`,
    `thumbnails/${year}/${month}`
  ]
  
  for (const subDir of subDirs) {
    const dirPath = path.join(UPLOAD_DIR, subDir)
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }
}

export function validateFile(file: File) {
  // Check file size
  const maxSize = ALLOWED_IMAGE_TYPES.includes(file.type) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  if (file.size > maxSize) {
    const sizeName = ALLOWED_IMAGE_TYPES.includes(file.type) ? '5MB' : '10MB'
    return { valid: false, error: `文件大小超过限制（最大${sizeName}）` }
  }

  // Check file type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
  
  // Special handling for markdown files
  if (file.name.toLowerCase().endsWith('.md')) {
    return { valid: true }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `不支持的文件类型: ${file.type}` }
  }

  return { valid: true }
}

export function generateFileName(originalName: string, mimeType: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = path.extname(originalName)
  
  // Generate hash for duplicate detection
  const hash = crypto.createHash('md5')
    .update(`${originalName}-${timestamp}-${random}`)
    .digest('hex')
    .substring(0, 8)
  
  return `${timestamp}-${hash}${ext}`
}

export function getUploadPath(fileName: string, mimeType: string): string {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  
  const subDir = ALLOWED_IMAGE_TYPES.includes(mimeType) ? 'images' : 'documents'
  return path.join(UPLOAD_DIR, subDir, year, month, fileName)
}

export function getThumbnailPath(fileName: string): string {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  
  return path.join(UPLOAD_DIR, 'thumbnails', year, month, fileName)
}

export function getPublicUrl(fileName: string, mimeType: string): string {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  
  const subDir = ALLOWED_IMAGE_TYPES.includes(mimeType) ? 'images' : 'documents'
  return `/uploads/${subDir}/${year}/${month}/${fileName}`
}

export function getThumbnailUrl(fileName: string): string {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  
  return `/uploads/thumbnails/${year}/${month}/${fileName}`
}

export async function saveFile(file: File, fileName: string, mimeType: string): Promise<string> {
  const filePath = getUploadPath(fileName, mimeType)
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)
  return filePath
}

/**
 * Enhanced file saving with image processing
 */
export async function saveFileWithProcessing(
  file: File, 
  fileName: string, 
  mimeType: string
): Promise<{
  filePath: string
  thumbnailPath?: string
  processedInfo?: ProcessedImage
}> {
  const filePath = getUploadPath(fileName, mimeType)
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Check if it's an image and process it
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    try {
      // Process image with compression and thumbnail generation
      const outputDir = path.dirname(filePath)
      const thumbnailDir = path.dirname(getThumbnailPath(fileName))
      
      await fs.mkdir(thumbnailDir, { recursive: true })
      
      const processedInfo = await ImageProcessor.processImage(
        buffer,
        fileName,
        outputDir,
        {
          quality: 85,
          maxWidth: 1920,
          maxHeight: 1080,
          format: 'webp',
          generateThumbnail: true,
          thumbnailSize: 300
        }
      )
      
      // Move thumbnail to correct location
      if (processedInfo.thumbnailPath) {
        const thumbnailFileName = path.basename(processedInfo.thumbnailPath)
        const finalThumbnailPath = getThumbnailPath(thumbnailFileName)
        await fs.rename(processedInfo.thumbnailPath, finalThumbnailPath)
        processedInfo.thumbnailPath = finalThumbnailPath
      }
      
      return {
        filePath: processedInfo.compressedPath || filePath,
        thumbnailPath: processedInfo.thumbnailPath,
        processedInfo
      }
    } catch (error) {
      console.error('Image processing failed, using original:', error)
      // Fallback to original file
      await fs.writeFile(filePath, buffer)
      return { filePath }
    }
  } else {
    // Non-image files: save as-is
    await fs.writeFile(filePath, buffer)
    return { filePath }
  }
}

export async function deleteFile(fileName: string, mimeType: string, thumbnailFileName?: string): Promise<void> {
  // Delete main file
  const filePath = getUploadPath(fileName, mimeType)
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Failed to delete main file:', error)
  }
  
  // Delete thumbnail if exists
  if (thumbnailFileName) {
    const thumbnailPath = getThumbnailPath(thumbnailFileName)
    try {
      await fs.unlink(thumbnailPath)
    } catch (error) {
      console.error('Failed to delete thumbnail:', error)
    }
  }
}

export async function createAttachmentRecord(
  originalName: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  postId?: string,
  thumbnailPath?: string,
  thumbnailFileName?: string
) {
  return await prisma.attachment.create({
    data: {
      originalName,
      fileName,
      filePath,
      fileSize,
      mimeType,
      postId,
      thumbnailPath,
      thumbnailFileName
    }
  })
}

/**
 * Check for duplicate files based on content hash
 */
export async function findDuplicateFile(
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<any | null> {
  // Simple duplicate detection based on name, size, and type
  return await prisma.attachment.findFirst({
    where: {
      originalName: fileName,
      fileSize,
      mimeType
    }
  })
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number
  totalSize: number
  imageFiles: number
  documentFiles: number
  imageSize: number
  documentSize: number
}> {
  const stats = await prisma.attachment.aggregate({
    _count: { id: true },
    _sum: { fileSize: true }
  })
  
  const imageStats = await prisma.attachment.aggregate({
    where: {
      mimeType: {
        in: ALLOWED_IMAGE_TYPES
      }
    },
    _count: { id: true },
    _sum: { fileSize: true }
  })
  
  const documentStats = await prisma.attachment.aggregate({
    where: {
      mimeType: {
        in: ALLOWED_DOCUMENT_TYPES
      }
    },
    _count: { id: true },
    _sum: { fileSize: true }
  })
  
  return {
    totalFiles: stats._count.id || 0,
    totalSize: stats._sum.fileSize || 0,
    imageFiles: imageStats._count.id || 0,
    documentFiles: documentStats._count.id || 0,
    imageSize: imageStats._sum.fileSize || 0,
    documentSize: documentStats._sum.fileSize || 0
  }
}