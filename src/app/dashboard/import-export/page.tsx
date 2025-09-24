import { Metadata } from 'next'
import { ImportComponent } from '@/components/ImportComponent'
import { ExportComponent } from '@/components/ExportComponent'
import { prisma } from '@/lib/prisma'
import { Upload, Download, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: '导入导出 - 笔记管理',
  description: '批量导入和导出笔记数据'
}

async function getAvailableTags() {
  const tags = await prisma.tag.findMany({
    select: { name: true },
    orderBy: { name: 'asc' }
  })
  return tags.map(tag => tag.name)
}

export default async function ImportExportPage() {
  const availableTags = await getAvailableTags()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            导入导出管理
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            批量导入笔记数据或导出备份文件
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Import Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  导入笔记
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  从文件中批量导入笔记内容
                </p>
              </div>
            </div>
            
            <ImportComponent />
          </div>

          {/* Export Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  导出笔记
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  将笔记导出为备份文件
                </p>
              </div>
            </div>
            
            <ExportComponent availableTags={availableTags} />
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              使用提示
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">导入说明</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>支持 Markdown、JSON、文本和ZIP格式</li>
                <li>Markdown文件支持 Front Matter 元数据</li>
                <li>ZIP文件可包含多个笔记文件</li>
                <li>重复标题将根据策略处理</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">导出说明</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>JSON格式包含完整数据，适合备份</li>
                <li>Markdown格式保持原始格式</li>
                <li>PDF格式适合打印和分享</li>
                <li>ZIP格式可包含附件文件</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}