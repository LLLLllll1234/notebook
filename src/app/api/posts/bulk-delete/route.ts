import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BulkOperationRequest, BulkOperationResponse } from '@/lib/types'

export async function DELETE(request: NextRequest) {
  try {
    const body: BulkOperationRequest = await request.json()
    const { postIds } = body

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供要删除的笔记ID列表'
      } as BulkOperationResponse, { status: 400 })
    }

    // 验证所有ID是否存在
    const existingPosts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        isDeleted: false
      },
      select: { id: true, title: true }
    })

    if (existingPosts.length !== postIds.length) {
      return NextResponse.json({
        success: false,
        error: '部分笔记不存在或已被删除'
      } as BulkOperationResponse, { status: 404 })
    }

    // 创建操作历史记录
    const operationHistory = await prisma.operationHistory.create({
      data: {
        operationType: 'bulk_delete',
        targetIds: JSON.stringify(postIds),
        operationData: JSON.stringify({ posts: existingPosts }),
        canUndo: true,
        undoExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
      }
    })

    // 执行软删除
    const deleteResult = await prisma.post.updateMany({
      where: {
        id: { in: postIds },
        isDeleted: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        affectedCount: deleteResult.count,
        operationId: operationHistory.id,
        details: {
          deletedPosts: existingPosts.map(p => ({ id: p.id, title: p.title }))
        }
      }
    } as BulkOperationResponse)

  } catch (error) {
    console.error('批量删除失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除失败，请稍后重试'
    } as BulkOperationResponse, { status: 500 })
  }
}
