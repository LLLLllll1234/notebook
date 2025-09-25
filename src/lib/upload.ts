import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from './prisma'

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
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

  // Create subdirectories
  const subDirs = ['images', 'documents', 'temp']
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
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小超过限制（最大10MB）' }
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
  return `${timestamp}-${random}${ext}`
}

export function getUploadPath(fileName: string, mimeType: string): string {
  const subDir = ALLOWED_IMAGE_TYPES.includes(mimeType) ? 'images' : 'documents'
  return path.join(UPLOAD_DIR, subDir, fileName)
}

export function getPublicUrl(fileName: string, mimeType: string): string {
  const subDir = ALLOWED_IMAGE_TYPES.includes(mimeType) ? 'images' : 'documents'
  return `/uploads/${subDir}/${fileName}`
}

export async function saveFile(file: File, fileName: string, mimeType: string): Promise<string> {
  const filePath = getUploadPath(fileName, mimeType)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function deleteFile(fileName: string, mimeType: string): Promise<void> {
  const filePath = getUploadPath(fileName, mimeType)
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Failed to delete file:', error)
  }
}

export async function createAttachmentRecord(
  originalName: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  postId?: string
) {
  return await prisma.attachment.create({
    data: {
      originalName,
      fileName,
      filePath,
      fileSize,
      mimeType,
      postId
    }
  })
}