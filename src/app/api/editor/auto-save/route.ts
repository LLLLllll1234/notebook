import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { postId, title, content, tags } = await request.json()

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        error: '标题和内容不能为空'
      }, { status: 400 })
    }

    // 设置草稿过期时间（30天后）
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    let draft

    if (postId) {
      // 更新现有笔记的草稿
      // 先查找是否存在草稿
      const existingDraft = await prisma.draftSave.findFirst({
        where: { postId: postId },
        orderBy: { savedAt: 'desc' }
      })

      if (existingDraft) {
        // 更新现有草稿
        draft = await prisma.draftSave.update({
          where: { id: existingDraft.id },
          data: {
            title,
            content,
            tags,
            savedAt: new Date(),
            expiresAt
          }
        })
      } else {
        // 创建新草稿
        draft = await prisma.draftSave.create({
          data: {
            postId,
            title,
            content,
            tags,
            expiresAt
          }
        })
      }
    } else {
      // 创建新笔记的草稿
      // 先删除可能存在的旧草稿（没有 postId 的）
      await prisma.draftSave.deleteMany({
        where: {
          postId: null,
          title: title,
          savedAt: {
            lt: new Date(Date.now() - 5 * 60 * 1000) // 5分钟前的草稿
          }
        }
      })

      draft = await prisma.draftSave.create({
        data: {
          title,
          content,
          tags,
          expiresAt
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        draftId: draft.id,
        savedAt: draft.savedAt,
        expiresAt: draft.expiresAt
      }
    })

  } catch (error) {
    console.error('保存草稿失败:', error)
    return NextResponse.json({
      success: false,
      error: '保存草稿失败，请稍后重试'
    }, { status: 500 })
  }
}

// 获取草稿列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    let whereClause: any = {
      expiresAt: {
        gt: new Date() // 只获取未过期的草稿
      }
    }

    if (postId) {
      whereClause.postId = postId
    } else {
      whereClause.postId = null
    }

    const drafts = await prisma.draftSave.findMany({
      where: whereClause,
      orderBy: {
        savedAt: 'desc'
      },
      take: 10 // 最多返回10个草稿
    })

    return NextResponse.json({
      success: true,
      data: drafts
    })

  } catch (error) {
    console.error('获取草稿失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取草稿失败，请稍后重试'
    }, { status: 500 })
  }
}

// 删除草稿
export async function DELETE(request: NextRequest) {
  try {
    const { draftId } = await request.json()

    if (!draftId) {
      return NextResponse.json({
        success: false,
        error: '请提供草稿ID'
      }, { status: 400 })
    }

    await prisma.draftSave.delete({
      where: { id: draftId }
    })

    return NextResponse.json({
      success: true,
      data: { deletedId: draftId }
    })

  } catch (error) {
    console.error('删除草稿失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除草稿失败，请稍后重试'
    }, { status: 500 })
  }
}