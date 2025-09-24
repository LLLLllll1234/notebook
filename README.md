# 智能学习笔记管理系统

一个功能强大的个人学习笔记管理和分享系统，基于 Next.js 14 构建，支持 Markdown 编辑、文件上传、批量导入导出等丰富功能。

## 🌟 核心特性

### 📝 强化编辑体验
- **专业 Markdown 编辑器**: 支持完整的 Markdown 语法，包括代码高亮、表格、链接等
- **实时预览**: 编辑和预览模式实时切换
- **丰富格式工具栏**: 快捷插入各种 Markdown 元素
- **键盘快捷键**: 支持常用编辑快捷键，提升编写效率
- **撤销/重做**: 完整的编辑历史管理
- **全屏编辑**: 沉浸式专注写作体验
- **文档内搜索**: 支持当前文档内容搜索和高亮

### 📁 文件管理系统
- **拖拽上传**: 直接拖拽文件到编辑器进行上传
- **多格式支持**: 图片(JPG, PNG, GIF, WebP)、文档(PDF, DOC, DOCX, TXT, MD)、压缩包(ZIP)
- **附件管理**: 完整的附件查看、下载、删除功能
- **图片预览**: 图片附件支持缩略图预览
- **自动插入**: 图片上传后自动插入 Markdown 链接
- **文件大小限制**: 智能文件大小检查和进度显示

### 📤 导入导出功能
- **批量导入**: 支持 Markdown、JSON、文本文件和 ZIP 压缩包批量导入
- **Front Matter 解析**: 自动识别 Markdown 文件的元数据
- **冲突处理**: 提供跳过、覆盖、重命名三种冲突解决策略
- **多格式导出**: JSON(数据备份)、Markdown(原格式)、PDF(打印分享)、ZIP(含附件)
- **高级筛选**: 按标签、日期范围等条件筛选导出内容
- **导入导出记录**: 完整的操作历史和状态跟踪

### 🔍 智能搜索系统
- **全文搜索**: 支持标题、内容和标签的全文搜索
- **标签筛选**: 使用 `#标签名` 格式快速筛选
- **高级搜索**: 支持多条件组合搜索
- **搜索历史**: 记住常用搜索条件

### 🏷️ 灵活标签系统
- **多标签分类**: 支持为每篇笔记添加多个标签
- **标签自动补全**: 智能推荐已有标签
- **标签统计**: 显示每个标签下的笔记数量
- **标签云**: 可视化展示标签使用频率

### 🎨 现代用户界面
- **响应式设计**: 完美适配移动端、平板和桌面端
- **暗色模式**: 内置浅色/深色主题切换
- **流畅动画**: 基于 Framer Motion 的优雅交互动画
- **实时反馈**: Toast 消息和加载状态提示
- **可访问性**: 支持键盘导航和屏幕阅读器

### ⚡ 高性能架构
- **Next.js 14**: 基于最新 App Router，支持 SSR/SSG
- **类型安全**: 完整的 TypeScript 类型定义
- **数据库优化**: Prisma ORM 提供类型安全的数据操作
- **缓存策略**: 多层缓存优化，提升访问速度

## 🛠️ 技术栈

### 核心技术
- **前端框架**: Next.js 14 (App Router)
- **类型安全**: TypeScript
- **数据库**: Prisma + SQLite (开发) / PostgreSQL (生产)
- **样式框架**: Tailwind CSS
- **Markdown 渲染**: react-markdown + remark-gfm + rehype-highlight
- **图标库**: Lucide React

### 增强功能技术
- **文件上传**: react-dropzone
- **动画效果**: framer-motion
- **表单管理**: react-hook-form + zod
- **状态管理**: zustand
- **消息通知**: react-hot-toast
- **PDF 生成**: jspdf
- **文件处理**: jszip
- **UI 组件**: @radix-ui

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

### 安装和运行

1. 克隆项目：
```bash
git clone https://github.com/your-username/notebook.git
cd notebook
```

2. 安装依赖：
```bash
npm install
```

3. 设置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

4. 初始化数据库：
```bash
npx prisma db push
```

5. (可选) 添加示例数据：
```bash
npx prisma db seed
```

6. 创建必要的目录：
```bash
mkdir -p public/uploads/images public/uploads/documents public/uploads/temp public/exports
```

7. 启动开发服务器：
```bash
npm run dev
```

8. 打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
notebook/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── dashboard/         # 管理后台
│   │   │   ├── new/           # 新建笔记
│   │   │   ├── edit/[id]/     # 编辑笔记
│   │   │   └── import-export/ # 导入导出管理
│   │   ├── post/[slug]/       # 文章详情页
│   │   ├── api/               # API 路由
│   │   │   ├── upload/        # 文件上传 API
│   │   │   ├── import/        # 导入 API
│   │   │   ├── export/        # 导出 API
│   │   │   └── attachments/   # 附件 API
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── PostForm.tsx       # 基础编辑器
│   │   ├── EnhancedPostForm.tsx # 增强编辑器
│   │   ├── FileUpload.tsx     # 文件上传组件
│   │   ├── AttachmentManager.tsx # 附件管理器
│   │   ├── ImportComponent.tsx # 导入组件
│   │   ├── ExportComponent.tsx # 导出组件
│   │   └── MarkdownRenderer.tsx # Markdown 渲染器
│   └── lib/                   # 工具库和配置
│       ├── prisma.ts          # 数据库客户端
│       ├── actions.ts         # Server Actions
│       ├── upload.ts          # 文件上传工具
│       ├── import.ts          # 导入工具
│       ├── export.ts          # 导出工具
│       ├── types.ts           # 类型定义
│       └── utils.ts           # 工具函数
├── prisma/                    # 数据库配置
│   ├── schema.prisma          # 数据模型
│   └── seed.ts                # 种子数据
└── public/                    # 静态资源
    ├── uploads/               # 上传文件
    │   ├── images/            # 图片文件
    │   ├── documents/         # 文档文件
    │   └── temp/              # 临时文件
    └── exports/               # 导出文件
