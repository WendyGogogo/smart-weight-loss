# 🤖 智能减脂助手 V2

基于用户反馈全面升级的智能减脂管理工具，支持AI食物识别、四类运动快速记录、环形热量缺口仪表盘。

## ✨ 核心特性

### 📊 智能仪表盘
- **双环进度可视化**：外环显示饮食摄入，内环显示运动消耗
- **缺口完成百分比**：直观展示今日热量缺口目标完成度
- **四类运动快捷入口**：热身、力量、核心、有氧一键记录

### 🤖 AI食物识别
- **拍照识别**：自动识别食物并估算热量
- **预留API接口**：支持接入 Claude Vision / Gemini Vision
- **常用食物快捷**：20+常见食物一键添加

### 🏃 四类运动系统
参考您的Apple Watch运动分类：

| 类型 | MET值 | 示例 | 适合场景 |
|------|-------|------|---------|
| 热身 | 3.5 | 爬坡、快走 | 运动前准备 |
| 力量 | 5.5 | 器械、哑铃 | 增肌训练 |
| 核心 | 4.5 | 卷腹、平板 | 腹部训练 |
| 有氧 | 8.5 | 跑步、爬坡 | 燃脂训练 |

### 📱 PWA支持
- **添加到主屏幕**：像原生APP一样使用
- **离线可用**：断网也能记录
- **推送通知**：早晚热量提醒（需授权）

### 🍎 iOS快捷指令（预留）
- 自动同步体重秤数据
- Apple Watch运动数据导入
- 截图识别运动数据

## 🚀 部署方式

> 💡 推荐顺序：Gitee Pages（国内快）> Cloudflare Pages（全球快）> GitHub Pages（简单）

---

### 🥇 方案一：Gitee Pages（国内访问最快 - 免费）

**优点**：国内访问速度最快，完全免费  
**缺点**：需要实名认证

