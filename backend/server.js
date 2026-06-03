// =========================================================
// Stardew Meal · 像素田园饮食识别后端
// 真实前后端分离 · Node.js + Express + Claude Vision API
// =========================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { recognizeFood, aggregateNutrition, apiStatus } from './services/recognize.js';
import { evaluateMeal } from './services/analysis.js';
import { analyzeDescription, mergePsychIntoEvaluation } from './services/psychology.js';
import { searchFood, getAllFoods, getFoodById } from './data/nutrition.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
// CORS：本地默认全开；线上可用环境变量 FRONTEND_ORIGIN 限制只允许你的前端域名
// 例如在 Render 设置 FRONTEND_ORIGIN=https://your-app.vercel.app
const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态托管前端(方便本地直接访问 http://localhost:3000)
app.use(express.static(path.join(__dirname, '../frontend')));

// =========================================================
// API 状态
// =========================================================
app.get('/api/status', (req, res) => {
  res.json({
    name: 'Stardew Meal API',
    version: '1.0.0',
    api: apiStatus,
    time: new Date().toISOString()
  });
});

// =========================================================
// 食物识别(核心)
// =========================================================
app.post('/api/recognize', async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({
      success: false,
      message: '缺少图片数据 — 未上传图片时不会返回任何识别数据'
    });
  }
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({
      success: false,
      message: '图片格式无效'
    });
  }
  try {
    const result = await recognizeFood(image);
    // 把识别结果聚合成完整食物信息
    const enriched = result.items.map(item => {
      const food = getFoodById(item.id);
      return {
        ...item,
        zh: food?.zh,
        en: food?.en,
        cat: food?.cat,
        unit: food?.unit
      };
    });
    res.json({ ...result, items: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// 食物数据库 — 用户手动增删搜索时使用
// =========================================================
app.get('/api/foods/search', (req, res) => {
  const { q } = req.query;
  res.json(searchFood(q));
});

app.get('/api/foods/all', (req, res) => {
  res.json(getAllFoods());
});

app.get('/api/foods/:id', (req, res) => {
  const food = getFoodById(req.params.id);
  if (!food) return res.status(404).json({ err: 'not found' });
  res.json(food);
});

// =========================================================
// 营养报告生成(严格要求传入 items,禁止无识别数据)
// =========================================================
app.post('/api/report', (req, res) => {
  const { items, imageRef, description } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '禁止在没有食物数据的情况下生成报告'
    });
  }
  // 校验每个 item 都在数据库里
  const validItems = items.filter(it => getFoodById(it.id));
  if (validItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: '所有食物都未匹配到数据库,无法生成真实报告'
    });
  }
  const { totals, detailed } = aggregateNutrition(validItems);
  const evaluation = evaluateMeal(totals, detailed);
  // 进食心理分析 —— 仅当用户主动填写描述时才生成,否则为 null
  const psychReport = analyzeDescription(description);
  // 若有可归类描述,用它覆盖「凭营养数字猜测」的动机与情绪/压力评分,
  // 让报告顶部与用户真实心境一致
  mergePsychIntoEvaluation(evaluation, psychReport);
  const record = {
    id: 'r_' + Date.now(),
    date: new Date().toISOString(),
    items: validItems,
    detailed,
    imageRef: imageRef || null,
    description: (description || '').trim() || null,
    evaluation,
    psychReport
  };
  res.json({ success: true, record });
});

// =========================================================
// 历史记录与月度趋势已移至前端 localStorage(无账号 / 无后端存储)
// 后端仅负责食物识别与报告生成。
// =========================================================

// =========================================================
// 启动
// =========================================================
app.listen(PORT, () => {
  console.log('');
  console.log('  🌾 ===================================================== 🌾');
  console.log('     STARDEW MEAL · 像素田园饮食识别服务');
  console.log('  🌾 ===================================================== 🌾');
  console.log('');
  console.log(`     📡 服务运行: http://localhost:${PORT}`);
  console.log(`     🎨 前端入口: http://localhost:${PORT}/index.html`);
  console.log(`     🤖 识别模式: ${apiStatus.mode}`);
  if (!apiStatus.hasKey) {
    console.log('');
    console.log('     ⚠️  当前为演示模式(mock)');
    console.log('     💡 在 backend/.env 中配置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
    console.log('        即可启用百度菜品识别(免费 500 次/天)');
    console.log('        详细注册步骤见 README.md');
  }
  console.log('');
});
