import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { prisma } from './prisma'
import { generateSlug } from './utils'

export interface ImportedPost {
  title: string
  content: string
  tags: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface ImportResult {
  success: boolean
  message: string
  itemCount: number
  createdPosts: string[]
  errors: string[]
}

export async function createImportRecord(
  type: 'import',
  format: string,
  fileName: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending',
  itemCount?: number,
  errorMessage?: string
) {
  return await prisma.importExportRecord.create({
    data: {
      type,
      format,
      fileName,
      status,
      itemCount,
      errorMessage
    }
  })
}

export async function updateImportRecord(
  id: string,
  data: {
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    itemCount?: number
    errorMessage?: string
  }
) {
  return await prisma.importExportRecord.update({
    where: { id },
    data
  })
}

export async function parseMarkdownFile(content: string, fileName: string): Promise<ImportedPost> {
  // Try to extract front matter
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontMatterRegex)
  
  let title: string
  let tags: string[] = []
  let actualContent: string
  let createdAt: Date | undefined
  let updatedAt: Date | undefined

  if (match) {
    // Parse front matter
    const frontMatter = match[1]
    actualContent = match[2].trim()
    
    const lines = frontMatter.split('\n')
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      
      if (key.trim() === 'title') {
        title = value.replace(/^[\"']|[\"']$/g, '') // Remove quotes
      } else if (key.trim() === 'tags') {
        // Parse tags array or comma-separated string
        if (value.startsWith('[') && value.endsWith(']')) {
          tags = JSON.parse(value)
        } else {
          tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      } else if (key.trim() === 'date' || key.trim() === 'created') {
        const dateValue = new Date(value)
        if (!isNaN(dateValue.getTime())) {
          createdAt = dateValue
        }
      } else if (key.trim() === 'updated') {
        const dateValue = new Date(value)
        if (!isNaN(dateValue.getTime())) {
          updatedAt = dateValue
        }
      }
    }
  } else {
    actualContent = content.trim()
  }

  // If no title found in front matter, try to extract from first heading
  if (!title) {
    const firstHeading = actualContent.match(/^#\s+(.+)$/m)
    if (firstHeading) {
      title = firstHeading[1].trim()
    } else {
      // Use filename as title
      title = path.basename(fileName, path.extname(fileName))
    }
  }

  return {
    title,
    content: actualContent,
    tags,
    createdAt,
    updatedAt
  }
}

export async function parseJSONFile(content: string): Promise<ImportedPost[]> {
  try {
    const data = JSON.parse(content)
    
    if (data.posts && Array.isArray(data.posts)) {
      return data.posts.map((post: any) => ({
        title: post.title || 'Untitled',
        content: post.content || '',
        tags: Array.isArray(post.tags) ? post.tags : [],
        createdAt: post.createdAt ? new Date(post.createdAt) : undefined,
        updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined
      }))
    } else if (Array.isArray(data)) {
      return data.map((post: any) => ({
        title: post.title || 'Untitled',
        content: post.content || '',
        tags: Array.isArray(post.tags) ? post.tags : [],
        createdAt: post.createdAt ? new Date(post.createdAt) : undefined,
        updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined
      }))
    } else if (data.title || data.content) {
      // Single post object
      return [{
        title: data.title || 'Untitled',
        content: data.content || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
      }]
    }
    
    throw new Error('无效的JSON格式')
  } catch (error) {
    throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export async function parseZipFile(buffer: Buffer): Promise<ImportedPost[]> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const posts: ImportedPost[] = []
    
    for (const [fileName, file] of Object.entries(zip.files)) {
      if (file.dir) continue
      
      const ext = path.extname(fileName).toLowerCase()
      if (!['.md', '.txt', '.json'].includes(ext)) continue
      
      const content = await file.async('text')
      
      if (ext === '.json') {
        const jsonPosts = await parseJSONFile(content)
        posts.push(...jsonPosts)
      } else {
        const post = await parseMarkdownFile(content, fileName)
        posts.push(post)
      }
    }
    
    return posts
  } catch (error) {
    throw new Error(`ZIP文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export async function createPostFromImported(
  importedPost: ImportedPost,
  conflictStrategy: 'skip' | 'overwrite' | 'rename' = 'rename'
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    // Generate slug
    let slug = generateSlug(importedPost.title)
    
    // Check for existing post
    const existingPost = await prisma.post.findUnique({
      where: { slug }
    })
    
    if (existingPost) {
      switch (conflictStrategy) {
        case 'skip':
          return { success: false, error: `笔记 "${importedPost.title}" 已存在，已跳过` }
        
        case 'overwrite':
          // Update existing post
          const updatedPost = await prisma.post.update({
            where: { slug },
            data: {
              title: importedPost.title,
              content: importedPost.content,
              updatedAt: importedPost.updatedAt || new Date(),
              tags: {
                deleteMany: {},
                create: await createOrGetTags(importedPost.tags)
              }
            }
          })
          return { success: true, slug: updatedPost.slug }
        
        case 'rename':
          // Generate unique slug
          slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
          break
      }
    }
    
    // Create tags
    const tagConnections = await createOrGetTags(importedPost.tags)
    
    // Create post
    const post = await prisma.post.create({
      data: {
        title: importedPost.title,
        slug,
        content: importedPost.content,
        createdAt: importedPost.createdAt || new Date(),
        updatedAt: importedPost.updatedAt || new Date(),
        tags: {
          create: tagConnections
        }
      }
    })
    
    return { success: true, slug: post.slug }
  } catch (error) {
    console.error('Create post error:', error)
    return { 
      success: false, 
      error: `创建笔记失败: ${error instanceof Error ? error.message : '未知错误'}` 
    }
  }
}

async function createOrGetTags(tagNames: string[]) {
  const tags = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
      return { tagId: tag.id }
    })
  )
  return tags
}

export async function importPosts(
  posts: ImportedPost[],
  conflictStrategy: 'skip' | 'overwrite' | 'rename' = 'rename'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    message: '',
    itemCount: posts.length,
    createdPosts: [],
    errors: []
  }
  
  for (const post of posts) {
    const createResult = await createPostFromImported(post, conflictStrategy)
    
    if (createResult.success && createResult.slug) {
      result.createdPosts.push(createResult.slug)
    } else {
      result.errors.push(createResult.error || '未知错误')
    }
  }
  
  const successCount = result.createdPosts.length
  const errorCount = result.errors.length
  
  if (successCount === 0 && errorCount > 0) {
    result.success = false
    result.message = `导入失败，所有 ${errorCount} 个项目都出现错误`
  } else if (errorCount > 0) {
    result.message = `部分导入成功：${successCount} 个成功，${errorCount} 个失败`
  } else {
    result.message = `导入成功：共导入 ${successCount} 个笔记`
  }
  
  return result
}