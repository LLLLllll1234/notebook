# 项目目录结构说明

## 📁 目录组织原则

本项目采用功能模块化的目录结构，提高代码的可维护性和可读性。

## 🗂️ 详细目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── dashboard/         # 管理后台页面
│   ├── post/             # 文章详情页面
│   └── ...               # 其他页面
├── components/            # 组件目录（按功能分类）
│   ├── ui/               # 基础 UI 组件
│   │   ├── SearchBar.tsx      # 搜索栏
│   │   ├── ThemeProvider.tsx  # 主题提供者
│   │   ├── FileUpload.tsx     # 文件上传
│   │   ├── TableInsertDialog.tsx # 表格插入对话框
│   │   └── index.ts           # 统一导出
│   ├── layout/           # 布局组件
│   │   ├── Header.tsx         # 头部导航
│   │   └── index.ts           # 统一导出
│   ├── editor/           # 编辑器相关组件
│   │   ├── EnhancedEditor.tsx    # 增强编辑器
│   │   ├── MarkdownToolbar.tsx   # Markdown 工具栏
│   │   ├── MarkdownRenderer.tsx  # Markdown 渲染器
│   │   └── index.ts              # 统一导出
│   ├── post/             # 笔记相关组件
│   │   ├── PostForm.tsx           # 笔记表单
│   │   ├── EnhancedPostForm.tsx   # 增强笔记表单
│   │   ├── PostList.tsx           # 笔记列表
│   │   ├── DeletePostButton.tsx   # 删除按钮
│   │   ├── AttachmentManager.tsx  # 附件管理
│   │   └── index.ts               # 统一导出
│   ├── bulk/             # 批量操作组件
│   │   ├── BulkOperationToolbar.tsx # 批量操作工具栏
│   │   ├── BulkDeleteDialog.tsx     # 批量删除对话框
│   │   ├── BulkExportDialog.tsx     # 批量导出对话框
│   │   ├── BulkTagDialog.tsx        # 批量标签对话框
│   │   └── index.ts                 # 统一导出
│   ├── import-export/    # 导入导出组件
│   │   ├── ExportComponent.tsx    # 导出组件
│   │   ├── ImportComponent.tsx    # 导入组件
│   │   ├── MarkdownUpload.tsx     # Markdown 上传
│   │   └── index.ts               # 统一导出
│   ├── navigation/       # 导航相关组件
│   │   ├── FloatingTOC.tsx        # 悬浮目录
│   │   └── index.ts               # 统一导出
│   └── index.ts          # 全局统一导出
├── lib/                  # 工具库
│   ├── api/             # API 相关
│   │   ├── export.ts         # 导出功能
│   │   ├── import.ts         # 导入功能
│   │   ├── upload.ts         # 上传功能
│   │   └── index.ts          # 统一导出
│   ├── stores/          # 状态管理
│   │   ├── editor.ts         # 编辑器状态
│   │   ├── selection.ts      # 选择状态
│   │   └── index.ts          # 统一导出
│   ├── types/           # 类型定义
│   │   ├── types.ts          # 全局类型
│   │   └── index.ts          # 统一导出
│   ├── utils/           # 工具函数
│   │   ├── utils.ts          # 通用工具
│   │   └── index.ts          # 统一导出
│   ├── actions.ts       # Server Actions
│   └── prisma.ts        # 数据库连接
└── hooks/               # 自定义 Hooks（预留）
```

## 📋 导入使用方式

### 1. 按模块导入
```typescript
// 从特定模块导入
import { SearchBar, FileUpload } from '@/components/ui'
import { PostForm, PostList } from '@/components/post'
import { EnhancedEditor } from '@/components/editor'
```

### 2. 全局导入
```typescript
// 从根模块导入
import { SearchBar, PostForm, EnhancedEditor } from '@/components'
```

### 3. 工具库导入
```typescript
// API 工具
import { exportPosts, importPosts } from '@/lib/api'

// 类型定义
import type { Post, Tag } from '@/lib/types'

// 工具函数
import { formatDate, cn } from '@/lib/utils'

// 状态管理
import { useEditorStore, useSelectionStore } from '@/lib/stores'
```

## 🔧 维护指南

### 1. 添加新组件
- 根据功能将组件放入对应的模块目录
- 更新对应模块的 `index.ts` 文件
- 如果是全新的功能模块，创建新的模块目录

### 2. 重构现有组件
- 保持组件在正确的功能模块中
- 更新导入路径
- 确保索引文件同步更新

### 3. 命名规范
- 组件文件使用 PascalCase（如 `SearchBar.tsx`）
- 工具文件使用 kebab-case 或 camelCase
- 目录名使用 kebab-case（如 `import-export`）

## 🎯 优势

1. **清晰的功能分类**：按功能模块组织，便于理解和维护
2. **统一的导入方式**：通过索引文件提供一致的导入体验
3. **可扩展性**：易于添加新功能模块
4. **代码复用**：相关组件集中管理，便于复用
5. **团队协作**：明确的文件位置约定，减少冲突