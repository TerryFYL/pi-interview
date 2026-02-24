#!/bin/bash
set -e

# PI Interview — 一键部署脚本
#
# 用法（两种方式）:
#
#   方式1: 环境变量
#     CLOUDFLARE_API_TOKEN=xxx DEEPSEEK_API_KEY=sk-xxx ./setup.sh
#
#   方式2: 交互式输入
#     ./setup.sh
#
# 前置条件:
#   - 有 Cloudflare 账号（免费）: https://dash.cloudflare.com
#   - 有 DeepSeek API Key（免费额度）: https://platform.deepseek.com
#   - 已安装 Node.js 18+

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   PI Interview — 一键部署            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# --- 1. Collect credentials ---

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "📋 第1步: Cloudflare API Token"
    echo "   获取方式: dash.cloudflare.com → My Profile → API Tokens → Create Token"
    echo "   选择模板: Edit Cloudflare Workers"
    echo ""
    read -rp "   请粘贴 Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    echo ""
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "📋 第2步: DeepSeek API Key"
    echo "   获取方式: platform.deepseek.com → API Keys → 创建"
    echo ""
    read -rp "   请粘贴 DeepSeek API Key: " DEEPSEEK_API_KEY
    echo ""
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "❌ 缺少必要凭证。需要 Cloudflare API Token 和 DeepSeek API Key。"
    exit 1
fi

export CLOUDFLARE_API_TOKEN

# --- 2. Install worker dependencies ---

echo "📦 安装 Worker 依赖..."
cd "$WORKER_DIR"
npm install --silent 2>/dev/null || npm install

# --- 3. Deploy Worker ---

echo "🚀 部署 Worker 后端..."
DEPLOY_OUTPUT=$(npx wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract Worker URL from deploy output
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1)

if [ -z "$WORKER_URL" ]; then
    echo ""
    echo "⚠️  无法自动获取 Worker URL。部署可能成功了，请检查 Cloudflare Dashboard。"
    echo "   如果看到 Worker 已部署，请手动运行:"
    echo "   CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN npx wrangler secret put DEEPSEEK_API_KEY"
    exit 1
fi

echo ""
echo "✅ Worker 部署成功: $WORKER_URL"

# --- 4. Set DeepSeek API Key as Worker secret ---

echo ""
echo "🔑 配置 DeepSeek API Key..."
echo "$DEEPSEEK_API_KEY" | npx wrangler secret put DEEPSEEK_API_KEY 2>&1

echo "✅ API Key 已配置"

# --- 5. Verify ---

echo ""
echo "🔍 验证部署..."
sleep 2

HEALTH_RESPONSE=$(curl -s "${WORKER_URL}/health" 2>/dev/null || echo '{"status":"timeout"}')
echo "   Health check: $HEALTH_RESPONSE"

# --- 6. Summary ---

echo ""
echo "╔══════════════════════════════════════╗"
echo "║           部署完成！                  ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "🌐 Worker API:  $WORKER_URL"
echo "🖥️  前端地址:   https://terryfyl.github.io/pi-interview/"
echo ""
echo "📋 最后一步: 更新前端 API 地址"
echo ""
echo "   方法A（推荐）: 在 GitHub Settings → Secrets → Variables 中设置:"
echo "     WORKER_URL = $WORKER_URL"
echo "   然后 push 或手动触发 Actions 重新部署前端"
echo ""
echo "   方法B（本地）: 编辑 .env.production 文件:"
echo "     echo 'VITE_API_URL=$WORKER_URL' > $SCRIPT_DIR/.env.production"
echo "     cd $SCRIPT_DIR && npm run build && npx gh-pages -d dist"
echo ""
