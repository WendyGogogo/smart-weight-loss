#!/bin/bash

# 智能减脂助手 - 部署脚本
# 支持腾讯云 Webify / Gitee Pages / GitHub Pages

echo "🚀 智能减脂助手部署脚本"
echo "========================"

# 检查是否在项目目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 菜单选择
echo ""
echo "请选择部署平台："
echo "1) 腾讯云 Webify (推荐 - 国内访问快)"
echo "2) Gitee Pages (国内免费)"
echo "3) 仅打包 (手动部署)"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 准备部署到腾讯云 Webify..."

        # 检查git
        if ! command -v git &> /dev/null; then
            echo "❌ 请先安装 Git"
            exit 1
        fi

        # 初始化git
        if [ ! -d ".git" ]; then
            echo "📝 初始化 Git 仓库..."
            git init
            git add .
            git commit -m "Initial commit"
        fi

        echo ""
        echo "✅ 本地准备完成！"
        echo ""
        echo "接下来请按以下步骤操作："
        echo ""
        echo "1️⃣ 在 GitHub/GitLab/Gitee 创建新仓库"
        echo "   例如：https://github.com/你的用户名/smart-weight-loss"
        echo ""
        echo "2️⃣ 推送代码到远程仓库："
        echo "   git remote add origin https://github.com/你的用户名/仓库名.git"
        echo "   git push -u origin main"
        echo ""
        echo "3️⃣ 访问腾讯云 Webify："
        echo "   https://webify.cloud.tencent.com"
        echo ""
        echo "4️⃣ 点击「新建应用」→「Git导入」→ 选择你的仓库"
        echo ""
        echo "5️⃣ 构建配置："
        echo "   - 构建命令：留空"
        echo "   - 输出目录：."
        echo ""
        echo "6️⃣ 点击部署，等待完成即可获得国内可访问的链接！"
        echo ""
        ;;

    2)
        echo ""
        echo "📦 准备部署到 Gitee Pages..."

        # 检查git
        if ! command -v git &> /dev/null; then
            echo "❌ 请先安装 Git"
            exit 1
        fi

        # 初始化git
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "Initial commit"
        fi

        echo ""
        echo "✅ 本地准备完成！"
        echo ""
        echo "接下来请按以下步骤操作："
        echo ""
        echo "1️⃣ 访问 Gitee：https://gitee.com"
        echo "   创建新仓库（建议设置为公开）"
        echo ""
        echo "2️⃣ 推送代码："
        echo "   git remote add origin https://gitee.com/你的用户名/仓库名.git"
        echo "   git push -u origin master"
        echo ""
        echo "3️⃣ 在 Gitee 仓库页面："
        echo "   服务 → Gitee Pages → 选择master分支 → 启动"
        echo ""
        echo "4️⃣ 等待部署完成（需要实名认证）"
        echo ""
        ;;

    3)
        echo ""
        echo "📦 打包项目..."

        # 创建部署包
        zip_file="smart-weight-loss-deploy-$(date +%Y%m%d).zip"

        # 排除不需要的文件
        zip -r "$zip_file" . -x "*.git*" -x "*.DS_Store" -x "deploy.sh"

        echo ""
        echo "✅ 打包完成: $zip_file"
        echo ""
        echo "你可以："
        echo "1. 上传到腾讯云 Webify"
        echo "2. 上传到 Netlify Drop"
        echo "3. 上传到 Vercel"
        echo ""
        ;;

    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 完成！"
echo ""
