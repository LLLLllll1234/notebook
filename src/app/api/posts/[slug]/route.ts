import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { 
        slug: params.slug,
        isDeleted: false
      },
      include: {
        tags: {
          include: {
            tag: true,
            post: true
          }
        },
        attachments: true
      }
    })

    if (!post) {
      return NextResponse.json({
        success: false,
        error: '文章未找到'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      post
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取文章失败'
    }, { status: 500 })
  }
}
