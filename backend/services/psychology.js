// =========================================================
// 进食心理分析服务
// 仅在用户主动填写「当餐描述」时触发。
// 若描述为空 -> 返回 null,前端不展示心理报告
//   (当下心境无法分析,绝不凭空臆测)
//
// 三大类 / 多子类,完全依据用户描述中的语义线索匹配:
//   1. 生理躯体需求类  physio
//        - gut         肠胃适配(饿了/胃空/正常吃饭/补充能量)
//        - fatPref     喜脂倾向(想吃肉/油/香/重口)
//   2. 情绪代偿类      emotion (假性饥饿)
//        - stress      压力代偿
//        - anxiety     焦虑补食
//        - emptiness   空虚填食
//        - reward      失意犒劳
//   3. 外界诱导类      external
//        - ad          广告诱导
//        - feed        推送种草
//        - package     包装诱食
//        - trend       跟风采食
//        - social      社交聚餐
//   4. 成瘾习惯类      habit
//        - taste       味觉成瘾
//        - inertia     惯性馋食
//        - withdrawal  截断不适
//        - fixation    偏好固化
// =========================================================

// 每个子类:中英文名 + 所属大类 + 关键词(中文 / 英文)
const PATTERNS = [
  // —— 1. 生理躯体需求类 ——
  {
    key: 'gut', group: 'physio',
    zh: '肠胃适配', en: 'Genuine Physical Hunger',
    kw: ['饿', '饥饿', '空腹', '胃空', '没吃', '到饭点', '该吃饭', '补充能量', '体力', '运动后', '锻炼后', '正餐', '按时',
         'hungry', 'starv', 'empty stomach', 'mealtime', 'energy', 'workout', 'after exercise'],
    desc_zh: '描述里出现明确的生理饥饿信号 —— 这更接近身体真实的能量需求,而非情绪驱动。是相对健康的进食起点。',
    desc_en: 'Clear physiological hunger cues — closer to a real energy need than an emotional trigger. A relatively healthy starting point.'
  },
  {
    key: 'fatPref', group: 'physio',
    zh: '喜脂倾向', en: 'Fat / Savory Craving',
    kw: ['想吃肉', '吃肉', '油', '炸', '香', '重口', '解馋', '油腻', '肥', '烧烤', '火锅', '炸鸡', '薯条',
         'meat', 'fried', 'greasy', 'fatty', 'savory', 'crispy', 'bbq', 'hotpot'],
    desc_zh: '对高脂、高香味食物的偏好被明确表达。喜脂是人类天生的能量偏好,适度即可,留意是否在用「香」掩盖其它情绪。',
    desc_en: 'A clear preference for high-fat, savory food. A natural energy bias — fine in moderation; just notice if "tasty" is masking another emotion.'
  },

  // —— 2. 情绪代偿类(假性饥饿) ——
  {
    key: 'stress', group: 'emotion',
    zh: '压力代偿', en: 'Stress Compensation',
    kw: ['压力', '忙', '加班', '熬夜', '赶due', 'ddl', '工作', '学习', '考试', '累', '透支', '喘不过气',
         'stress', 'pressure', 'overtime', 'deadline', 'exam', 'work', 'exhausted', 'overwhelmed'],
    desc_zh: '进食与压力情境紧密相连,可能是身体在用食物缓冲压力。下次压力来临时,可先尝试 3 分钟深呼吸,再决定是否进食。',
    desc_en: 'Eating is tied to a stressful context — food may be buffering the pressure. Next time, try 3 minutes of breathing before deciding to eat.'
  },
  {
    key: 'anxiety', group: 'emotion',
    zh: '焦虑补食', en: 'Anxiety Eating',
    kw: ['焦虑', '紧张', '心慌', '不安', '担心', '害怕', '坐立不安', '烦躁',
         'anxious', 'anxiety', 'nervous', 'worried', 'restless', 'uneasy', 'panic'],
    desc_zh: '焦虑情绪与本餐相关。咀嚼本身能短暂安抚神经,但治标不治本。可记录焦虑触发点,而非只记录食物。',
    desc_en: 'Anxiety is linked to this meal. Chewing briefly soothes the nerves but does not address the source. Try noting the anxiety trigger, not just the food.'
  },
  {
    key: 'emptiness', group: 'emotion',
    zh: '空虚填食', en: 'Filling the Void',
    kw: ['空虚', '无聊', '没事做', '寂寞', '孤独', '一个人', '打发时间', '麻木', '提不起劲',
         'empty', 'bored', 'boredom', 'lonely', 'alone', 'kill time', 'numb', 'meaningless'],
    desc_zh: '食物可能在填补一种「空」的感受。这种空往往不是胃的空,而是心理的留白。试着用一件小事(散步、听歌)替代一次进食。',
    desc_en: 'Food may be filling a sense of emptiness — often not in the stomach but in the mind. Try replacing one such snack with a small act: a walk, a song.'
  },
  {
    key: 'reward', group: 'emotion',
    zh: '失意犒劳', en: 'Consolation Reward',
    kw: ['犒劳', '奖励', '安慰', '难过', '失落', '委屈', '受挫', '不开心', '哭', '低落', '想哭', '心情不好',
         'reward', 'comfort', 'consol', 'sad', 'upset', 'down', 'frustrated', 'cheer myself', 'bad day'],
    desc_zh: '把食物当作对自己的安慰或奖励。善待自己是好事,只是要小心「情绪—进食」长期绑定。也可以用非食物的方式犒劳自己。',
    desc_en: 'Using food to comfort or reward yourself. Self-kindness is good — just watch the long-term "emotion–eating" link. Non-food rewards work too.'
  },

  // —— 3. 外界诱导类 ——
  {
    key: 'ad', group: 'external',
    zh: '广告诱导', en: 'Ad-Induced',
    kw: ['广告', '看到广告', '电视', '海报', '宣传',
         'advert', 'commercial', 'tv ad', 'billboard', 'saw an ad'],
    desc_zh: '进食冲动来自广告刺激。广告擅长制造「即时渴望」,意识到这一点,冲动就已经被削弱了一半。',
    desc_en: 'The urge came from an advertisement. Ads are built to create instant cravings — simply noticing this already halves their pull.'
  },
  {
    key: 'feed', group: 'external',
    zh: '推送种草', en: 'Feed / Recommendation',
    kw: ['种草', '推送', '刷到', '博主', '推荐', '测评', '小红书', '抖音', '探店', '美食视频',
         'recommend', 'influencer', 'feed', 'scrolling', 'review', 'foodie video', 'saw online'],
    desc_zh: '社交媒体的「种草」推动了这次进食。算法会持续投喂诱惑,可主动减少睡前刷美食内容的时间。',
    desc_en: 'A social-media recommendation drove this meal. Algorithms keep feeding temptation — try cutting late-night food browsing.'
  },
  {
    key: 'package', group: 'external',
    zh: '包装诱食', en: 'Packaging Appeal',
    kw: ['包装', '颜值', '好看', '限定', '联名', '新品', '可爱', '设计',
         'packaging', 'cute', 'limited edition', 'collab', 'new flavor', 'looks good'],
    desc_zh: '吸引你的更多是包装/外观而非食物本身。买的是「设计」而非「需求」,可问自己:撕掉包装我还想吃吗?',
    desc_en: 'It was the packaging/look that drew you, more than the food. You bought the design, not the need — ask: would I still want it unwrapped?'
  },
  {
    key: 'trend', group: 'external',
    zh: '跟风采食', en: 'Following a Trend',
    kw: ['跟风', '网红', '排队', '火', '都在吃', '热门', '打卡', '爆款',
         'trend', 'viral', 'hype', 'everyone', 'queue', 'check-in', 'popular'],
    desc_zh: '「大家都在吃」成了进食理由。跟风满足的是从众心理,不妨在排队前先问:这是我真正想吃的吗?',
    desc_en: 'You ate because it is trending. Trend-following satisfies conformity — before queuing, ask if you actually want it.'
  },
  {
    key: 'social', group: 'external',
    zh: '社交聚餐', en: 'Social Dining',
    kw: ['聚餐', '朋友', '同事', '约', '一起吃', '请客', '应酬', '生日', '庆祝', '家庭', '聚会',
         'friends', 'colleague', 'gathering', 'party', 'dinner with', 'celebrat', 'treat', 'social'],
    desc_zh: '这是一次社交情境下的进食。聚餐的核心是关系而非食物,享受相处即可,无需为份量过度自责。',
    desc_en: 'A meal in a social setting. The point is the company, not the food — enjoy the connection without over-blaming portion size.'
  },

  // —— 4. 成瘾习惯类 ——
  {
    key: 'taste', group: 'habit',
    zh: '味觉成瘾', en: 'Taste Addiction',
    kw: ['上瘾', '戒不掉', '停不下来', '一口接一口', '甜', '辣', '咸', '味道', '欲罢不能', '上头',
         'addict', 'can\'t stop', 'crave', 'sweet tooth', 'spicy', 'one more bite', 'hooked'],
    desc_zh: '描述里有「停不下来 / 戒不掉」的味觉依赖信号。高糖高盐高脂会强化奖赏回路,可尝试逐步降低而非立刻断绝。',
    desc_en: 'Signals of taste dependence ("can\'t stop"). Sugar/salt/fat reinforce the reward loop — taper down gradually rather than quitting cold.'
  },
  {
    key: 'inertia', group: 'habit',
    zh: '惯性馋食', en: 'Habitual Craving',
    kw: ['习惯', '每天', '总是', '惯例', '老样子', '顺手', '随手', '到点就',
         'habit', 'usual', 'every day', 'always', 'routine', 'as usual', 'out of habit'],
    desc_zh: '这是一次由习惯驱动的进食,而非当下需求。惯性最难察觉,记录本身就是打破惯性的第一步。',
    desc_en: 'A habit-driven meal, not a present need. Inertia is hardest to notice — and logging it is itself the first step to breaking it.'
  },
  {
    key: 'withdrawal', group: 'habit',
    zh: '截断不适', en: 'Withdrawal Discomfort',
    kw: ['没吃就难受', '不吃不行', '难受', '心痒', '手痒', '戒断', '空落落', '少了点什么',
         'withdrawal', 'feel off', 'need it', 'something missing', 'craving badly'],
    desc_zh: '不吃就会出现不适感,接近轻度的戒断反应。这说明依赖已经形成,可设置「替代仪式」缓冲这种不适。',
    desc_en: 'Discomfort when not eating it — a mild withdrawal response, suggesting dependence has formed. A "replacement ritual" can ease the gap.'
  },
  {
    key: 'fixation', group: 'habit',
    zh: '偏好固化', en: 'Preference Fixation',
    kw: ['只吃', '就爱', '非这个不可', '从不换', '固定', '一直吃这个', '不爱尝试', '挑食',
         'only eat', 'never change', 'always this', 'picky', 'same thing', 'won\'t try'],
    desc_zh: '口味偏好高度固化,选择范围在收窄。偶尔换一种新食物,既是营养上的拓展,也是给生活一点新鲜感。',
    desc_en: 'A highly fixed preference, narrowing your range. Trying one new food now and then broadens nutrition and adds a little freshness.'
  },
];

