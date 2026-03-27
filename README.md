# 🐣 Q趣头像 - AI Q版表情包生成器

基于 AI 技术的 Q 版表情包生成工具，一键生成 3x3 网格表情包（9 个表情）。

## ✨ 特性

- ✅ **一次生成**：调用一次 AI API 生成 3x3 网格图（9 个表情）
- ✅ **快速分割**：前端自动将网格图分割为 9 张独立表情
- ✅ **批量下载**：支持单张下载和 ZIP 打包下载
- ✅ **精选表情**：9 种常用表情（开心、悲伤、惊讶、生气、思考、搞怪、发呆、卖萌、害羞）
- ✅ **智能裁剪**：自动处理网格分割，确保每张表情清晰

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
cd frontend
npm install
```

### 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的火山引擎 API Key：
```env
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
AI_MODEL=doubao-seedream-4-0-250828
```

### 获取 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 开通 Doubao Seedream 4.0 服务
3. 创建 API Key

### 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📦 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Cloudflare Pages 部署

项目已配置 Cloudflare Pages 支持：

```bash
npm run build
```

然后在 Cloudflare Pages 部署 `frontend/.vercel/output/static` 目录。

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **AI API**: 火山引擎 Doubao Seedream 4.0
- **打包**: JSZip

### 后端（可选）
- **框架**: Express.js
- **文件上传**: Multer
- **打包下载**: Archiver

## 📁 项目结构

```
q-avatar/
├── frontend/           # 前端项目
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── generate/    # 生成 API
│   │   │   │   ├── upload/      # 上传 API
│   │   │   │   └── download/    # 下载 API
│   │   │   ├── layout.tsx       # 布局
│   │   │   └── page.tsx          # 主页面
│   │   └── lib/
│   │       └── tasks.ts          # 任务管理
│   └── package.json
└── backend/            # 后端项目（可选）
    └── src/
        └── index.js    # Express 服务器
```

## 🔄 工作流程

1. **上传照片** → 用户上传参考图片
2. **预览确认** → 确认照片无误
3. **AI 生成** → 调用火山引擎 API 生成 3x3 网格图
4. **网格分割** → 前端 Canvas 分割为 9 张独立图
5. **选择下载** → 用户选择需要的表情并下载

## 💡 使用技巧

### 优化图片质量

- 上传清晰的正脸照片
- 确保脸部完整，光线充足
- 背景简洁效果更佳

### 批量下载

- 点击"全选"选择全部表情
- 点击"下载全部"打包为 ZIP

### 自定义表情

修改 `frontend/src/app/page.tsx` 中的 `EXPRESSIONS` 数组可以自定义表情类型和文字。

## 🎨 自定义配置

### 修改提示词

编辑 `frontend/src/app/api/generate/route.ts` 中的 `EXPRESSION_PROMPT`：

```typescript
const EXPRESSION_PROMPT = `Based on the reference image character, create a brand new set of Q-version half-body emoticons...`
```

### 修改网格大小

默认为 3x3（9 个表情），如需修改：

1. 修改 `EXPRESSIONS` 数组数量
2. 修改 `splitGridImage` 函数的 `gridSize` 常量
3. 更新 AI API 的提示词

## 🐛 常见问题

### 生成失败

- 检查 API Key 是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 图片模糊

- 确保上传的图片清晰
- 检查 AI API 返回的图片尺寸
- 尝试使用高质量的参考图

### 网格分割不准确

- 确保 AI 返回的是 3x3 网格图
- 检查图片尺寸是否为正方形

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题，请提交 Issue 或联系开发者。

---

Made with ❤️ by AI 破局俱乐部
