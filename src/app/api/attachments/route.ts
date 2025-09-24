import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (postId) {
      // Get attachments for specific post
      const attachments = await prisma.attachment.findMany({
        where: { postId },
        orderBy: { uploadedAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: attachments
      })
    } else {
      // Get all unlinked attachments
      const attachments = await prisma.attachment.findMany({
        where: { postId: null },
        orderBy: { uploadedAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: attachments
      })
    }

  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json(
      { success: false, error: '获取附件失败' },
      { status: 500 }
    )
  }
}