```

## 📚 使用指南

### 创建笔记

1. 点击首页的“新建笔记”按钮或访问 `/dashboard/new`
2. 填写标题、内容和标签
3. 支持实时预览 Markdown 渲染效果
4. 使用丰富的格式化工具栏快速插入元素
5. 添加附件（图片、文档等）
6. 点击保存即可发布

### 文件上传管理

1. **拖拽上传**: 直接将文件拖拽到编辑器中
2. **附件管理**: 在附件面板中查看和管理所有附件
3. **自动插入**: 图片上传后自动插入 Markdown 链接
4. **支持格式**: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT, MD, ZIP

### 批量导入导出

1. **导入数据**:
   - 访问 `/dashboard/import-export`
   - 选择冲突处理策略
   - 上传 Markdown, JSON, 文本或 ZIP 文件
   - 查看导入结果和错误报告

2. **导出数据**:
   - 选择导出格式（JSON, Markdown, PDF, ZIP）
   - 设置高级筛选条件（标签、日期范围）
   - 选择是否包含附件文件
   - 下载生成的导出文件

### 搜索笔记

- 在首页搜索框输入关键词进行全文搜索
- 使用 `#标签名` 格式搜索特定标签
- 点击文章中的标签快速筛选相关内容
- 支持复合搜索条件

### 管理笔记

- 访问 `/dashboard` 查看所有笔记
- 点击编辑按钮修改笔记内容
- 支持删除操作（需确认）
- 查看笔记统计信息和标签使用情况

## 🚀 部署指南

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

### 环境变量配置

```env
# 开发环境
DATABASE_URL="file:./dev.db"

# 生产环境 (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/database?schema=public"
```

### 数据库迁移

生产环境建议使用 PostgreSQL：

```bash
# 更新数据库连接
npx prisma migrate dev --name init

# 生成 Prisma 客户端
npx prisma generate

# 部署数据库更改
npx prisma db push
```

## 💻 开发说明

### 数据模型

- **Post**: 笔记文章，包含标题、内容、slug 等
- **Tag**: 标签，支持多对多关联
- **TagOnPost**: 文章和标签的关联表
- **Attachment**: 文件附件，支持与笔记关联
- **ImportExportRecord**: 导入导出操作记录

### API 路由

#### 基础路由
- `GET /`: 首页，显示所有笔记
- `GET /post/[slug]`: 文章详情页
- `GET /dashboard`: 管理后台
- `GET /dashboard/new`: 新建笔记页面
- `GET /dashboard/edit/[id]`: 编辑笔记页面
- `GET /dashboard/import-export`: 导入导出管理

#### 文件管理 API
- `POST /api/upload`: 文件上传
- `DELETE /api/upload`: 删除文件
- `GET /api/attachments`: 获取附件列表

#### 导入导出 API
- `POST /api/import`: 批量导入数据
- `GET /api/import`: 获取导入记录
- `POST /api/export`: 批量导出数据
- `GET /api/export`: 获取导出记录

### 组件架构

#### 基础组件
- `PostForm`: 基础笔记编辑表单
- `EnhancedPostForm`: 增强版笔记编辑器
- `MarkdownRenderer`: Markdown 内容渲染器
- `SearchBar`: 搜索功能组件
- `PostList`: 笔记列表组件

#### 文件管理组件
- `FileUpload`: 拖拽上传组件
- `AttachmentManager`: 附件管理器

#### 导入导出组件
- `ImportComponent`: 文件导入组件
- `ExportComponent`: 数据导出组件

### 工具库

#### 数据处理
- `src/lib/upload.ts`: 文件上传处理工具
- `src/lib/import.ts`: 数据导入处理工具
- `src/lib/export.ts`: 数据导出处理工具
- `src/lib/types.ts`: TypeScript 类型定义

#### 工具函数
- `generateSlug()`: 生成 URL 友好的 slug
- `formatDate()`: 日期格式化
- `extractContent()`: 提取纯文本内容

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 🎆 更新日志

### v2.0.0 - 功能大幅增强 (当前版本)

#### 🆕 新增功能
- ✨ **文件上传系统**: 支持拖拽上传图片和文档
- 📤 **批量导入导出**: 支持 Markdown、JSON、ZIP 格式
- 📝 **增强编辑器**: 丰富的格式化工具栏和快捷键
- 📁 **附件管理**: 完整的文件附件管理系统
- 🎨 **动画效果**: 流畅的界面交互体验
- 🔍 **文档内搜索**: 支持在当前笔记内搜索

#### 🔧 技术升级
- 升级到 Next.js 14 最新版本
- 集成 Framer Motion 动画库
- 添加 React Hook Form 表单管理
- 引入 Zustand 状态管理
- 集成 Radix UI 组件库

#### 🐛 问题修复
- 修复中文标题 slug 生成问题
- 优化移动端响应式布局
- 提升数据库查询性能
- 增强错误处理机制

### v1.0.0 - 初始版本
- 基础 Markdown 编辑功能
- 标签系统
- 搜索功能
- 响应式设计
- 暗色模式支持

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📧 联系方式

如果您有任何问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件至 [383627698@qq.com]
- 在项目中参与 Discussions

## ❤️ 感谢

感谢以下开源项目的贡献：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://prisma.io/) - 数据库 ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://framer.com/motion/) - 动画库
- [Lucide React](https://lucide.dev/) - 图标库
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染

---

⭐ 如果这个项目对您有帮助，请给它一个星星！