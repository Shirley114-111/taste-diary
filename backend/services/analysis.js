// =========================================================
// 膳食评估服务
// 基于:中国居民膳食指南 2022 / WHO 营养摄入建议
// =========================================================

import { CATEGORY_INFO, getFoodById } from '../data/nutrition.js';

// 每日参考摄入量(成年人,可根据用户数据进一步细化)
const DAILY_REF = {
  cal: 2000, p: 60, c: 250, f: 65, fiber: 25,
  na: 2000, ca: 800, fe: 18, vc: 100
};

/**
 * 评估单餐营养
 * @param {object} totals - 聚合后的营养总量
 * @param {Array} detailed - 详细食物列表
 */
export function evaluateMeal(totals, detailed) {
  const mealTarget = DAILY_REF.cal / 3; // 一餐约 666 kcal
  const ratio = Math.round((totals.cal / mealTarget - 1) * 100);

  // 类别统计 — 用于判断进食动机
  const catCount = {};
  for (const item of detailed) {
    catCount[item.cat] = (catCount[item.cat] || 0) + (item.cal * item.servings);
  }
  // 主导类别(按热量贡献)
  let dominantCat = 'light';
  let maxCal = 0;
  for (const [cat, cal] of Object.entries(catCount)) {
    if (cal > maxCal) { maxCal = cal; dominantCat = cat; }
  }

  // 进食动机判定
  const motive = determineMotive(totals, dominantCat, catCount);
  // 心理评分
  const psy = computePsyScore(totals, dominantCat, motive, detailed);

  // 三大营养素比例
  const calFromP = totals.p * 4;
  const calFromC = totals.c * 4;
  const calFromF = totals.f * 9;
  const totalMacroCal = calFromP + calFromC + calFromF || 1;
  const macroRatio = {
    p: Math.round(calFromP / totalMacroCal * 100),
    c: Math.round(calFromC / totalMacroCal * 100),
    f: Math.round(calFromF / totalMacroCal * 100),
  };

  // 各营养素达成度(占单餐目标)
  const achievement = {
    cal: Math.round(totals.cal / mealTarget * 100),
    p: Math.round(totals.p / (DAILY_REF.p/3) * 100),
    c: Math.round(totals.c / (DAILY_REF.c/3) * 100),
    f: Math.round(totals.f / (DAILY_REF.f/3) * 100),
    fiber: Math.round(totals.fiber / (DAILY_REF.fiber/3) * 100),
    na: Math.round(totals.na / (DAILY_REF.na/3) * 100),
    ca: Math.round(totals.ca / (DAILY_REF.ca/3) * 100),
    fe: Math.round(totals.fe / (DAILY_REF.fe/3) * 100),
    vc: Math.round(totals.vc / (DAILY_REF.vc/3) * 100),
  };

  // 健康提示
  const tips = generateNutritionTips(totals, achievement, macroRatio);

  return {
    totals,
    ratio,           // 热量超标百分比(正=超标,负=不足)
    dominantCat,
    catName: { zh: CATEGORY_INFO[dominantCat]?.zh, en: CATEGORY_INFO[dominantCat]?.en },
    motive,
    psy,
    macroRatio,
    achievement,
    tips,
    dailyRef: DAILY_REF
  };
}

/**
 * 进食动机判定 — 严格按照类别 + 数量,绝不随意猜测
 */
function determineMotive(totals, dominantCat, catCount) {
  const totalCal = totals.cal;
  const friedCal = catCount.fried || 0;
  const sweetCal = catCount.sweet || 0;
  const stressCal = friedCal + sweetCal;

  // 1. 暴饮暴食:单餐 > 1000 kcal
  if (totalCal > 1000) {
    return {
      key: 'binge',
      zh: '焦虑补偿进食',
      en: 'Anxiety-Compensatory Eating',
      desc_zh: '本餐热量明显偏高,可能为焦虑或情绪积压引发的补偿性进食',
      desc_en: 'Notably high caloric intake — may indicate anxiety-driven compensatory eating'
    };
  }

  // 2. 极简代餐:总热量 < 250 kcal
  if (totalCal < 250) {
    return {
      key: 'restrict',
      zh: '身材焦虑性进食',
      en: 'Body-Image Anxiety Eating',
      desc_zh: '本餐热量极低,可能为身材焦虑下的过度限制性进食',
      desc_en: 'Very low caloric intake — possible body-image-driven restriction'
    };
  }

  // 3. 压力代偿:高糖油炸占主导(>50% 热量来自 fried + sweet)
  if (totalCal > 0 && stressCal / totalCal > 0.5) {
    return {
      key: 'stress',
      zh: '压力代偿进食',
      en: 'Stress-Compensatory Eating',
      desc_zh: '本餐以高糖油炸为主,大概率为学业/工作压力引发的代偿性进食',
      desc_en: 'Dominated by fried/sweet foods — likely stress-driven compensatory eating'
    };
  }

  // 4. 平稳健康
  return {
    key: 'healthy',
    zh: '平稳健康进食',
    en: 'Calm Healthy Eating',
    desc_zh: '这是一餐节奏平稳、营养较为均衡的进食,情绪关联度较低',
    desc_en: 'A balanced, calmly-paced meal with low emotional involvement'
  };
}