1. 访问 [gitee.com](https://gitee.com) 注册/登录
2. 创建新仓库，命名为 `smart-weight-loss`
3. 上传代码到仓库（或从 GitHub 导入）
4. 进入仓库 →「服务」→「Gitee Pages」
5. 选择部署分支（master/main），点击「启动」
6. 获得 `https://用户名.gitee.io/smart-weight-loss` 链接

**绑定自定义域名（可选）**：
- 在 Gitee Pages 设置中添加你的域名
- 在域名 DNS 添加 CNAME 记录指向 Gitee

---

### 🥈 方案二：Cloudflare Pages（全球快 - 免费）

**优点**：全球访问快（包括中国）、完全免费、自动 HTTPS  
**缺点**：需要科学上网部署

1. 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 登录后点击「Pages」→「Create a project」
3. 连接 GitHub 账号，选择 `smart-weight-loss` 仓库
4. 构建设置：
   - Framework preset: **None**
   - Build command: **留空**
   - Build output directory: `.`
5. 点击「Save and Deploy」
6. 获得 `https://xxx.pages.dev` 链接

**国内访问优化**：
- Cloudflare 在国内有节点，访问速度不错
- 可以绑定自定义域名加速

---

### 🥉 方案三：GitHub Pages（最简单 - 免费）

**优点**：完全免费，无需额外注册，与代码仓库一起管理  
**缺点**：国内访问较慢（可能需要科学上网）

#### 自动部署（推荐）

1. 在你的仓库页面点击「**Settings**」
2. 左侧选择「**Pages**」
3. Source 选择「**Deploy from a branch**」
4. Branch 选择「**main**」，文件夹选择「**/(root)**」
5. 点击「**Save**」，等待 1-2 分钟
6. 访问 `https://wendygogogo.github.io/smart-weight-loss`

#### 自定义域名（可选）

1. 在 Pages 设置中找到「Custom domain」
2. 输入你的域名，如 `weightloss.yourdomain.com`
3. 在你的域名 DNS 添加 CNAME 记录指向 `wendygogogo.github.io`
4. 等待 DNS 生效，启用 HTTPS

---

### 方案四：Netlify Drop（无需注册 - 免费）

**优点**：无需注册账号，拖拽即可部署  
**缺点**：国内访问一般

1. 访问 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 将项目文件夹**拖拽**到网页中
3. 自动部署完成，获得随机域名
4. 可点击「Site settings」→「Change site name」修改域名

---

### 方案五：Surge.sh（命令行 - 免费）

**优点**：命令行部署超快，支持自定义域名  
**缺点**：需要 npm，国内访问一般

```bash
# 安装 surge
npm install -g surge

# 进入项目目录并部署
cd smart-weight-loss-v4
surge

# 按提示操作，自定义域名如：smart-weight-loss.surge.sh
```

---

## 📊 方案对比

| 平台 | 国内速度 | 免费期限 | 自定义域名 | 难度 |
|------|---------|---------|-----------|------|
| **Gitee Pages** | ⭐⭐⭐ 最快 | 永久 | ✅ | 中 |
| **Cloudflare Pages** | ⭐⭐ 较快 | 永久 | ✅ | 中 |
| **GitHub Pages** | ⭐ 一般 | 永久 | ✅ | 低 |
| **Netlify** | ⭐ 一般 | 永久 | ✅ | 低 |
| **腾讯云 CloudBase** | ⭐⭐⭐ 最快 | 6个月 | ✅ | 中 |

## 🎯 推荐选择

- **国内用户使用** → **Gitee Pages**（需要实名认证，但速度最快）
- **全球访问+简单** → **Cloudflare Pages**
- **最简单快速** → **GitHub Pages** 或 **Netlify Drop**

1. 访问 [Vercel](https://vercel.com)
2. 点击「Add New Project」
3. 导入 GitHub 仓库
4. 点击「Deploy」，自动部署完成

### 方式二：Gitee Pages（国内免费）

1. **上传到 Gitee**
   - 注册/登录 https://gitee.com
   - 创建新仓库，上传代码

2. **开启 Gitee Pages**
   - 进入仓库 → 服务 → Gitee Pages
   - 选择部署分支（如 main）
   - 点击「启动」，获得 `.gitee.io` 域名

3. **注意**：免费版 Gitee Pages 需要实名认证

### 方式三：Netlify（国外访问）

1. **访问 Netlify Drop**
   打开：https://app.netlify.com/drop

2. **打包上传**
   ```bash
   zip -r smart-weight-loss.zip .
   ```
   将 zip 文件拖拽到 Netlify 网页

3. **获得域名**
   如 `https://xxx.netlify.app`（国内访问可能较慢）

## 📖 使用指南

### 首次使用
1. 打开「设置」页面
2. 填写身高、年龄、性别
3. 设置目标体重和日期
4. 选择每日热量缺口目标（推荐500kcal）

### 每日记录流程
1. **早晨称重** → 记录体重
2. **餐前拍照** → AI识别热量
3. **运动后** → 快速记录四类运动
4. **查看仪表盘** → 了解缺口完成度

### AI食物识别配置

当前版本使用模拟数据演示，接入真实AI需要：

**方案1：Claude Vision**
1. 获取API Key：https://console.anthropic.com
2. 编辑 `js/ai-recognition.js`
3. 填写 `CLAUDE_API_KEY`

**方案2：Google Gemini**
1. 获取API Key：https://makersuite.google.com
2. 编辑 `js/ai-recognition.js`
3. 填写 `GEMINI_API_KEY`

## 📁 文件结构

```
weight-loss-tracker-v2/
├── index.html              # 主页面
├── manifest.json           # PWA配置
├── css/
│   └── style.css          # 样式（移动端优先）
└── js/
    ├── calculator.js      # 计算工具
    ├── storage.js         # 本地存储
    ├── ai-recognition.js  # AI识别模块
    └── app.js             # 主应用逻辑
```

## 🔄 数据同步方案

### 当前：LocalStorage
- 数据保存在手机浏览器
- 支持导出/导入JSON备份
- 定期导出备份防止丢失

### 未来：云端同步
如需跨设备同步，可：
1. 使用 Netlify Identity + FaunaDB
2. 或迁移到微信小程序云开发
3. 或接入 Firebase

## 📝 更新日志

### V2.0
- ✨ 全新环形仪表盘设计
- 🤖 AI食物识别功能
- 🏃 四类运动快速记录
- 📱 PWA支持
- 🎨 全新UI设计

## 💡 使用建议

1. **每日固定时间称重**：建议早晨空腹
2. **餐前拍照记录**：比餐后更准确
3. **运动及时记录**：避免遗忘
4. **每周导出备份**：防止数据丢失

## 🔒 隐私说明

- 所有数据仅存储在本地
- 图片不上传到任何服务器
- AI识别需要自行配置API Key

---

## 🏆 排行榜后端部署（可选）

排行榜功能默认使用本地演示数据。如需真实排行榜，需要部署 Cloudflare Worker：

### 部署步骤

1. **准备 Cloudflare 账号**
   - 访问 https://dash.cloudflare.com 注册/登录

2. **创建 KV 存储**
   - Workers & Pages → KV
   - 创建 Namespace: `RANKING_DATA`

3. **部署 Worker**
   - Workers & Pages → Create Service
   - 复制 `worker.js` 代码到编辑器
   - 设置 → Variables → KV Namespace Bindings
   - 添加: `RANKING` = `RANKING_DATA`
   - 保存并部署

4. **配置前端**
   - 复制 Worker URL（如 `https://your-worker.your-subdomain.workers.dev`）
   - 修改 `app.js` 中的 API 调用地址

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ranking` | 获取排行榜 |
| POST | `/api/ranking` | 上传/更新数据 |

### POST 请求示例

```json
{
  "nickname": "减脂达人",
  "progress": 75,
  "weightLost": 7.5,
  "avatar": "👤"
}
```

---

有问题或建议？欢迎反馈！