const GROUP_INFO = {
  physio:   { zh: '生理躯体需求类', en: 'Physical Need' },
  emotion:  { zh: '情绪代偿类(假性饥饿)', en: 'Emotional Compensation' },
  external: { zh: '外界诱导类', en: 'External Inducement' },
  habit:    { zh: '成瘾习惯类', en: 'Habit / Dependence' },
};

/**
 * 分析当餐描述文字
 * @param {string} description 用户自填的当餐描述(可空)
 * @param {string} lang 'zh' | 'en' (仅用于 summary,字段本身双语都返回)
 * @returns {object|null} 心理报告;描述为空时返回 null
 */
export function analyzeDescription(description, lang = 'zh') {
  const text = (description || '').trim();
  // 描述为空 —— 当下心境无法分析,明确返回 null
  if (text.length === 0) return null;

  const lower = text.toLowerCase();

  // 命中统计:每个子类记一次命中权重(出现的关键词数)
  const hits = [];
  for (const p of PATTERNS) {
    let score = 0;
    const matched = [];
    for (const k of p.kw) {
      const kw = k.toLowerCase();
      // 中文直接 includes;英文用 includes(英文关键词本身偏短词根)
      if (lower.includes(kw)) {
        score += 1;
        matched.push(k);
      }
    }
    if (score > 0) {
      hits.push({ ...p, score, matched });
    }
  }

  // 没有任何命中:依然给出报告,但坦诚说明无法定位具体动机
  if (hits.length === 0) {
    return {
      hasInput: true,
      matched: false,
      groups: [],
      primary: null,
      note_zh: '你写下了当餐心境,但其中没有出现可被明确归类的进食动机线索。这并不是坏事 —— 有时进食就只是进食。如果愿意,下次可以多写一点点当时的情绪或情境,我会更懂你。',
      note_en: 'You shared your state of mind, but no clearly classifiable eating-motive cues appeared. That is not a bad thing — sometimes eating is just eating. Next time, a little more about the mood or context will help me understand you better.',
      sourceText: text,
    };
  }

  // 排序:命中权重高的优先;同分时,心理意义更强的大类优先
  // (情绪/成瘾/外界诱导 比 单纯生理需求 更值得作为「主导动机」呈现)
  const GROUP_PRIORITY = { emotion: 3, habit: 3, external: 2, physio: 1 };
  hits.sort((a, b) => {
    const wa = a.score + GROUP_PRIORITY[a.group] * 0.5;
    const wb = b.score + GROUP_PRIORITY[b.group] * 0.5;
    return wb - wa;
  });

  // 按大类聚合
  const byGroup = {};
  for (const h of hits) {
    if (!byGroup[h.group]) {
      byGroup[h.group] = {
        group: h.group,
        zh: GROUP_INFO[h.group].zh,
        en: GROUP_INFO[h.group].en,
        items: []
      };
    }
    byGroup[h.group].items.push({
      key: h.key, zh: h.zh, en: h.en,
      desc_zh: h.desc_zh, desc_en: h.desc_en,
      score: h.score
    });
  }
  const groups = Object.values(byGroup);

  const primary = {
    key: hits[0].key,
    group: hits[0].group,
    groupZh: GROUP_INFO[hits[0].group].zh,
    groupEn: GROUP_INFO[hits[0].group].en,
    zh: hits[0].zh,
    en: hits[0].en,
    desc_zh: hits[0].desc_zh,
    desc_en: hits[0].desc_en,
  };

  return {
    hasInput: true,
    matched: true,
    primary,
    groups,
    sourceText: text,
  };
}

