import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  ensureUploadDir, 
  validateFile, 
  generateFileName, 
  saveFile, 
  getPublicUrl, 
  createAttachmentRecord,
  deleteFile
} from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Generate file name and save file
    const fileName = generateFileName(file.name, file.type)
    const filePath = await saveFile(file, fileName, file.type)

    // Create attachment record
    const attachment = await createAttachmentRecord(
      file.name,
      fileName,
      filePath,
      file.size,
      file.type,
      postId || undefined
    )

    // Return file URL
    const publicUrl = getPublicUrl(fileName, file.type)
    
    return NextResponse.json({
      success: true,
      data: {
        id: attachment.id,
        originalName: attachment.originalName,
        fileName: attachment.fileName,
        filePath: publicUrl,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('id')

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: '缺少附件ID' },
        { status: 400 }
      )
    }

    // Get attachment record
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: '附件不存在' },
        { status: 404 }
      )
    }

    // Delete file and record
    await deleteFile(attachment.fileName, attachment.mimeType)
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: '删除附件失败' },
      { status: 500 }
    )
  }
}