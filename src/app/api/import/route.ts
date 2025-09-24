import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  createImportRecord,
  updateImportRecord,
  parseMarkdownFile,
  parseJSONFile,
  parseZipFile,
  importPosts
} from '@/lib/import'

export async function POST(request: NextRequest) {
  let importRecord: any = null
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conflictStrategy = (formData.get('conflictStrategy') as string) || 'rename'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/markdown',
      'text/plain',
      'application/json',
      'application/zip'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型。支持: .md, .txt, .json, .zip' },
        { status: 400 }
      )
    }

    // Create import record
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const format = fileExt === 'md' ? 'md' : fileExt
    
    importRecord = await createImportRecord(
      'import',
      format,
      file.name,
      'processing'
    )

    // Parse file based on type
    const buffer = Buffer.from(await file.arrayBuffer())
    const content = buffer.toString('utf-8')
    
    let posts: any[] = []
    
    try {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        posts = await parseZipFile(buffer)
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        posts = await parseJSONFile(content)
      } else {
        // Markdown or text file
        const post = await parseMarkdownFile(content, file.name)
        posts = [post]
      }
    } catch (parseError) {
      await updateImportRecord(importRecord.id, {
        status: 'failed',
        errorMessage: parseError instanceof Error ? parseError.message : '文件解析失败'
      })
      
      return NextResponse.json(
        { success: false, error: parseError instanceof Error ? parseError.message : '文件解析失败' },
        { status: 400 }
      )
    }

    if (posts.length === 0) {
      await updateImportRecord(importRecord.id, {
        status: 'failed',
        errorMessage: '文件中没有找到有效的笔记内容'
      })
      
      return NextResponse.json(
        { success: false, error: '文件中没有找到有效的笔记内容' },
        { status: 400 }
      )
    }

    // Import posts
    const importResult = await importPosts(posts, conflictStrategy as any)
    
    // Update import record
    await updateImportRecord(importRecord.id, {
      status: importResult.success ? 'completed' : 'failed',
      itemCount: importResult.itemCount,
      errorMessage: importResult.success ? undefined : importResult.errors.join('; ')
    })

    return NextResponse.json({
      success: importResult.success,
      data: {
        recordId: importRecord.id,
        itemCount: importResult.itemCount,
        createdPosts: importResult.createdPosts,
        message: importResult.message,
        errors: importResult.errors
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    
    if (importRecord) {
      await updateImportRecord(importRecord.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '导入过程中发生未知错误'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '导入失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (recordId) {
      // Get specific import record
      const record = await prisma.importExportRecord.findUnique({
        where: { id: recordId }
      })

      if (!record) {
        return NextResponse.json(
          { success: false, error: '导入记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: record
      })
    } else {
      // Get all import records
      const records = await prisma.importExportRecord.findMany({
        where: { type: 'import' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return NextResponse.json({
        success: true,
        data: records
      })
    }

  } catch (error) {
    console.error('Get import records error:', error)
    return NextResponse.json(
      { success: false, error: '获取导入记录失败' },
      { status: 500 }
    )
  }
}