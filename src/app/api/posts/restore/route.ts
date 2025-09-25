import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { operationId } = await request.json()

    if (!operationId) {
      return NextResponse.json({
        success: false,
        error: '请提供操作ID'
      }, { status: 400 })
    }

    // 查找操作历史
    const operation = await prisma.operationHistory.findUnique({
      where: { id: operationId }
    })

    if (!operation) {
      return NextResponse.json({
        success: false,
        error: '操作记录不存在'
      }, { status: 404 })
    }

    if (!operation.canUndo) {
      return NextResponse.json({
        success: false,
        error: '该操作不支持撤销'
      }, { status: 400 })
    }

    if (operation.isUndone) {
      return NextResponse.json({
        success: false,
        error: '该操作已经被撤销'
      }, { status: 400 })
    }

    if (operation.undoExpiry && operation.undoExpiry < new Date()) {
      return NextResponse.json({
        success: false,
        error: '撤销操作已过期'
      }, { status: 400 })
    }

    const targetIds = JSON.parse(operation.targetIds) as string[]
    let affectedCount = 0

    // 根据操作类型执行撤销
    if (operation.operationType === 'bulk_delete') {
      // 撤销删除：恢复软删除的笔记
      const restoreResult = await prisma.post.updateMany({
        where: {
          id: { in: targetIds },
          isDeleted: true
        },
        data: {
          isDeleted: false,
          deletedAt: null
        }
      })
      affectedCount = restoreResult.count

    } else if (operation.operationType === 'bulk_tag') {
      // 撤销标签操作比较复杂，需要根据具体操作数据来撤销
      const operationData = JSON.parse(operation.operationData || '{}')
      const { action, data } = operationData

      if (action === 'add') {
        // 撤销添加：移除添加的标签
        const tagNames = data.tagNames
        const tags = await prisma.tag.findMany({
          where: { name: { in: tagNames } }
        })

        if (tags.length > 0) {
          const deleteResult = await prisma.tagOnPost.deleteMany({
            where: {
              postId: { in: targetIds },
              tagId: { in: tags.map(t => t.id) }
            }
          })
          affectedCount = deleteResult.count
        }

      } else if (action === 'remove') {
        // 撤销移除：重新添加被移除的标签
        const tagNames = data.tagNames
        
        for (const tagName of tagNames) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {}
          })

          for (const postId of targetIds) {
            await prisma.tagOnPost.upsert({
              where: {
                postId_tagId: {
                  postId: postId,
                  tagId: tag.id
                }
              },
              create: {
                postId: postId,
                tagId: tag.id
              },
              update: {}
            })
          }
        }
        affectedCount = targetIds.length

      } else if (action === 'replace') {
        // 撤销替换：将新标签替换回原标签
        const { oldTagName, newTagName } = data

        const oldTag = await prisma.tag.upsert({
          where: { name: oldTagName },
          create: { name: oldTagName },
          update: {}
        })

        const newTag = await prisma.tag.findUnique({
          where: { name: newTagName }
        })

        if (newTag) {
          const tagRelations = await prisma.tagOnPost.findMany({
            where: {
              postId: { in: targetIds },
              tagId: newTag.id
            }
          })

          for (const relation of tagRelations) {
            await prisma.$transaction([
              prisma.tagOnPost.delete({
                where: {
                  postId_tagId: {
                    postId: relation.postId,
                    tagId: newTag.id
                  }
                }
              }),
              prisma.tagOnPost.upsert({
                where: {
                  postId_tagId: {
                    postId: relation.postId,
                    tagId: oldTag.id
                  }
                },
                create: {
                  postId: relation.postId,
                  tagId: oldTag.id
                },
                update: {}
              })
            ])
          }
          affectedCount = tagRelations.length
        }
      }

    } else {
      return NextResponse.json({
        success: false,
        error: '不支持撤销此类操作'
      }, { status: 400 })
    }

    // 标记操作为已撤销
    await prisma.operationHistory.update({
      where: { id: operationId },
      data: { isUndone: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        affectedCount,
        operationType: operation.operationType,
        undoCompletedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('撤销操作失败:', error)
    return NextResponse.json({
      success: false,
      error: '撤销失败，请稍后重试'
    }, { status: 500 })
  }
}
