import { prisma } from './prisma'
import { promises as fs } from 'fs'
import path from 'path'
import { UPLOAD_DIR } from './api/upload'

export interface CleanupOptions {
  deleteOrphanedFiles?: boolean
  deleteTempFiles?: boolean
  deleteOldFiles?: boolean
  oldFileThresholdDays?: number
  maxFileAgeDays?: number
  dryRun?: boolean
}

export interface CleanupResult {
  orphanedFilesRemoved: number
  tempFilesRemoved: number
  oldFilesRemoved: number
  totalSpaceFreed: number
  errors: string[]
  summary: string
}

export class StorageCleaner {
  private static readonly DEFAULT_OPTIONS: Required<CleanupOptions> = {
    deleteOrphanedFiles: true,
    deleteTempFiles: true,
    deleteOldFiles: false,
    oldFileThresholdDays: 30,
    maxFileAgeDays: 365,
    dryRun: false
  }

  /**
   * 执行存储清理
   */
  static async performCleanup(options: Partial<CleanupOptions> = {}): Promise<CleanupResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    const result: CleanupResult = {
      orphanedFilesRemoved: 0,
      tempFilesRemoved: 0,
      oldFilesRemoved: 0,
      totalSpaceFreed: 0,
      errors: [],
      summary: ''
    }

