import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 获取笔记列表
    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false
      },
      include: {
        tags: {
          include: {
            tag: true,
            post: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // 获取总数
    const total = await prisma.post.count({
      where: {
        isDeleted: false
      }
    })

    // 获取标签统计
    const tagCount = await prisma.tag.count()

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalPosts: total,
        totalTags: tagCount
      }
    })
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取笔记列表失败'
    }, { status: 500 })
  }
}
