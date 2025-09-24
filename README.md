# 学习笔记平台

一个基于 Next.js 14 的个人学习笔记管理和分享系统，支持 Markdown 格式的笔记创建、编辑、标签分类和搜索功能。

## 功能特性

- 📝 **Markdown 笔记编辑**: 支持完整的 Markdown 语法，包括代码高亮
- 🔍 **智能搜索**: 支持标题、内容和标签的全文搜索
- 🏷️ **标签系统**: 灵活的标签分类管理
- 🌙 **暗色模式**: 内置浅色/深色主题切换
- 📱 **响应式设计**: 完美适配移动端和桌面端
- ⚡ **高性能**: 基于 Next.js 14 App Router，支持 SSR/SSG

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **数据库**: Prisma + SQLite (开发) / PostgreSQL (生产)
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **图标**: Lucide React
- **类型安全**: TypeScript

## 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

### 安装和运行

1. 克隆项目：
```bash
git clone <https://github.com/LLLLllll1234/notebook.git>
cd study-notes
```

2. 安装依赖：
```bash
npm install
```

3. 设置环境变量：
```bash
cp .env.example .env
```

4. 初始化数据库：
```bash
npx prisma db push
```

5. (可选) 添加示例数据：
```bash
npx prisma db seed
```

6. 启动开发服务器：
```bash
npm run dev
```

7. 打开浏览器访问 `http://localhost:3000`

## 项目结构

```
study-notes/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (blog)/            # 博客路由组
│   │   ├── post/[slug]/       # 文章详情页
│   │   ├── dashboard/         # 管理后台
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── ui/                # 基础 UI 组件
│   │   └── forms/             # 表单组件
│   └── lib/                   # 工具库和配置
│       ├── prisma.ts          # 数据库客户端
│       ├── actions.ts         # Server Actions
│       └── utils.ts           # 工具函数
├── prisma/                    # 数据库配置
│   ├── schema.prisma          # 数据模型
│   └── seed.ts                # 种子数据
└── public/                    # 静态资源
```

## 使用指南

### 创建笔记

1. 点击首页的"新建笔记"按钮或访问 `/dashboard/new`
2. 填写标题、内容和标签
3. 支持实时预览 Markdown 渲染效果
4. 点击保存即可发布

### 搜索笔记

- 在首页搜索框输入关键词进行全文搜索
- 使用 `#标签名` 格式搜索特定标签
- 点击文章中的标签快速筛选相关内容

### 管理笔记

- 访问 `/dashboard` 查看所有笔记
- 点击编辑按钮修改笔记内容
- 支持删除操作（需确认）

## 部署指南

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

## 开发说明

### 数据模型

- **Post**: 笔记文章，包含标题、内容、slug 等
- **Tag**: 标签，支持多对多关联
- **TagOnPost**: 文章和标签的关联表

### API 路由

- `GET /`: 首页，显示所有笔记
- `GET /post/[slug]`: 文章详情页
- `GET /dashboard`: 管理后台
- `POST /dashboard/new`: 创建新笔记
- `PUT /dashboard/edit/[id]`: 编辑笔记

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如果您有任何问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件至 [383627698@qq.com]

---

⭐ 如果这个项目对您有帮助，请给它一个星星！