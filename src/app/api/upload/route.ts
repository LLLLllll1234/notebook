import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { 
  ensureUploadDir, 
  validateFile, 
  generateFileName, 
  saveFileWithProcessing, 
  getPublicUrl, 
  getThumbnailUrl,
  createAttachmentRecord,
  deleteFile,
  findDuplicateFile
} from '@/lib/api/upload'

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const postId = formData.get('postId') as string | null
    const skipDuplicateCheck = formData.get('skipDuplicateCheck') === 'true'

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

    // Check for duplicates (optional)
    if (!skipDuplicateCheck) {
      const duplicate = await findDuplicateFile(
        file.name,
        file.size,
        file.type
      )
      
      if (duplicate) {
        const publicUrl = getPublicUrl(duplicate.fileName, duplicate.mimeType)
        const thumbnailUrl = duplicate.thumbnailFileName 
          ? getThumbnailUrl(duplicate.thumbnailFileName)
          : undefined
          
        return NextResponse.json({
          success: true,
          data: {
            id: duplicate.id,
            originalName: duplicate.originalName,
            fileName: duplicate.fileName,
            filePath: publicUrl,
            fileSize: duplicate.fileSize,
            mimeType: duplicate.mimeType,
            uploadedAt: duplicate.uploadedAt,
            thumbnailPath: thumbnailUrl,
            isDuplicate: true
          }
        })
      }
    }

    // Generate file name and save file with processing
    const fileName = generateFileName(file.name, file.type)
    const saveResult = await saveFileWithProcessing(file, fileName, file.type)

    // Prepare attachment data
    const attachmentData = {
      originalName: file.name,
      fileName,
      filePath: saveResult.filePath,
      fileSize: file.size,
      mimeType: file.type,
      postId: postId || undefined,
      thumbnailPath: saveResult.thumbnailPath,
      thumbnailFileName: saveResult.thumbnailPath 
        ? path.basename(saveResult.thumbnailPath)
        : undefined,
      compressedSize: saveResult.processedInfo?.compressedSize,
      dimensions: saveResult.processedInfo?.dimensions 
        ? JSON.stringify(saveResult.processedInfo.dimensions)
        : undefined
    }

    // Create attachment record
    const attachment = await createAttachmentRecord(
      attachmentData.originalName,
      attachmentData.fileName,
      attachmentData.filePath,
      attachmentData.fileSize,
      attachmentData.mimeType,
      attachmentData.postId,
      attachmentData.thumbnailPath,
      attachmentData.thumbnailFileName
    )

    // Return file URLs
    const publicUrl = getPublicUrl(fileName, file.type)
    const thumbnailUrl = saveResult.thumbnailPath 
      ? getThumbnailUrl(path.basename(saveResult.thumbnailPath))
      : undefined
    
    return NextResponse.json({
      success: true,
      data: {
        id: attachment.id,
        originalName: attachment.originalName,
        fileName: attachment.fileName,
        filePath: publicUrl,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt,
        thumbnailPath: thumbnailUrl,
        compressedSize: saveResult.processedInfo?.compressedSize,
        dimensions: saveResult.processedInfo?.dimensions,
        compressionRatio: saveResult.processedInfo?.compressedSize 
          ? Math.round(((file.size - saveResult.processedInfo.compressedSize) / file.size) * 100)
          : 0
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

    // Delete files (main and thumbnail) and record
    await deleteFile(
      attachment.fileName, 
      attachment.mimeType, 
      attachment.thumbnailFileName || undefined
    )
    
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ 
      success: true,
      message: '附件删除成功'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: '删除附件失败' },
      { status: 500 }
    )
  }
}