/**
 * 减脂助手排行榜 - Cloudflare Worker 后端
 *
 * 部署步骤：
 * 1. 访问 https://dash.cloudflare.com
 * 2. Workers & Pages → Create Service
 * 3. 复制此代码到编辑器
 * 4. 添加 KV Namespace: RANKING_DATA
 * 5. 绑定 KV 到 Worker (变量名: RANKING)
 * 6. 保存并部署
 * 7. 复制 Worker URL 到前端代码中使用
 */

// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 获取排行榜数据
      if (path === '/api/ranking' && request.method === 'GET') {
        const data = await getRanking(env.RANKING);
        return jsonResponse(data);
      }

      // 上传/更新用户数据
      if (path === '/api/ranking' && request.method === 'POST') {
        const body = await request.json();
        const result = await updateRanking(env.RANKING, body);
        return jsonResponse(result);
      }

      // 404
      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

// 获取排行榜
async function getRanking(RANKING) {
  // 获取所有数据
  const list = await RANKING.list();
  const rankings = [];

  for (const key of list.keys) {
    const data = await RANKING.get(key.name, { type: 'json' });
    if (data) {
      rankings.push(data);
    }
  }

  // 按锻炼天数排序
  rankings.sort((a, b) => b.exerciseDays - a.exerciseDays);

  // 只返回前 50 名
  return rankings.slice(0, 50).map((item, index) => ({
    rank: index + 1,
    nickname: item.nickname,
    exerciseDays: item.exerciseDays,
    avatar: item.avatar || '👤',
    updatedAt: item.updatedAt
  }));
}

// 更新用户数据
async function updateRanking(RANKING, data) {
  // 验证数据
  if (!data.nickname || data.exerciseDays === undefined) {
    return { error: 'Missing required fields' };
  }

  // 使用昵称作为 key（需要处理特殊字符）
  const key = `user:${sanitizeKey(data.nickname)}`;

  const record = {
    nickname: data.nickname.substring(0, 20), // 限制长度
    exerciseDays: Math.max(0, parseInt(data.exerciseDays) || 0),
    avatar: data.avatar || '👤',
    updatedAt: new Date().toISOString()
  };

  await RANKING.put(key, JSON.stringify(record));

  return { success: true, message: 'Ranking updated' };
}

// 辅助函数：清理 key 中的特殊字符
function sanitizeKey(str) {
  return str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 50);
}

// 辅助函数：返回 JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
