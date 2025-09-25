// Prisma 生成的类型
export type Post = {
  id: string
  title: string
  slug: string
  content: string
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type Tag = {
  id: string
  name: string
}

export type TagOnPost = {
  postId: string
  tagId: string
  post: Post
  tag: Tag
}

export type Attachment = {
  id: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  postId: string | null
  uploadedAt: Date
  thumbnailPath?: string | null
  thumbnailFileName?: string | null
  compressedSize?: number | null
  dimensions?: string | null
  post?: Post | null
}

export type ImportExportRecord = {
  id: string
  type: string
  format: string
  fileName: string
  status: string
  itemCount: number | null
  errorMessage: string | null
  createdAt: Date
}

export type UserPreferences = {
  id: string
  userId: string | null
  editorMode: string
  toolbarLayout: string | null
  shortcuts: string | null
  autoSave: boolean
  tocVisible: boolean
  tocPosition: string
  createdAt: Date
  updatedAt: Date
}

export type OperationHistory = {
  id: string
  operationType: string
  targetIds: string
  operationData: string | null
  canUndo: boolean
  undoExpiry: Date | null
  isUndone: boolean
  createdAt: Date
}

export type DraftSave = {
  id: string
  postId: string | null
  title: string
  content: string
  tags: string | null
  savedAt: Date
  expiresAt: Date | null
}

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
  thumbnailPath?: string
  thumbnailFileName?: string
  compressedSize?: number
  dimensions?: {
    width: number
    height: number
  }
  compressionRatio?: number
  isDuplicate?: boolean
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
    recordId: string
    downloadUrl: string
    fileName: string
    itemCount: number
    message: string
  }
  error?: string
}

// 批量操作相关类型
export type BulkOperationType = 'delete' | 'tag' | 'export'
export type BulkTagActionType = 'add' | 'remove' | 'replace'

export type BulkOperationRequest = {
  postIds: string[]
  action: BulkOperationType
  data?: {
    action?: BulkTagActionType
    tagNames?: string[]
    oldTagName?: string
    newTagName?: string
    format?: string
    includeAttachments?: boolean
    includeMetadata?: boolean
    [key: string]: any
  }
}

export type BulkOperationResponse = {
  success: boolean
  data?: {
    affectedCount: number
    operationId?: string
    details?: any
  }
  error?: string
}

// 编辑器相关类型
export type EditorMode = 'edit' | 'preview' | 'split'

export type TOCItem = {
  id: string
  text: string
  level: number
  anchor: string
  children: TOCItem[]
  position: number
}

export type ToolbarConfig = {
  visible: boolean
  position: 'top' | 'bottom'
  tools: string[]
}

export type EditorPreferences = {
  mode: EditorMode
  autoSave: boolean
  toolbarConfig: ToolbarConfig
  shortcuts: Record<string, string>
  tocVisible: boolean
  tocPosition: 'left' | 'right'
}

// 操作历史相关类型
export type OperationHistoryData = OperationHistory & {
  targetIds: string[]
  operationData?: any
}

// 草稿保存相关类型
export type DraftData = {
  id?: string
  postId?: string
  title: string
  content: string
  tags?: string
  savedAt: Date
  expiresAt?: Date
}

// 表格创建相关类型
export type TableConfig = {
  rows: number
  cols: number
  headers: boolean
  style: 'simple' | 'grid' | 'striped'
}

export type TableData = {
  headers: string[]
  rows: string[][]
}

