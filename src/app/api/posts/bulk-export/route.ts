import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BulkOperationRequest, BulkOperationResponse } from '@/lib/types'
import JSZip from 'jszip'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body: BulkOperationRequest = await request.json()
    const { postIds, data } = body

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供要导出的笔记ID列表'
      } as BulkOperationResponse, { status: 400 })
    }

    const { format = 'md', includeAttachments = true, includeMetadata = true } = data || {}

    // 获取要导出的笔记
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        isDeleted: false
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        attachments: includeAttachments
      }
    })

    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有找到有效的笔记'
      } as BulkOperationResponse, { status: 404 })
    }

    // 创建操作历史记录
    const operationHistory = await prisma.operationHistory.create({
      data: {
        operationType: 'bulk_export',
        targetIds: JSON.stringify(postIds),
        operationData: JSON.stringify({ format, includeAttachments, includeMetadata }),
        canUndo: false
      }
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let fileName: string
    let downloadUrl: string

    if (format === 'json') {
      // JSON 格式导出
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalPosts: posts.length,
          format: 'json'
        },
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          tags: post.tags.map(t => t.tag.name),
          ...(includeAttachments && {
            attachments: post.attachments?.map(att => ({
              originalName: att.originalName,
              fileName: att.fileName,
              filePath: att.filePath,
              fileSize: att.fileSize,
              mimeType: att.mimeType
            }))
          })
        }))
      }

      fileName = `notebook-export-${timestamp}.json`
      const filePath = join(process.cwd(), 'public', 'exports', fileName)
      
      // 确保导出目录存在
      await mkdir(join(process.cwd(), 'public', 'exports'), { recursive: true })
      
      await writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8')
      downloadUrl = `/exports/${fileName}`

    } else if (format === 'md' || format === 'zip') {
      // Markdown 格式导出（单个文件或ZIP包）
      const zip = new JSZip()
      
      for (const post of posts) {
        let content = post.content
        
        if (includeMetadata) {
          const metadata = [
            `---`,
            `title: ${post.title}`,
            `slug: ${post.slug}`,
            `created: ${post.createdAt.toISOString()}`,
            `updated: ${post.updatedAt.toISOString()}`,
            ...(post.tags.length > 0 ? [`tags: ${post.tags.map(t => t.tag.name).join(', ')}`] : []),
            `---`,
            ''
          ].join('\n')
          
          content = metadata + content
        }
        
        const safeFileName = post.slug || post.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
        zip.file(`${safeFileName}.md`, content)
      }

      if (format === 'zip' || posts.length > 1) {
        // 生成 ZIP 文件
        fileName = `notebook-export-${timestamp}.zip`
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
        const filePath = join(process.cwd(), 'public', 'exports', fileName)
        
        await mkdir(join(process.cwd(), 'public', 'exports'), { recursive: true })
        await writeFile(filePath, zipBuffer)
        downloadUrl = `/exports/${fileName}`
      } else {
        // 单个 Markdown 文件
        const post = posts[0]
        let content = post.content
        
        if (includeMetadata) {
          const metadata = [
            `---`,
            `title: ${post.title}`,
            `slug: ${post.slug}`,
            `created: ${post.createdAt.toISOString()}`,
            `updated: ${post.updatedAt.toISOString()}`,
            ...(post.tags.length > 0 ? [`tags: ${post.tags.map(t => t.tag.name).join(', ')}`] : []),
            `---`,
            ''
          ].join('\n')
          
          content = metadata + content
        }
        
        const safeFileName = post.slug || post.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
        fileName = `${safeFileName}.md`
        const filePath = join(process.cwd(), 'public', 'exports', fileName)
        
        await mkdir(join(process.cwd(), 'public', 'exports'), { recursive: true })
        await writeFile(filePath, content, 'utf-8')
        downloadUrl = `/exports/${fileName}`
      }
    } else {
      return NextResponse.json({
        success: false,
        error: '不支持的导出格式'
      } as BulkOperationResponse, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        affectedCount: posts.length,
        operationId: operationHistory.id,
        details: {
          downloadUrl,
          fileName,
          format,
          posts: posts.map(p => ({ id: p.id, title: p.title }))
        }
      }
    } as BulkOperationResponse)

  } catch (error) {
    console.error('批量导出失败:', error)
    return NextResponse.json({
      success: false,
      error: '导出失败，请稍后重试'
    } as BulkOperationResponse, { status: 500 })
  }
}
