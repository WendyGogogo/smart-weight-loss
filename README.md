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

### 方式一：腾讯云 Webify（推荐 - 国内访问快）

腾讯云 Webify 专为国内用户提供快速稳定的静态网站托管服务。

1. **准备代码**
   ```bash
   # 进入项目目录
   cd smart-weight-loss-v4
   
   # 初始化Git仓库并提交
   git init
   git add .
   git commit -m "init"
   ```

2. **上传到 GitHub/GitLab/Gitee**
   - 在 GitHub/GitLab/Gitee 创建新仓库
   - 将代码推送到远程仓库
   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. **在腾讯云 Webify 部署**
   - 访问 https://webify.cloud.tencent.com
   - 登录后点击「新建应用」
   - 选择「Git 导入」，授权并选择你的仓库
   - 构建配置：
     - 构建命令：留空（纯静态网站）
     - 输出目录：`.` 或 `./`
   - 点击「部署」，等待完成
   - 获得 `.webify.site` 结尾的域名（国内访问快）

4. **（可选）绑定自定义域名**
   - 在 Webify 控制台添加自定义域名
   - 按提示配置 DNS 解析
   - 国内用户访问速度更快

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

有问题或建议？欢迎反馈！
