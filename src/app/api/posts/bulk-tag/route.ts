import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BulkOperationRequest, BulkOperationResponse, BulkTagActionType } from '@/lib/types'

export async function PATCH(request: NextRequest) {
  try {
    const body: BulkOperationRequest = await request.json()
    const { postIds, action, data } = body

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供要操作的笔记ID列表'
      } as BulkOperationResponse, { status: 400 })
    }

    if (action !== 'tag') {
      return NextResponse.json({
        success: false,
        error: '无效的操作类型'
      } as BulkOperationResponse, { status: 400 })
    }

    const { action: tagAction, tagNames, oldTagName, newTagName } = data || {}
    const actualAction = tagAction as BulkTagActionType

    if (!tagNames && actualAction !== 'replace') {
      return NextResponse.json({
        success: false,
        error: '请提供标签名称'
      } as BulkOperationResponse, { status: 400 })
    }

    // 验证笔记是否存在
    const existingPosts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        isDeleted: false
      },
      select: { id: true, title: true }
    })

    if (existingPosts.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有找到有效的笔记'
      } as BulkOperationResponse, { status: 404 })
    }

    let result: any = {}
    let affectedCount = 0

    // 创建操作历史记录
    const operationHistory = await prisma.operationHistory.create({
      data: {
        operationType: 'bulk_tag',
        targetIds: JSON.stringify(postIds),
        operationData: JSON.stringify({ action: actualAction, data }),
        canUndo: true,
        undoExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    if (actualAction === 'add') {
      // 批量添加标签
      if (!tagNames || !Array.isArray(tagNames)) {
        return NextResponse.json({
          success: false,
          error: '请提供有效的标签名称列表'
        } as BulkOperationResponse, { status: 400 })
      }
      
      for (const tagName of tagNames) {
        // 创建或获取标签
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {}
        })

        // 为每个笔记添加标签关联（如果不存在）
        for (const post of existingPosts) {
          await prisma.tagOnPost.upsert({
            where: {
              postId_tagId: {
                postId: post.id,
                tagId: tag.id
              }
            },
            create: {
              postId: post.id,
              tagId: tag.id
            },
            update: {}
          })
        }
      }
      affectedCount = existingPosts.length
      result = { addedTags: tagNames, postCount: affectedCount }

    } else if (actualAction === 'remove') {
      // 批量移除标签
      if (!tagNames || !Array.isArray(tagNames)) {
        return NextResponse.json({
          success: false,
          error: '请提供有效的标签名称列表'
        } as BulkOperationResponse, { status: 400 })
      }
      
      const tags = await prisma.tag.findMany({
        where: { name: { in: tagNames } }
      })

      if (tags.length > 0) {
        const deleteResult = await prisma.tagOnPost.deleteMany({
          where: {
            postId: { in: postIds },
            tagId: { in: tags.map((t: any) => t.id) }
          }
        })
        affectedCount = deleteResult.count
      }
      
      result = { removedTags: tagNames, removedCount: affectedCount }

    } else if (actualAction === 'replace') {
      // 批量替换标签
      if (!oldTagName || !newTagName) {
        return NextResponse.json({
          success: false,
          error: '替换操作需要提供原标签名和新标签名'
        } as BulkOperationResponse, { status: 400 })
      }

      const oldTag = await prisma.tag.findUnique({
        where: { name: oldTagName }
      })

      if (!oldTag) {
        return NextResponse.json({
          success: false,
          error: '原标签不存在'
        } as BulkOperationResponse, { status: 404 })
      }

      // 创建或获取新标签
      const newTag = await prisma.tag.upsert({
        where: { name: newTagName },
        create: { name: newTagName },
        update: {}
      })

      // 查找需要替换的关联
      const tagRelations = await prisma.tagOnPost.findMany({
        where: {
          postId: { in: postIds },
          tagId: oldTag.id
        }
      })

      // 删除旧关联，创建新关联
      for (const relation of tagRelations) {
        await prisma.$transaction([
          prisma.tagOnPost.delete({
            where: {
              postId_tagId: {
                postId: relation.postId,
                tagId: oldTag.id
              }
            }
          }),
          prisma.tagOnPost.upsert({
            where: {
              postId_tagId: {
                postId: relation.postId,
                tagId: newTag.id
              }
            },
            create: {
              postId: relation.postId,
              tagId: newTag.id
            },
            update: {}
          })
        ])
      }

      affectedCount = tagRelations.length
      result = { 
        replacedFrom: oldTagName, 
        replacedTo: newTagName, 
        replacedCount: affectedCount 
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        affectedCount,
        operationId: operationHistory.id,
        details: result
      }
    } as BulkOperationResponse)

  } catch (error) {
    console.error('批量标签操作失败:', error)
    return NextResponse.json({
      success: false,
      error: '操作失败，请稍后重试'
    } as BulkOperationResponse, { status: 500 })
  }
}