    try {
      // 清理临时文件
      if (opts.deleteTempFiles) {
        const tempResult = await this.cleanupTempFiles(opts.dryRun)
        result.tempFilesRemoved += tempResult.filesRemoved
        result.totalSpaceFreed += tempResult.spaceFreed
        result.errors.push(...tempResult.errors)
      }

      // 清理孤立文件
      if (opts.deleteOrphanedFiles) {
        const orphanResult = await this.cleanupOrphanedFiles(opts.dryRun)
        result.orphanedFilesRemoved += orphanResult.filesRemoved
        result.totalSpaceFreed += orphanResult.spaceFreed
        result.errors.push(...orphanResult.errors)
      }

      // 清理旧文件
      if (opts.deleteOldFiles) {
        const oldResult = await this.cleanupOldFiles(opts.maxFileAgeDays, opts.dryRun)
        result.oldFilesRemoved += oldResult.filesRemoved
        result.totalSpaceFreed += oldResult.spaceFreed
        result.errors.push(...oldResult.errors)
      }

      // 生成总结
      const totalFiles = result.orphanedFilesRemoved + result.tempFilesRemoved + result.oldFilesRemoved
      result.summary = this.generateSummary(result, totalFiles, opts.dryRun)

    } catch (error) {
      result.errors.push(`清理过程中发生严重错误: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * 清理临时文件
   */
  private static async cleanupTempFiles(dryRun: boolean): Promise<{
    filesRemoved: number
    spaceFreed: number
    errors: string[]
  }> {
    const tempDir = path.join(UPLOAD_DIR, 'temp')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    return await this.cleanupDirectoryByAge(tempDir, oneDayAgo, dryRun)
  }

  /**
   * 清理孤立文件（文件系统中存在但数据库中没有记录的文件）
   */
  private static async cleanupOrphanedFiles(dryRun: boolean): Promise<{
    filesRemoved: number
    spaceFreed: number
    errors: string[]
  }> {
    const result = {
      filesRemoved: 0,
      spaceFreed: 0,
      errors: [] as string[]
    }

    try {
      // 获取数据库中所有文件记录
      const dbFiles = await prisma.attachment.findMany({
        select: { fileName: true, thumbnailFileName: true }
      })

      const dbFileNames = new Set<string>()
      dbFiles.forEach(file => {
        dbFileNames.add(file.fileName)
        if (file.thumbnailFileName) {
          dbFileNames.add(file.thumbnailFileName)
        }
      })

      // 检查images目录
      const imagesDir = path.join(UPLOAD_DIR, 'images')
      const imageResult = await this.cleanupOrphanedInDirectory(imagesDir, dbFileNames, dryRun)
      result.filesRemoved += imageResult.filesRemoved
      result.spaceFreed += imageResult.spaceFreed
      result.errors.push(...imageResult.errors)

      // 检查documents目录
      const documentsDir = path.join(UPLOAD_DIR, 'documents')
      const docResult = await this.cleanupOrphanedInDirectory(documentsDir, dbFileNames, dryRun)
      result.filesRemoved += docResult.filesRemoved
      result.spaceFreed += docResult.spaceFreed
      result.errors.push(...docResult.errors)

      // 检查thumbnails目录
      const thumbnailsDir = path.join(UPLOAD_DIR, 'thumbnails')
      const thumbResult = await this.cleanupOrphanedInDirectory(thumbnailsDir, dbFileNames, dryRun)
      result.filesRemoved += thumbResult.filesRemoved
      result.spaceFreed += thumbResult.spaceFreed
      result.errors.push(...thumbResult.errors)

    } catch (error) {
      result.errors.push(`清理孤立文件时出错: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * 清理指定目录中的孤立文件
   */
  private static async cleanupOrphanedInDirectory(
    dirPath: string,
    dbFileNames: Set<string>,
    dryRun: boolean
  ): Promise<{
    filesRemoved: number
    spaceFreed: number
    errors: string[]
  }> {
    const result = {
      filesRemoved: 0,
      spaceFreed: 0,
      errors: [] as string[]
    }

    try {
      const files = await this.getAllFilesInDirectory(dirPath)
      
      for (const filePath of files) {
        const fileName = path.basename(filePath)
        
        if (!dbFileNames.has(fileName)) {
          try {
            const stats = await fs.stat(filePath)
            
            if (!dryRun) {
              await fs.unlink(filePath)
            }
            
            result.filesRemoved++
            result.spaceFreed += stats.size
          } catch (error) {
            result.errors.push(`删除孤立文件 ${filePath} 失败: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
    } catch (error) {
      result.errors.push(`处理目录 ${dirPath} 时出错: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * 清理旧文件
   */
  private static async cleanupOldFiles(maxAgeDays: number, dryRun: boolean): Promise<{
    filesRemoved: number
    spaceFreed: number
    errors: string[]
  }> {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000)
    
    const result = {
      filesRemoved: 0,
      spaceFreed: 0,
      errors: [] as string[]
    }

    try {
      // 从数据库获取旧文件
      const oldAttachments = await prisma.attachment.findMany({
        where: {
          uploadedAt: {
            lt: cutoffDate
          }
        }
      })

      for (const attachment of oldAttachments) {
        try {
          // 删除主文件
          const mainFilePath = path.join(UPLOAD_DIR, 
            attachment.mimeType.startsWith('image/') ? 'images' : 'documents',
            attachment.fileName
          )
          
          if (await this.fileExists(mainFilePath)) {
            const stats = await fs.stat(mainFilePath)
            
            if (!dryRun) {
              await fs.unlink(mainFilePath)
            }
            
            result.spaceFreed += stats.size
          }

          // 删除缩略图
          if (attachment.thumbnailFileName) {
            const thumbPath = path.join(UPLOAD_DIR, 'thumbnails', attachment.thumbnailFileName)
            
            if (await this.fileExists(thumbPath)) {
              const stats = await fs.stat(thumbPath)
              
              if (!dryRun) {
                await fs.unlink(thumbPath)
              }
              
              result.spaceFreed += stats.size
            }
          }

          // 删除数据库记录
          if (!dryRun) {
            await prisma.attachment.delete({
              where: { id: attachment.id }
            })
          }

          result.filesRemoved++
        } catch (error) {
          result.errors.push(`删除旧文件 ${attachment.fileName} 失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    } catch (error) {
      result.errors.push(`清理旧文件时出错: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * 按文件年龄清理目录
   */
  private static async cleanupDirectoryByAge(
    dirPath: string,
    cutoffDate: Date,
    dryRun: boolean
  ): Promise<{
    filesRemoved: number
    spaceFreed: number
    errors: string[]
  }> {
    const result = {
      filesRemoved: 0,
      spaceFreed: 0,
      errors: [] as string[]
    }

    try {
      if (!(await this.fileExists(dirPath))) {
        return result
      }

      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name)
        
        try {
          if (item.isFile()) {
            const stats = await fs.stat(itemPath)
            
            if (stats.mtime < cutoffDate) {
              if (!dryRun) {
                await fs.unlink(itemPath)
              }
              
              result.filesRemoved++
              result.spaceFreed += stats.size
            }
          } else if (item.isDirectory()) {
            const subResult = await this.cleanupDirectoryByAge(itemPath, cutoffDate, dryRun)
            result.filesRemoved += subResult.filesRemoved
            result.spaceFreed += subResult.spaceFreed
            result.errors.push(...subResult.errors)
          }
        } catch (error) {
          result.errors.push(`处理文件 ${itemPath} 时出错: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    } catch (error) {
      result.errors.push(`处理目录 ${dirPath} 时出错: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * 递归获取目录中的所有文件
   */
  private static async getAllFilesInDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      if (!(await this.fileExists(dirPath))) {
        return files
      }

      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name)
        
        if (item.isFile()) {
          files.push(itemPath)
        } else if (item.isDirectory()) {
          const subFiles = await this.getAllFilesInDirectory(itemPath)
          files.push(...subFiles)
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${dirPath}:`, error)
    }

    return files
  }

  /**
   * 检查文件是否存在
   */
  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 生成清理总结
   */
  private static generateSummary(result: CleanupResult, totalFiles: number, dryRun: boolean): string {
    const action = dryRun ? '预览' : '完成'
    
    if (totalFiles === 0) {
      return `${action}清理：没有找到需要清理的文件`
    }

    const parts = []
    
    if (result.tempFilesRemoved > 0) {
      parts.push(`${result.tempFilesRemoved}个临时文件`)
    }
    
    if (result.orphanedFilesRemoved > 0) {
      parts.push(`${result.orphanedFilesRemoved}个孤立文件`)
    }
    
    if (result.oldFilesRemoved > 0) {
      parts.push(`${result.oldFilesRemoved}个旧文件`)
    }

    const sizeFormatted = this.formatFileSize(result.totalSpaceFreed)
    
    return `${action}清理：删除${parts.join('、')}，释放${sizeFormatted}存储空间`
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}