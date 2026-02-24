#!/bin/bash
set -e

# PI Interview — 一键部署脚本
# 用法: ./deploy.sh [backend|frontend|all]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"
FRONTEND_DIR="$SCRIPT_DIR"

deploy_backend() {
    echo "=== 部署 Worker 后端 ==="
    cd "$WORKER_DIR"

    # 检查 wrangler 认证
    if ! npx wrangler whoami &>/dev/null; then
        echo "❌ 未登录 Cloudflare。请先运行: npx wrangler login"
        exit 1
    fi

    # 检查是否有 API key 配置
    echo "📦 部署 Worker..."
    npx wrangler deploy

    WORKER_URL=$(npx wrangler deploy --dry-run 2>&1 | grep -o 'https://[^ ]*workers.dev' | head -1 || true)

    echo ""
    echo "✅ Worker 部署完成！"
    echo ""
    echo "⚠️  如果尚未设置 API key，请运行以下命令之一："
    echo ""
    echo "  方案A（推荐，便宜）: npx wrangler secret put DEEPSEEK_API_KEY"
    echo "  方案B（更强）:       npx wrangler secret put ANTHROPIC_API_KEY"
    echo ""
    echo "获取 DeepSeek API key: https://platform.deepseek.com/api_keys"
    echo ""
}

deploy_frontend() {
    echo "=== 部署前端到 GitHub Pages ==="
    cd "$FRONTEND_DIR"

    # 如果有 Worker URL 参数，设置环境变量
    if [ -n "$WORKER_URL" ]; then
        echo "📡 设置 API URL: $WORKER_URL"
        export VITE_API_URL="$WORKER_URL"
    fi

    echo "📦 构建前端..."
    npm run build

    echo "🚀 发布到 GitHub Pages..."
    npx gh-pages -d dist

    echo ""
    echo "✅ 前端部署完成！"
    echo "🌐 访问: https://terryfyl.github.io/pi-interview/"
}

case "${1:-all}" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo "用法: $0 [backend|frontend|all]"
        exit 1
        ;;
esac