export { GROUP_INFO };

// 各子类对应的「情绪/压力」基线分(供合并进 evaluation 时覆盖动机与评分)
// mood 越高越平稳;stress 越高压力相关度越强
const PSY_BASELINE = {
  // 生理类:相对平稳
  gut:        { mood: 80, stress: 18 },
  fatPref:    { mood: 68, stress: 30 },
  // 情绪代偿类:压力/低落明显
  stress:     { mood: 42, stress: 78 },
  anxiety:    { mood: 40, stress: 80 },
  emptiness:  { mood: 38, stress: 62 },
  reward:     { mood: 48, stress: 60 },
  // 外界诱导类:中性偏可控
  ad:         { mood: 62, stress: 38 },
  feed:       { mood: 60, stress: 40 },
  package:    { mood: 64, stress: 35 },
  trend:      { mood: 62, stress: 40 },
  social:     { mood: 76, stress: 24 },
  // 成瘾习惯类:压力中高、平稳偏低
  taste:      { mood: 50, stress: 58 },
  inertia:    { mood: 55, stress: 45 },
  withdrawal: { mood: 44, stress: 66 },
  fixation:   { mood: 56, stress: 44 },
};

/**
 * 把「描述驱动」的心理结论合并进营养评估结果。
 * 仅当用户填写了可归类的描述时,才用描述的主导动机覆盖
 * 原先「凭营养数字猜测」的进食动机与情绪/压力评分,
 * 让顶部展示与用户真实心境一致。
 * @param {object} evaluation evaluateMeal 的结果(会被就地补充字段)
 * @param {object|null} psych analyzeDescription 的结果
 * @returns {object} evaluation(已合并)
 */
export function mergePsychIntoEvaluation(evaluation, psych) {
  if (!psych || !psych.matched || !psych.primary) {
    // 无描述 / 无法归类 —— 标记动机来源为「营养推断」,不改写
    evaluation.motiveSource = 'nutrition';
    return evaluation;
  }
  const p = psych.primary;
  // 用描述的主导动机覆盖「进食动机判定」
  evaluation.motive = {
    key: p.key,
    zh: p.zh,
    en: p.en,
    desc_zh: p.desc_zh,
    desc_en: p.desc_en,
    group_zh: p.groupZh,
    group_en: p.groupEn,
  };
  evaluation.motiveSource = 'description';

  // 覆盖情绪/压力评分(营养均衡度 balance 保留,它确实来自营养计算)
  const base = PSY_BASELINE[p.key];
  if (base) {
    evaluation.psy = {
      ...evaluation.psy,
      mood: base.mood,
      stress: base.stress,
    };
  }
  return evaluation;
}
