import { Post, Tag, TagOnPost, Attachment, ImportExportRecord } from '@prisma/client'

export type PostWithTags = Post & {
  tags: (TagOnPost & {
    tag: Tag
  })[]
}

export type PostWithTagsAndAttachments = Post & {
  tags: (TagOnPost & {
    tag: Tag
  })[]
  attachments: Attachment[]
}

export type PostFormData = {
  title: string
  content: string
  tags: string
}

export type AttachmentData = {
  id: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
}

export type ImportExportData = {
  id: string
  type: 'import' | 'export'
  format: 'md' | 'json' | 'zip' | 'pdf'
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  itemCount?: number
  errorMessage?: string
  createdAt: Date
}

export type UploadResponse = {
  success: boolean
  data?: AttachmentData
  error?: string
}

export type ImportResponse = {
  success: boolean
  data?: {
    recordId: string
    itemCount: number
    createdPosts: string[]
  }
  error?: string
}

export type ExportResponse = {
  success: boolean
  data?: {
    downloadUrl: string
    fileName: string
  }
  error?: string
}