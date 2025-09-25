import { NextRequest, NextResponse } from 'next/server'
import { getStorageStats, UPLOAD_DIR } from '@/lib/api/upload'
import { StorageCleaner, CleanupOptions } from '@/lib/storage-cleaner'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        // 获取存储统计信息
        const stats = await getStorageStats()
        
        // 获取磁盘使用情况
        const diskUsage = await getDiskUsage()
        
        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            diskUsage
          }
        })

      case 'cleanup':
        // 获取清理选项
        const dryRun = searchParams.get('dryRun') === 'true'
        const deleteOrphanedFiles = searchParams.get('deleteOrphanedFiles') !== 'false'
        const deleteTempFiles = searchParams.get('deleteTempFiles') !== 'false'
        const deleteOldFiles = searchParams.get('deleteOldFiles') === 'true'
        const maxFileAgeDays = parseInt(searchParams.get('maxFileAgeDays') || '365')
        
        const cleanupOptions: CleanupOptions = {
          dryRun,
          deleteOrphanedFiles,
          deleteTempFiles,
          deleteOldFiles,
          maxFileAgeDays
        }
        
        // 执行清理
        const cleanupResult = await StorageCleaner.performCleanup(cleanupOptions)
        
        return NextResponse.json({
          success: true,
          data: cleanupResult
        })

      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Storage management error:', error)
    return NextResponse.json(
      { success: false, error: '存储管理操作失败' },
      { status: 500 }
    )
  }
}

async function getDiskUsage(): Promise<{
  totalSize: number
  usedSize: number
  availableSize: number
}> {
  try {
    const totalSize = await calculateDirectorySize(UPLOAD_DIR)
    
    return {
      totalSize,
      usedSize: totalSize,
      availableSize: 1024 * 1024 * 1024 * 10 // 假设有10GB可用空间
    }
  } catch (error) {
    console.error('Error calculating disk usage:', error)
    return {
      totalSize: 0,
      usedSize: 0,
      availableSize: 0
    }
  }
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)
      
      if (item.isDirectory()) {
        totalSize += await calculateDirectorySize(itemPath)
      } else {
        const stats = await fs.stat(itemPath)
        totalSize += stats.size
      }
    }
  } catch (error) {
    // 目录不存在或无法访问
    console.warn(`Cannot access directory: ${dirPath}`)
  }
  
  return totalSize
}

async function performCleanup(): Promise<{
  removedFiles: number
  freedSpace: number
  errors: string[]
}> {
  let removedFiles = 0
  let freedSpace = 0
  const errors: string[] = []

  try {
    // 清理temp目录
    const tempDir = path.join(UPLOAD_DIR, 'temp')
    const tempCleanup = await cleanupDirectory(tempDir, (stats) => {
      // 删除超过24小时的临时文件
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return stats.mtime < oneDayAgo
    })
    
    removedFiles += tempCleanup.removedFiles
    freedSpace += tempCleanup.freedSpace
    errors.push(...tempCleanup.errors)

    // TODO: 清理数据库中不存在记录的孤立文件
    // 这需要检查文件系统中的文件是否在数据库中有对应记录
    
  } catch (error) {
    errors.push(`清理过程中发生错误: ${error instanceof Error ? error.message : String(error)}`)
  }

  return {
    removedFiles,
    freedSpace,
    errors
  }
}

async function cleanupDirectory(
  dirPath: string,
  shouldDelete: (stats: fs.Stats) => boolean
): Promise<{
  removedFiles: number
  freedSpace: number
  errors: string[]
}> {
  let removedFiles = 0
  let freedSpace = 0
  const errors: string[] = []

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)
      
      try {
        const stats = await fs.stat(itemPath)
        
        if (item.isFile() && shouldDelete(stats)) {
          await fs.unlink(itemPath)
          removedFiles++
          freedSpace += stats.size
        } else if (item.isDirectory()) {
          const subResult = await cleanupDirectory(itemPath, shouldDelete)
          removedFiles += subResult.removedFiles
          freedSpace += subResult.freedSpace
          errors.push(...subResult.errors)
        }
      } catch (error) {
        errors.push(`处理文件 ${itemPath} 时出错: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  } catch (error) {
    errors.push(`无法访问目录 ${dirPath}: ${error instanceof Error ? error.message : String(error)}`)
  }

  return {
    removedFiles,
    freedSpace,
    errors
  }
}