/**
 * 心理评分 — 基于真实数据计算,非随机
 * 返回 mood (情绪综合分) + stress (压力相关度) + balance (营养均衡度)
 */
function computePsyScore(totals, dominantCat, motive, detailed = []) {
  // 默认中等值
  let mood = 60;
  let stress = 40;

  switch (motive.key) {
    case 'binge':
      mood = 35; stress = 80;
      break;
    case 'restrict':
      mood = 50; stress = 65;
      break;
    case 'stress':
      mood = 45; stress = 72;
      break;
    case 'healthy':
      mood = 78; stress = 25;
      break;
  }

  // =========================================================
  // 营养均衡度 = 宏量营养素比例分(50%)+ 食物多样性分(50%)
  // ---------------------------------------------------------
  // 设计原则:
  //  · 比例用「合理区间」而非单一目标值 —— 落在区间内不扣分,
  //    所以高蛋白(如纯鸡胸)不再被惩罚。
  //  · 多样性看这一餐覆盖了几类营养相关食物(主食/蛋白/蔬果),
  //    「有菜有肉有主食」就能拿高分,贴近「均衡」的直觉。
  // =========================================================

  // ---- (1) 宏量营养素比例分(0~100)----
  // 合理区间(占总热量百分比):蛋白 10~35,碳水 40~65,脂肪 20~35
  // 落在区间内 = 0 偏差;超出区间 = 按超出多少累加偏差。
  const calFromP = totals.p * 4;
  const calFromC = totals.c * 4;
  const calFromF = totals.f * 9;
  const totalMacro = calFromP + calFromC + calFromF || 1;
  const actualP = calFromP / totalMacro * 100;
  const actualC = calFromC / totalMacro * 100;
  const actualF = calFromF / totalMacro * 100;

  const outOfRange = (val, lo, hi) => val < lo ? (lo - val) : (val > hi ? (val - hi) : 0);
  const devP = outOfRange(actualP, 10, 35);
  const devC = outOfRange(actualC, 40, 65);
  const devF = outOfRange(actualF, 20, 35);
  // 偏差求和后乘 1.2 作为扣分力度,封顶 100
  const ratioScore = Math.max(0, 100 - (devP + devC + devF) * 1.2);

  // ---- (2) 食物多样性分(0~100)----
  // 看这一餐覆盖了哪几组营养相关类别。
  const groups = {
    staple: ['staple'],            // 主食(米面薯类)
    protein: ['protein'],          // 优质蛋白(肉蛋豆奶)
    vegfruit: ['veg', 'fruit'],    // 蔬菜水果
  };
  const covered = { staple: false, protein: false, vegfruit: false };
  for (const item of detailed) {
    for (const [g, cats] of Object.entries(groups)) {
      if (cats.includes(item.cat)) covered[g] = true;
    }
  }
  const coveredCount = Object.values(covered).filter(Boolean).length;
  // 覆盖 3 组 = 100,2 组 = 70,1 组 = 40,0 组 = 20
  const diversityMap = { 0: 20, 1: 40, 2: 70, 3: 100 };
  const diversityScore = diversityMap[coveredCount];

  // ---- 综合:两部分各占一半 ----
  const balance = Math.round(
    Math.max(0, Math.min(100, ratioScore * 0.5 + diversityScore * 0.5))
  );

  return { mood, stress, balance };
}

/**
 * 营养健康提示
 */
function generateNutritionTips(totals, achievement, macroRatio) {
  const tips = { zh: [], en: [] };

  if (achievement.cal > 130) {
    tips.zh.push('本餐热量超过单餐建议值的 30%,下一餐可适当减量');
    tips.en.push('This meal exceeds the suggested single-meal calories by 30%+, consider lighter next meal');
  } else if (achievement.cal < 50) {
    tips.zh.push('本餐热量偏低,可适当增加蛋白质或慢碳水');
    tips.en.push('Caloric intake is low, consider adding protein or complex carbs');
  }

  if (achievement.na > 100) {
    tips.zh.push('钠摄入偏高,今日其他餐建议清淡处理');
    tips.en.push('Sodium intake is high, keep other meals lighter today');
  }

  if (achievement.fiber < 30) {
    tips.zh.push('膳食纤维不足,建议下一餐增加蔬果');
    tips.en.push('Low in fiber — add vegetables or fruit to your next meal');
  }

  if (macroRatio.f > 45) {
    tips.zh.push('脂肪比例偏高(>45%),建议适度增加蔬菜与瘦肉');
    tips.en.push('Fat ratio is high (>45%), balance with vegetables and lean protein');
  }

  if (achievement.p < 40) {
    tips.zh.push('蛋白质偏少,可加一个鸡蛋或一份豆腐');
    tips.en.push('Low in protein — consider adding an egg or tofu');
  }

  if (tips.zh.length === 0) {
    tips.zh.push('营养均衡度良好,保持当前节奏 ✨');
    tips.en.push('Good nutritional balance — keep this rhythm ✨');
  }

  return tips;
}
