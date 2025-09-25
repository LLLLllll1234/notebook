import { promises as fs } from 'fs'
import path from 'path'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
import { prisma } from './prisma'
import { PostWithTags } from './types'

export interface ExportOptions {
  format: 'md' | 'json' | 'pdf' | 'zip'
  posts?: string[] // Post IDs to export
  includeAttachments?: boolean
  tagFilter?: string
  dateRange?: {
    from?: Date
    to?: Date
  }
}

export interface ExportResult {
  success: boolean
  fileName: string
  filePath: string
  itemCount: number
  message: string
  error?: string
}

const EXPORT_DIR = path.join(process.cwd(), 'public', 'exports')

export async function ensureExportDir() {
  try {
    await fs.access(EXPORT_DIR)
  } catch {
    await fs.mkdir(EXPORT_DIR, { recursive: true })
  }
}

export async function createExportRecord(
  type: 'export',
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

export async function updateExportRecord(
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

export async function getPostsForExport(options: ExportOptions): Promise<PostWithTags[]> {
  const where: any = {}

  // Filter by specific post IDs
  if (options.posts && options.posts.length > 0) {
    where.id = { in: options.posts }
  }

  // Filter by tag
  if (options.tagFilter) {
    where.tags = {
      some: {
        tag: {
          name: {
            contains: options.tagFilter,
            mode: 'insensitive'
          }
        }
      }
    }
  }

  // Filter by date range
  if (options.dateRange) {
    where.createdAt = {}
    if (options.dateRange.from) {
      where.createdAt.gte = options.dateRange.from
    }
    if (options.dateRange.to) {
      where.createdAt.lte = options.dateRange.to
    }
  }

  return await prisma.post.findMany({
    where,
    include: {
      tags: {
        include: {
          tag: true,
          post: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export function generateMarkdown(post: PostWithTags): string {
  const tags = post.tags.map(t => t.tag.name)
  const frontMatter = [
    '---',
    `title: "${post.title}"`,
    `slug: "${post.slug}"`,
    `tags: [${tags.map(tag => `"${tag}"`).join(', ')}]`,
    `created: "${post.createdAt.toISOString()}"`,
    `updated: "${post.updatedAt.toISOString()}"`,
    '---',
    ''
  ].join('\n')

  return frontMatter + post.content
}

export function generateJSON(posts: PostWithTags[]): string {
  const exportData = {
    exportInfo: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      itemCount: posts.length
    },
    posts: posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      tags: post.tags.map(t => t.tag.name),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }))
  }

  return JSON.stringify(exportData, null, 2)
}

export async function generatePDF(posts: PostWithTags[]): Promise<Buffer> {
  const pdf = new jsPDF()
  let yPosition = 20

  // Add title page
  pdf.setFontSize(20)
  pdf.text('笔记导出', 20, yPosition)
  
  pdf.setFontSize(12)
  yPosition += 20
  pdf.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 20, yPosition)
  yPosition += 10
  pdf.text(`笔记数量: ${posts.length}`, 20, yPosition)
  
  // Add posts
  for (const post of posts) {
    // Add new page for each post
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    // Title
    pdf.setFontSize(16)
    pdf.text(post.title, 20, yPosition)
    yPosition += 15

    // Tags
    if (post.tags.length > 0) {
      pdf.setFontSize(10)
      const tagText = `标签: ${post.tags.map(t => t.tag.name).join(', ')}`
      pdf.text(tagText, 20, yPosition)
      yPosition += 10
    }

    // Date
    pdf.setFontSize(8)
    pdf.text(`创建: ${post.createdAt.toLocaleDateString('zh-CN')}`, 20, yPosition)
    yPosition += 10

    // Content (simplified - just first few lines)
    pdf.setFontSize(10)
    const contentLines = post.content.split('\n').slice(0, 20) // First 20 lines
    for (const line of contentLines) {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      // Handle long lines by wrapping
      const wrappedLines = pdf.splitTextToSize(line, 170)
      for (const wrappedLine of wrappedLines) {
        pdf.text(wrappedLine, 20, yPosition)
        yPosition += 5
      }
    }

    yPosition += 15 // Space before next post
  }

  return Buffer.from(pdf.output('arraybuffer'))
}

export async function generateZip(posts: PostWithTags[], includeAttachments = false): Promise<Buffer> {
  const zip = new JSZip()

  // Add posts folder
  const postsFolder = zip.folder('posts')
  if (postsFolder) {
    for (const post of posts) {
      const markdown = generateMarkdown(post)
      const fileName = `${post.slug}.md`
      postsFolder.file(fileName, markdown)
    }
  }

  // Add JSON export
  const jsonData = generateJSON(posts)
  zip.file('data.json', jsonData)

  // Add attachments if requested
  if (includeAttachments) {
    const attachmentsFolder = zip.folder('attachments')
    if (attachmentsFolder) {
      // Get all attachments for the posts
      const postIds = posts.map(p => p.id)
      const attachments = await prisma.attachment.findMany({
        where: {
          postId: { in: postIds }
        }
      })

      for (const attachment of attachments) {
        try {
          const fileBuffer = await fs.readFile(attachment.filePath)
          const relativePath = `${attachment.postId}/${attachment.fileName}`
          attachmentsFolder.file(relativePath, fileBuffer)
        } catch (error) {
          console.error(`Failed to add attachment ${attachment.fileName}:`, error)
        }
      }
    }
  }

  // Add README
  const readme = [
    '# 笔记导出',
    '',
    `导出时间: ${new Date().toLocaleString('zh-CN')}`,
    `笔记数量: ${posts.length}`,
    '',
    '## 文件结构',
    '- `posts/` - Markdown格式的笔记文件',
    '- `data.json` - JSON格式的完整数据',
    includeAttachments ? '- `attachments/` - 笔记附件文件' : '',
    '',
    '## 导入说明',
    '可以使用导入功能重新导入这些文件到其他笔记系统中。',
    ''
  ].filter(Boolean).join('\n')

  zip.file('README.md', readme)

  return Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
}

export async function exportPosts(options: ExportOptions): Promise<ExportResult> {
  try {
    await ensureExportDir()

    // Get posts to export
    const posts = await getPostsForExport(options)
    
    if (posts.length === 0) {
      return {
        success: false,
        fileName: '',
        filePath: '',
        itemCount: 0,
        message: '没有找到符合条件的笔记',
        error: '没有找到符合条件的笔记'
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const fileName = `notebook-export-${timestamp}.${options.format}`
    const filePath = path.join(EXPORT_DIR, fileName)

    let buffer: Buffer

    // Generate export file based on format
    switch (options.format) {
      case 'md':
        if (posts.length === 1) {
          const markdown = generateMarkdown(posts[0])
          buffer = Buffer.from(markdown, 'utf-8')
        } else {
          // Multiple posts as zip
          buffer = await generateZip(posts, options.includeAttachments)
        }
        break

      case 'json':
        const jsonData = generateJSON(posts)
        buffer = Buffer.from(jsonData, 'utf-8')
        break

      case 'pdf':
        buffer = await generatePDF(posts)
        break

      case 'zip':
        buffer = await generateZip(posts, options.includeAttachments)
        break

      default:
        throw new Error(`不支持的导出格式: ${options.format}`)
    }

    // Write file
    await fs.writeFile(filePath, buffer)

    return {
      success: true,
      fileName,
      filePath: `/exports/${fileName}`,
      itemCount: posts.length,
      message: `成功导出 ${posts.length} 个笔记`
    }

  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      fileName: '',
      filePath: '',
      itemCount: 0,
      message: '导出失败',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

export async function cleanupOldExports(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  try {
    const files = await fs.readdir(EXPORT_DIR)
    const now = Date.now()

    for (const file of files) {
      const filePath = path.join(EXPORT_DIR, file)
      const stats = await fs.stat(filePath)
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath)
        console.log(`Cleaned up old export file: ${file}`)
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}