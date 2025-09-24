import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  createExportRecord,
  updateExportRecord,
  exportPosts,
  cleanupOldExports,
  ExportOptions
} from '@/lib/export'

export async function POST(request: NextRequest) {
  let exportRecord: any = null
  
  try {
    const body = await request.json()
    const { 
      format = 'json',
      posts = [],
      includeAttachments = false,
      tagFilter,
      dateRange
    } = body as ExportOptions

    // Validate format
    if (!['md', 'json', 'pdf', 'zip'].includes(format)) {
      return NextResponse.json(
        { success: false, error: '不支持的导出格式' },
        { status: 400 }
      )
    }

    // Create export record
    const fileName = `notebook-export-${Date.now()}.${format}`
    exportRecord = await createExportRecord(
      'export',
      format,
      fileName,
      'processing'
    )

    // Clean up old exports
    cleanupOldExports().catch(console.error)

    // Prepare export options
    const exportOptions: ExportOptions = {
      format,
      posts: posts.length > 0 ? posts : undefined,
      includeAttachments,
      tagFilter,
      dateRange: dateRange ? {
        from: dateRange.from ? new Date(dateRange.from) : undefined,
        to: dateRange.to ? new Date(dateRange.to) : undefined
      } : undefined
    }

    // Export posts
    const result = await exportPosts(exportOptions)
    
    // Update export record
    await updateExportRecord(exportRecord.id, {
      status: result.success ? 'completed' : 'failed',
      itemCount: result.itemCount,
      errorMessage: result.success ? undefined : result.error
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        recordId: exportRecord.id,
        downloadUrl: result.filePath,
        fileName: result.fileName,
        itemCount: result.itemCount,
        message: result.message
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    
    if (exportRecord) {
      await updateExportRecord(exportRecord.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '导出过程中发生未知错误'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (recordId) {
      // Get specific export record
      const record = await prisma.importExportRecord.findUnique({
        where: { id: recordId }
      })

      if (!record) {
        return NextResponse.json(
          { success: false, error: '导出记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: record
      })
    } else {
      // Get all export records
      const records = await prisma.importExportRecord.findMany({
        where: { type: 'export' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return NextResponse.json({
        success: true,
        data: records
      })
    }

  } catch (error) {
    console.error('Get export records error:', error)
    return NextResponse.json(
      { success: false, error: '获取导出记录失败' },
      { status: 500 }
    )
  }
}