# JLPT / TOEIC 错题本 PWA

这是一个可部署到 Vercel 的 Vite 前端项目。它包含：

- 首页
- 错题列表
- 标签筛选页
- 错题详情页
- 生词本
- 浏览器发音功能
- 新增错题表单
- 闪卡复习页
- PWA manifest
- Service Worker
- 浅紫星星版桌面图标

## 本地运行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

Vercel 的构建设置：

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Supabase 环境变量

在 Vercel Project Settings → Environment Variables 里添加：

```bash
VITE_SUPABASE_URL=https://bolshysebpzdqvldibyc.supabase.co
VITE_SUPABASE_ANON_KEY=你的 Supabase anon / publishable key
```

未配置环境变量时，页面会使用内置 Demo 数据。

## PWA 安装

部署到 Vercel 后，用 iPhone Safari 打开网站：

1. 点分享按钮
2. 点“添加到主屏幕”
3. 桌面会显示浅紫星星图标

## 文件说明

```text
public/
  manifest.webmanifest
  sw.js
  apple-touch-icon.png
  icons/
    icon-192.png
    icon-512.png
    icon-512-maskable.png

src/
  api.js          Supabase 调用
  main.js         SPA 页面逻辑
  mockData.js     Demo 数据
  speech.js       浏览器发音
  styles.css      UI 样式
```
