# GitHub Actions 自动部署设置指南

## ✅ 已完成的配置

### 1. GitHub Actions 工作流已创建
文件位置：`.github/workflows/deploy-cloudflare.yml`

### 2. Cloudflare Account 信息
- **Account ID**: `fb153c80fbe47ab7a7a8793b32e55981`
- **Account Name**: Hanqiushui426@gmail.com's Account
- **Pages 项目**: q-avatar-frontend
- **绑定域名**: thepeacock.shop

---

## 🔧 需要你手动完成的配置

### 步骤 1：在 GitHub 中添加 Secrets

进入 GitHub 仓库：`https://github.com/hanqiushui426-alt/q-avatar`

添加以下两个 Secrets：

#### Secret 1: CLOUDFLARE_API_TOKEN
1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: `cfat_7EiKwKo5j8oOVOFIq8zKDG9GfnIpc4WSNml6umjR0093c69a`
4. 点击 **Add secret**

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
1. 点击 **New repository secret**
2. **Name**: `CLOUDFLARE_ACCOUNT_ID`
3. **Value**: `fb153c80fbe47ab7a7a8793b32e55981`
4. 点击 **Add secret**

---

### 步骤 2：提交工作流文件到 GitHub

```bash
cd /root/.openclaw/workspace/project/q-avatar
git add .github/workflows/deploy-cloudflare.yml
git commit -m "添加 GitHub Actions 自动部署到 Cloudflare Pages"
git push origin main
```

---

## 🚀 自动部署如何工作

### 触发条件
- 推送代码到 `main` 分支
- 手动触发（在 GitHub Actions 页面点击 "Run workflow"）

### 部署流程
1. 检出代码
2. 设置 Node.js 22 环境
3. 安装前端依赖（使用 --legacy-peer-deps）
4. 构建 Next.js 应用
5. 部署到 Cloudflare Pages (q-avatar-frontend 项目)

### 部署结果
- 自动部署到：https://thepeacock.shop
- 可以在 GitHub Actions 页面查看部署进度和日志

---

## 📊 监控部署

### 查看部署状态
1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看最新的 "Deploy to Cloudflare Pages" 工作流

### 查看部署历史
1. 进入 Cloudflare Dashboard
2. 选择 **Workers & Pages** → **q-avatar-frontend**
3. 查看 **Deployments** 页面

---

## ⚠️ 注意事项

### 1. 环境变量
Cloudflare Pages 的环境变量（AI_API_KEY 等）已经配置在 `wrangler.toml` 中，不需要在 GitHub Actions 中重复配置。

### 2. 构建时间
- 构建时间通常在 2-5 分钟
- 部署到 Cloudflare Pages 通常在 1-2 分钟
- 总耗时约 3-7 分钟

### 3. 多次部署
- 如果在短时间内多次推送，GitHub 会等待当前部署完成后再开始新的部署
- Cloudflare Pages 会保留最近的 20 个部署历史

---

## 🧪 测试自动部署

完成配置后，进行测试：

```bash
# 1. 提交一个小改动
echo "# 测试自动部署" >> README.md
git add README.md
git commit -m "测试 GitHub Actions 自动部署"
git push origin main

# 2. 查看部署状态
# 访问：https://github.com/hanqiushui426-alt/q-avatar/actions

# 3. 等待 5-7 分钟后访问
# https://thepeacock.shop
```

---

## 🔄 手动部署（备用方案）

如果自动部署失败，可以使用命令手动部署：

```bash
cd /root/.openclaw/workspace/project/q-avatar/frontend
npm run build
npx wrangler pages deploy .vercel/output/static --project-name=q-avatar-frontend
```

---

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [wrangler-action 仓库](https://github.com/cloudflare/wrangler-action)

---

*创建时间: 2026-04-02*
