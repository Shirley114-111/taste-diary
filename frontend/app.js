/* =========================================================
   TASTE DIARY · 前端业务逻辑
   ========================================================= */

// ============ 全局状态 ============
let LANG = localStorage.getItem('sm_lang') || 'zh';
let CURRENT_ITEMS = []; // 当前上传识别后的食材列表
let CURRENT_IMAGE = null; // 当前上传图片 base64
let CURRENT_RECORD = null; // 当前生成的报告
let API_STATUS = null;
let ENCOURAGE_TIMER = null;
let ENCOURAGE_INTERVAL = null;

// ============ i18n ============
const I18N = {
  zh: {
    'boot.sub': '⊹ 食味日记 ⊹',
    'boot.loading': '正在翻开你的日记',
    'boot.diaryFrom': '这是属于你的食味日记<br><span class="leaf-caption-en">This is your own Taste Diary</span>',
    'auth.sub': '⊹ 欢迎来到食味日记 ⊹',
    'auth.nameLabel': '你想让我怎么称呼你?',
    'auth.namePh': '可留空',
    'auth.enter': '进入日记 ▸',
    'auth.login': '登 录',
    'auth.register': '注 册',
    'auth.username': '用户名',
    'auth.password': '密 码',
    'auth.passwordConfirm': '确认密码',
    'auth.signin': '进入日记 ▸',
    'auth.create': '创建日记本 ✿',
    'auth.guest': '► 以访客身份写日记(数据不保存)',
    'auth.logout': '登出',
    'nav.home': '首页',
    'nav.upload': '识别',
    'nav.history': '记录',
    'nav.monthly': '月报',
    'nav.plan': '方案',
    'topbar.hi': 'Hi,',
    'home.greet': '你好,',
    'home.title': '来给今天的一餐<br>留张像素照片吧',
    'home.camera': '📷 拍照 / 上传一餐',
    'home.e1': '开始识别',
    'home.e1d': '拍下一餐看见养分',
    'home.e2': '历史记录',
    'home.e2d': '每一餐都被温柔记得',
    'home.e3': '月度报告',
    'home.e3d': '看见自己慢慢变好',
    'home.e4': '身心方案',
    'home.e4d': '为你定制的温柔建议',
    'home.tip': '今日小贴士',
    'home.feed': '投喂',
    'home.fishLabel': '小鱼干',
    'home.feedOn': '✦ 投喂模式:点小猫或企鹅喂它~',
    'home.feedOff': '吃饱啦,谢谢你 ♥',
    'upload.title': '⊹ 上传餐食照片',
    'upload.sub': '拍下你的一餐 — AI 会识别食物,你也可以手动修正',
    'upload.zone': '▸ 把照片拖进来,或点击下方按钮',
    'upload.hint': '支持 jpg / png / webp · 最大 8MB',
    'upload.pick': '📁 选择图片',
    'upload.camera': '📷 调用摄像头',
    'cam.title': '📷 拍下这一餐',
    'cam.capture': '📸 拍照',
    'cam.retake': '↻ 重拍',
    'cam.use': '✓ 使用这张',
    'cam.cancel': '取消',
    'cam.starting': '正在启动摄像头…',
    'cam.denied': '无法访问摄像头,请检查浏览器权限,或改用「选择图片」。',
    'cam.noDevice': '没有检测到摄像头设备,请改用「选择图片」。',
    'cam.insecure': '摄像头需要 HTTPS 或 localhost 环境才能使用。',
    'upload.items': '▸ 步骤 2 — 确认/修正食材清单',
    'upload.itemsHint': 'AI 识别的结果在下方。点 ✕ 删除,点 +/- 修改份数,搜索关键词添加新食材。',
    'upload.surpriseTip': '✦ 点击食材卡片有惊喜哦 ✦',
    'upload.search': '搜索添加食材:鸡蛋 / 牛肉 / egg ...',
    'upload.showAll': '所有食材',
    'upload.reupload': '↺ 重新上传',
    'upload.report': '✨ 生成营养报告',
    'upload.descLabel': '✎ 写下你这一餐的心境(可选)',
    'upload.descPlaceholder': '例如:今天加班到很晚,实在太累了,想吃点炸的犒劳一下自己…\n\n写下当时的情绪或情境,完成后会生成专属的「进食心理报告」。',
    'upload.descHint': 'ⓘ 不填也没关系 —— 当下心境无法分析时,我们不会臆测你的心理。',
    'report.psychTitle': '进 食 心 理 报 告',
    'report.psychPrimaryLab': '▸ 主导动机',
    'report.psychNoPsych': '本餐未填写当餐描述,因此不生成进食心理报告。当下心境无法分析时,我们选择不臆测。下次想聊聊时,写一句就好。',
    'upload.recognizing': '识别中...请稍候',
    'upload.recognized': '识别完成!',
    'upload.noResult': '未能识别图中食物,请手动添加',
    'upload.tooLarge': '图片过大(最大 8MB)',
    'upload.empty': '请至少添加一种食材',
    'report.title': '⊹ 本次饮食情绪报告',
    'report.physio': '生 理 数 据',
    'report.psy': '心 理 数 据',
    'report.cal': '本餐总热量',
    'report.items': '▸ 食材组成',
    'report.macro': '▸ 三大营养素',
    'report.protein': '蛋白质',
    'report.carb': '碳水',
    'report.fat': '脂肪',
    'report.micro': '▸ 维生素 & 矿物质',
    'report.dataNote': 'ⓘ 数据来源:USDA FoodData Central + 中国食物成分表(GB)。单份典型估算,实际因烹饪方式略有差异。',
    'report.motive': '▸ 进食动机判定',
    'report.mood': '情绪综合评分',
    'report.stress': '压力相关度',
    'report.balance': '营养均衡度',
    'report.analysis': '— 心 理 分 析 —',
    'report.save': '💾 保存到记录',
    'report.close': '✓ 完成',
    'report.saved': '已保存到记录 ✓',
    'report.autoSaved': '已自动保存到记录 ✓',
    'report.alreadySaved': '这条记录已经保存过啦 ✓',
    'report.guestNoSave': '访客模式不保存数据,登录后可永久保存',
    'history.title': '⊹ 历史饮食记录',
    'history.sub': '每一餐都是写给自己的小信件',
    'history.empty': '还没有记录哦~ 上传第一张餐食照片开始吧',
    'history.expired': '登录已过期,请重新登录后查看记录(你的记录仍安全保存在服务器上)',
    'history.del': '确定删除这条记录吗?',
    'history.deleted': '已删除',
    'monthly.title': '⊹ 月度身心趋势',
    'monthly.subtitle': '基于真实历史数据,绝不伪造',
    'monthly.needMore': '累计记录不足 7 餐,无法生成月度趋势',
    'monthly.needMoreDesc': '继续记录至少 {n} 餐,才能看到你的月度变化',
    'monthly.avgCal': '日均热量',
    'monthly.avgMood': '平均情绪',
    'monthly.avgStress': '压力指数',
    'monthly.avgBalance': '营养均衡',
    'monthly.cal': '热量趋势',
    'monthly.mood': '情绪趋势',
    'monthly.stress': '压力趋势',
    'monthly.summary': '📜 给你的小信',
    'plan.title': '⊹ 饮食心理调节方案',
    'plan.sub': '根据你的饮食行为,为你定制的温柔建议 · 每日打卡',
    'plan.t1': '频繁暴食',
    'plan.t2': '过度节食',
    'plan.t3': '作息不规律',
    'plan.progress': '▸ 今日打卡',
    'plan.reset': '重置',
    'plan.achTitle': '今 日 完 成 !',
    'plan.achSub': '你今天好好照顾了自己 ✨<br>明天继续加油哦～',
    'plan.achBtn': '▸ 收 下',
    'enc.title': '★ 给 你 的 一 句 话 ★',
    'enc.close': '关闭',
    'footer.text': '⊹ Taste Diary · 食味日记 · 数据来自 USDA / 中国食物成分表 ⊹',
    'g.loading': '载入中...',
    'g.recognizing': 'AI 正在识别...',
    'g.generating': '生成报告中...',
    'g.saving': '保存中...',
    'err.network': '网络异常,请重试',
    'err.empty': '请先上传图片',
    'err.login': '请先登录',
  },
  en: {
    'boot.sub': '⊹ Taste Diary ⊹',
    'boot.loading': 'INTO THE DIARY',
    'boot.diaryFrom': '这是属于你的食味日记<br><span class="leaf-caption-en">This is your own Taste Diary</span>',
    'auth.sub': '⊹ Welcome to Taste Diary ⊹',
    'auth.nameLabel': 'What should I call you?',
    'auth.namePh': 'Optional — leave blank to skip',
    'auth.enter': 'ENTER DIARY ▸',
    'auth.login': 'LOG IN',
    'auth.register': 'SIGN UP',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.passwordConfirm': 'Confirm Password',
    'auth.signin': 'ENTER DIARY ▸',
    'auth.create': 'CREATE DIARY ✿',
    'auth.guest': '► Visit as guest (data not saved)',
    'auth.logout': 'Log Out',
    'nav.home': 'Home',
    'nav.upload': 'Scan',
    'nav.history': 'Diary',
    'nav.monthly': 'Monthly',
    'nav.plan': 'Plans',
    'topbar.hi': 'Hi,',
    'home.greet': 'Hi, ',
    'home.title': 'Snap a pixel photo<br>of today\'s meal',
    'home.camera': '📷 Snap / Upload Meal',
    'home.e1': 'Start Scan',
    'home.e1d': 'See what\'s on your plate',
    'home.e2': 'My Diary',
    'home.e2d': 'Every meal gently remembered',
    'home.e3': 'Monthly Report',
    'home.e3d': 'Watch yourself grow',
    'home.e4': 'Care Plans',
    'home.e4d': 'Tender plans just for you',
    'home.tip': 'TIP OF THE DAY',
    'home.feed': 'Feed',
    'home.fishLabel': 'dried fish',
    'home.feedOn': '✦ Feeding mode: tap the cat or penguin~',
    'home.feedOff': 'Yummy, thank you ♥',
    'upload.title': '⊹ Upload Your Meal',
    'upload.sub': 'Snap your meal — AI recognises it, and you can edit too',
    'upload.zone': '▸ Drop a photo here, or click below',
    'upload.hint': 'jpg / png / webp · max 8MB',
    'upload.pick': '📁 Pick Image',
    'upload.camera': '📷 Use Camera',
    'cam.title': '📷 Snap This Meal',
    'cam.capture': '📸 Capture',
    'cam.retake': '↻ Retake',
    'cam.use': '✓ Use Photo',
    'cam.cancel': 'Cancel',
    'cam.starting': 'Starting camera…',
    'cam.denied': 'Cannot access the camera. Check browser permissions, or use "Pick Image" instead.',
    'cam.noDevice': 'No camera device found. Please use "Pick Image" instead.',
    'cam.insecure': 'The camera requires an HTTPS or localhost context to work.',
    'upload.items': '▸ Step 2 — Review / edit ingredients',
    'upload.itemsHint': 'AI results below. Tap ✕ to remove, +/- to adjust servings, search to add more.',
    'upload.surpriseTip': '✦ Tap a card for a surprise ✦',
    'upload.search': 'Search to add: egg / beef / 鸡蛋 ...',
    'upload.showAll': 'Show All',
    'upload.reupload': '↺ Re-upload',
    'upload.report': '✨ Generate Report',
    'upload.descLabel': '✎ Describe this meal\'s mood (optional)',
    'upload.descPlaceholder': 'e.g. Worked late tonight and I\'m exhausted, wanted something fried to treat myself…\n\nWrite the emotion or context, and we\'ll generate a personal Eating-Psychology Report.',
    'upload.descHint': 'ⓘ Leaving it blank is fine — when the moment can\'t be read, we won\'t guess your mind.',
    'report.psychTitle': 'E A T I N G   P S Y C H O L O G Y',
    'report.psychPrimaryLab': '▸ PRIMARY MOTIVE',
    'report.psychNoPsych': 'No meal description was provided, so no eating-psychology report is generated. When the moment can\'t be read, we choose not to guess. Write a line next time you feel like sharing.',
    'upload.recognizing': 'Recognising... please wait',
    'upload.recognized': 'Recognition done!',
    'upload.noResult': 'No food recognised, please add manually',
    'upload.tooLarge': 'Image too large (max 8MB)',
    'upload.empty': 'Please add at least one ingredient',
    'report.title': '⊹ Your Meal & Mood Report',
    'report.physio': 'P H Y S I C A L',
    'report.psy': 'P S Y C H O L O G I C A L',
    'report.cal': 'Total Calories',
    'report.items': '▸ INGREDIENTS',
    'report.macro': '▸ MACRONUTRIENTS',
    'report.protein': 'Protein',
    'report.carb': 'Carbs',
    'report.fat': 'Fat',
    'report.micro': '▸ VITAMINS & MINERALS',
    'report.dataNote': 'ⓘ Data: USDA FoodData Central + China Food Composition Table (GB). Typical single-serving estimates, actual varies by cooking method.',
    'report.motive': '▸ EATING MOTIVE',
    'report.mood': 'Mood Score',
    'report.stress': 'Stress Index',
    'report.balance': 'Nutritional Balance',
    'report.analysis': '— P S Y C H  A N A L Y S I S —',
    'report.save': '💾 Save to Diary',
    'report.close': '✓ Done',
    'report.saved': 'Saved to diary ✓',
    'report.autoSaved': 'Auto-saved to diary ✓',
    'report.alreadySaved': 'This entry is already saved ✓',
    'report.guestNoSave': 'Guest mode doesn\'t save data. Log in to save permanently.',
    'history.title': '⊹ Meal History',
    'history.sub': 'Each meal is a little letter to yourself',
    'history.empty': 'No records yet. Upload your first meal photo to begin!',
    'history.expired': 'Session expired. Please log in again to view your records (they are still safely stored on the server).',
    'history.del': 'Delete this record?',
    'history.deleted': 'Deleted',
    'monthly.title': '⊹ Monthly Wellness Trends',
    'monthly.subtitle': 'Based on real data only — never fabricated',
    'monthly.needMore': 'Less than 7 records — cannot generate trends',
    'monthly.needMoreDesc': 'Record at least {n} more meals to see your monthly trends',
    'monthly.avgCal': 'Avg Calories',
    'monthly.avgMood': 'Avg Mood',
    'monthly.avgStress': 'Stress Idx',
    'monthly.avgBalance': 'Balance',
    'monthly.cal': 'Calorie Trend',
    'monthly.mood': 'Mood Trend',
    'monthly.stress': 'Stress Trend',
    'monthly.summary': '📜 A Letter for You',
    'plan.title': '⊹ Eating Psychology Care Plans',
    'plan.sub': 'Gentle plans tailored to your eating behaviour · Daily check-in',
    'plan.t1': 'Binge Eating',
    'plan.t2': 'Restrictive',
    'plan.t3': 'Irregular',
    'plan.progress': '▸ Today',
    'plan.reset': 'Reset',
    'plan.achTitle': 'TODAY  COMPLETE !',
    'plan.achSub': "You took good care of yourself today ✨<br>Keep going tomorrow~",
    'plan.achBtn': '▸ Claim',
    'enc.title': '★ A  L I T T L E  W O R D  ★',
    'enc.close': 'Close',
    'footer.text': '⊹ Taste Diary · Taste Diary · Data: USDA / China GB ⊹',
    'g.loading': 'Loading...',
    'g.recognizing': 'AI recognising...',
    'g.generating': 'Generating report...',
    'g.saving': 'Saving...',
    'err.network': 'Network error, please retry',
    'err.empty': 'Please upload an image first',
    'err.login': 'Please log in',
  }
};

function t(key) { return I18N[LANG][key] || key; }

function applyI18n() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[LANG][key]) el.innerHTML = I18N[LANG][key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (I18N[LANG][key]) el.placeholder = I18N[LANG][key];
  });
  // 切换显示当前语言
  const ls = document.getElementById('langSwitch');
  if (ls) ls.textContent = LANG === 'zh' ? '中 ▸ EN' : 'EN ▸ 中';
}

// ============ API 客户端(仅用于识别/报告等需要后端的功能)============
async function apiCall(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const base = (window.API_BASE || '').replace(/\/$/, '');
  const url = base + path;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('[API]', method, path, e);
    return { ok: false, err: t('err.network') };
  }
}

// ============ 工具函数 ============
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => el.classList.remove('show'), 2400);
}
function gLoad(show, text) {
  const el = document.getElementById('gLoading');
  if (text) document.getElementById('gLoadText').textContent = text;
  el.classList.toggle('active', show);
}

function fmtDate(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  if (LANG === 'zh') {
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============ 开机加载序列(翻书动画)============
function bookPhase(p) {
  const s = document.getElementById('bootScreen');
  if (s) s.dataset.phase = p;
}

async function bootSequence() {
  const bar = document.getElementById('bootBar');
  const stage = document.getElementById('bootScreen');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 1) 合上的书停一下
  bookPhase('closed');
  await sleep(500);

  // 2) 封面翻开
  bookPhase('open');
  await sleep(950);

  // 3) 翻页 + 进度条一起跑
  bookPhase('flip');
  let p = 0;
  await new Promise(resolve => {
    const tick = () => {
      p += Math.random() * 14 + 8;
      if (p >= 100) p = 100;
      if (bar) bar.style.width = p + '%';
      if (p >= 100) { setTimeout(resolve, 250); }
      else setTimeout(tick, 120 + Math.random() * 120);
    };
    tick();
  });
  // 等翻页动画收尾(3 页错峰 0.6s + 单页 0.62s)
  await sleep(650);
}

// 开场停顿:书停在最后一页(欢迎页,非登录)
function bookShowWelcome() {
  bookPhase('login');
  const s = document.getElementById('bootScreen');
  if (s) { s.classList.remove('hide'); s.style.display = 'flex'; }
  // 启动草地野餐场景互动
  startPicnic('boot', { cat: 'picnicCat', peng: 'picnicPeng', catBubble: 'picnicCatBubble', pengBubble: 'picnicPengBubble' });
}

// 收起整本书(进入主应用)
function bookHide() {
  const s = document.getElementById('bootScreen');
  if (!s) return;
  s.classList.add('hide');
  setTimeout(() => { s.style.display = 'none'; }, 520);
}

// ============ 进入应用 ============
function showApp() {
  bookHide();
  document.getElementById('app').style.display = 'block';
  // 显示首页并绑定首页按钮事件(否则首次进入按钮无法点击)
  showPage('home');
  // 加载 API 状态
  loadApiStatus();
  // 唤醒小白猫
  startHeroCat();
  // 唤醒会走动的小企鹅
  startHeroPeng();
  // 启动投喂功能
  setupFeed();
  // 初始化小鱼干计数、亲密等级标签、已达成的形态
  if (window.Companion) {
    Companion.renderFishCount();
    updateBondTags();
    Companion.applyAllForms();
  }
}

// ============ 首页随机动作小白猫 ============
let CAT_TIMER = null;
let CAT_BLINK_TIMER = null;
let CAT_STARTED = false;

const CAT_LINES = {
  zh: ['喵~', '今天吃了什么呀?', '记得好好吃饭哦', '呼噜呼噜…', '陪我玩会儿嘛', '想晒太阳~', '要拍照了吗?', '肚子有点饿了'],
  en: ['Meow~', 'What did you eat?', "Don't skip meals!", 'Purr purr…', 'Play with me~', 'Sunbathing~', 'Photo time?', 'A little hungry']
};

// 不会让猫走到的动作(原地)& 会移动的动作
const CAT_ACTS = ['idle', 'sit', 'stretch', 'loaf', 'jump', 'walk', 'walk'];

function catSetAct(cat, act) {
  cat.dataset.act = act;
  // 移除上一次的一次性动画类后重新触发(jump/stretch 是有限次)
  if (act === 'jump' || act === 'stretch') {
    cat.querySelector('.cat-body').style.animation = 'none';
    // 强制重排后清除,让 CSS 动画重新开始
    void cat.offsetWidth;
    cat.querySelector('.cat-body').style.animation = '';
  }
}

function catSay(cat) {
  const bubble = document.getElementById('catBubble');
  if (!bubble) return;
  const lines = CAT_LINES[LANG] || CAT_LINES.zh;
  bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
  cat.dataset.bubble = '1';
  setTimeout(() => { cat.dataset.bubble = '0'; }, 2200);
}

function catWanderTo(cat) {
  // 在 hero 容器内随机选一个水平位置(留边距)
  const hero = cat.closest('.farm-hero');
  if (!hero) return;
  const maxPct = 78; // 最右到 78%
  const minPct = 4;
  const cur = parseFloat(cat.style.left) || 8;
  let target = minPct + Math.random() * (maxPct - minPct);
  // 避免几乎不动，但也别一次走太远(限制最大跨度)
  if (Math.abs(target - cur) < 12) target = cur > 40 ? cur - 18 : cur + 18;
  const maxStep = 30;
  if (target - cur > maxStep) target = cur + maxStep;
  if (cur - target > maxStep) target = cur - maxStep;
  target = Math.max(minPct, Math.min(maxPct, target));
  // 朝向:向右走不翻转,向左走翻转
  cat.dataset.flip = target < cur ? '1' : '0';
  cat.style.left = target + '%';
}

function catNextAction() {
  const cat = document.getElementById('heroCat');
  if (!cat) return;

  const act = CAT_ACTS[Math.floor(Math.random() * CAT_ACTS.length)];
  catSetAct(cat, act);

  if (act === 'walk') {
    catWanderTo(cat);
    // 走动持续与 CSS left 过渡一致(4.5s),之后坐下
    setTimeout(() => { if (cat.dataset.act === 'walk') catSetAct(cat, 'sit'); }, 4600);
  }

  // 偶尔说句话
  if (Math.random() < 0.35) catSay(cat);

  // 下一次动作:2.5~5.5 秒后
  const delay = 2500 + Math.random() * 3000;
  CAT_TIMER = setTimeout(catNextAction, delay);
}

function catBlinkLoop() {
  const cat = document.getElementById('heroCat');
  if (!cat) return;
  cat.dataset.blink = '1';
  setTimeout(() => { cat.dataset.blink = '0'; }, 160);
  CAT_BLINK_TIMER = setTimeout(catBlinkLoop, 2500 + Math.random() * 3500);
}

function startHeroCat() {
  const cat = document.getElementById('heroCat');
  if (!cat) return;

  // 初始状态
  cat.dataset.act = 'idle';
  cat.dataset.flip = '0';
  cat.dataset.blink = '0';
  cat.dataset.bubble = '0';
  if (!cat.style.left) cat.style.left = '8%';

  // 点击:跳一下 + 说句话
  if (!CAT_STARTED) {
    cat.addEventListener('click', (e) => {
      e.stopPropagation();
      if (FEED_MODE) { feedAnimal(cat, 'catBubble', 'cat'); return; }
      catSetAct(cat, 'jump');
      catSay(cat);
      setTimeout(() => { if (cat.dataset.act === 'jump') catSetAct(cat, 'idle'); }, 1300);
    });
    // 点击草坪空白处:小猫走到点击位置
    const hero = cat.closest('.farm-hero');
    if (hero) {
      hero.addEventListener('click', (e) => {
        if (FEED_MODE) return;
        // 忽略点到猫、企鹅、按钮、入口卡片等可交互元素
        if (e.target.closest('#heroCat, #heroPeng, button, .entry-card, a')) return;
        const rect = hero.getBoundingClientRect();
        let pct = ((e.clientX - rect.left) / rect.width) * 100;
        pct = Math.max(2, Math.min(86, pct));
        const cur = parseFloat(cat.style.left) || 8;
        cat.dataset.flip = pct < cur ? '1' : '0';
        catSetAct(cat, 'walk');
        cat.style.left = pct + '%';
        // 打断随机动作循环,走到后坐下并喵一声
        if (CAT_TIMER) clearTimeout(CAT_TIMER);
        // 按距离估算走路时长(与 4.5s 跨全程过渡保持一致的节奏)
        const dist = Math.abs(pct - cur);
        const walkMs = Math.min(4600, 600 + dist * 50);
        setTimeout(() => {
          if (cat.dataset.act === 'walk') { catSetAct(cat, 'sit'); catSay(cat); }
          CAT_TIMER = setTimeout(catNextAction, 2200);
        }, walkMs);
      });
    }
    CAT_STARTED = true;
  }

  // 清掉旧计时器后重启(避免重复登录时叠加)
  if (CAT_TIMER) clearTimeout(CAT_TIMER);
  if (CAT_BLINK_TIMER) clearTimeout(CAT_BLINK_TIMER);
  CAT_TIMER = setTimeout(catNextAction, 1800);
  CAT_BLINK_TIMER = setTimeout(catBlinkLoop, 2200);
}

// ============ 首页会走动的小企鹅(和猫一样自由溜达)============
let PENG_TIMER = null;
let PENG_BLINK_TIMER = null;
let PENG_STARTED = false;

const PENG_LINES = {
  zh: ['企鹅来啦!', '咕~咕~', '一起散步吧', '今天也要开心鸭', '扑棱扑棱~', '阳光暖暖的', '吃点心了吗?', '欢迎写日记!'],
  en: ['Penguin here!', 'Coo~ coo~', "Let's stroll!", 'Be happy today', 'Flap flap~', 'Warm sunshine', 'Snack time?', 'Write your diary!']
};

// 企鹅动作:会移动的(walk)和原地的(idle / stand)
const PENG_ACTS = ['idle', 'stand', 'walk', 'walk', 'walk'];

function pengSetAct(peng, act) {
  peng.dataset.act = act;
  if (act === 'hop') {
    peng.querySelector('.peng-body').style.animation = 'none';
    void peng.offsetWidth;
    peng.querySelector('.peng-body').style.animation = '';
  }
}

function pengSay(peng) {
  const bubble = document.getElementById('pengBubble');
  if (!bubble) return;
  const lines = PENG_LINES[LANG] || PENG_LINES.zh;
  bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
  peng.dataset.bubble = '1';
  setTimeout(() => { peng.dataset.bubble = '0'; }, 2200);
}

function pengWanderTo(peng) {
  const hero = peng.closest('.farm-hero');
  if (!hero) return;
  const maxPct = 84;
  const minPct = 6;
  const cur = parseFloat(peng.style.left) || 70;
  // 每次只在当前位置附近小幅移动(±12~30%),不再全场乱窜
  const dir = Math.random() < 0.5 ? -1 : 1;
  const step = 12 + Math.random() * 18;
  let target = cur + dir * step;
  if (target < minPct || target > maxPct) target = cur - dir * step;
  target = Math.max(minPct, Math.min(maxPct, target));
  peng.dataset.flip = target < cur ? '1' : '0';
  peng.style.left = target + '%';
}

function pengNextAction() {
  const peng = document.getElementById('heroPeng');
  if (!peng) return;

  const act = PENG_ACTS[Math.floor(Math.random() * PENG_ACTS.length)];
  pengSetAct(peng, act);

  if (act === 'walk') {
    pengWanderTo(peng);
    // 走动持续 3.6s(与 CSS left 过渡一致),之后站定 + 检查是否和猫碰面
    setTimeout(() => {
      if (peng.dataset.act === 'walk') pengSetAct(peng, 'stand');
      maybeGreetCat(peng);
    }, 3700);
  }

  if (Math.random() < 0.3) pengSay(peng);

  const delay = 4200 + Math.random() * 3500;
  PENG_TIMER = setTimeout(pengNextAction, delay);
}

// 猫和企鹅走近时互相打招呼(增强趣味)
function maybeGreetCat(peng) {
  const cat = document.getElementById('heroCat');
  if (!cat) return;
  const pengX = parseFloat(peng.style.left) || 70;
  const catX = parseFloat(cat.style.left) || 8;
  if (Math.abs(pengX - catX) <= 14) {
    // 企鹅说「你好」,猫回应一句,各自冒爱心
    const greetPeng = LANG === 'zh' ? '嗨,猫猫!♥' : 'Hi kitty! ♥';
    const greetCat = LANG === 'zh' ? '喵~你好呀 ♥' : 'Meow~ hi! ♥';
    const pb = document.getElementById('pengBubble');
    const cb = document.getElementById('catBubble');
    if (pb) { pb.textContent = greetPeng; peng.dataset.bubble = '1'; setTimeout(() => peng.dataset.bubble = '0', 2200); }
    if (cb) { cb.textContent = greetCat; cat.dataset.bubble = '1'; setTimeout(() => cat.dataset.bubble = '0', 2200); }
    // 朝向对方
    peng.dataset.flip = catX < pengX ? '1' : '0';
    cat.dataset.flip = pengX < catX ? '1' : '0';
  }
}

function pengBlinkLoop() {
  const peng = document.getElementById('heroPeng');
  if (!peng) return;
  peng.dataset.blink = '1';
  setTimeout(() => { peng.dataset.blink = '0'; }, 150);
  PENG_BLINK_TIMER = setTimeout(pengBlinkLoop, 2800 + Math.random() * 3500);
}

function startHeroPeng() {
  const peng = document.getElementById('heroPeng');
  if (!peng) return;

  peng.dataset.act = 'idle';
  peng.dataset.flip = '0';
  peng.dataset.blink = '0';
  peng.dataset.bubble = '0';
  if (!peng.style.left) peng.style.left = '70%';

  if (!PENG_STARTED) {
    peng.addEventListener('click', (e) => {
      e.stopPropagation();
      if (FEED_MODE) { feedAnimal(peng, 'pengBubble', 'peng'); return; }
      pengSetAct(peng, 'hop');
      pengSay(peng);
      setTimeout(() => { if (peng.dataset.act === 'hop') pengSetAct(peng, 'idle'); }, 1400);
    });
    PENG_STARTED = true;
  }

  if (PENG_TIMER) clearTimeout(PENG_TIMER);
  if (PENG_BLINK_TIMER) clearTimeout(PENG_BLINK_TIMER);
  PENG_TIMER = setTimeout(pengNextAction, 2200);
  PENG_BLINK_TIMER = setTimeout(pengBlinkLoop, 2600);
}

// ============ 投喂小伙伴 ============
let FEED_MODE = false;
let FEED_STARTED = false;

const FEED_LINES = {
  cat: {
    zh: ['呼噜呼噜 ♥', '好好吃喵~', '最喜欢你了!', '再来一条嘛~', '喵呜,满足'],
    en: ['Purr purr ♥', 'So yummy~', 'I love you!', 'One more please~', 'Meow, full!']
  },
  peng: {
    zh: ['咕咕!好吃 ♥', '谢谢你呀~', '扑棱扑棱开心', '再喂一口?', '嗝~饱啦']
    , en: ['Coo! yummy ♥', 'Thank you~', 'Happy flap flap', 'One more bite?', 'Burp~ full!']
  }
};

function setFeedMode(on) {
  FEED_MODE = on;
  const btn = document.getElementById('feedBtn');
  const hero = document.querySelector('.farm-hero');
  if (btn) btn.classList.toggle('active', on);
  if (hero) hero.classList.toggle('feed-mode', on);
  if (on) toast(t('home.feedOn'), 'ok');
}

// 在动物头顶冒爱心
function spawnHearts(el) {
  const hero = el.closest('.farm-hero');
  if (!hero) return;
  const rect = el.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const cx = rect.left - hr.left + rect.width / 2;
  const cy = rect.top - hr.top;
  for (let i = 0; i < 3; i++) {
    const h = document.createElement('div');
    h.className = 'feed-heart';
    h.textContent = '♥';
    h.style.left = (cx + (i - 1) * 12) + 'px';
    h.style.top = cy + 'px';
    h.style.animationDelay = (i * 0.12) + 's';
    hero.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }
}

// 喂食:扣小鱼干 + 增加亲密度 + 冒爱心 + 满足台词,可能触发升级/变身
function feedAnimal(el, bubbleId, kind) {
  // 没有小鱼干则提示并退出
  if (window.Companion && Companion.getFish() <= 0) {
    toast(LANG === 'en' ? 'No dried fish! Complete a care plan to earn one.' : '没有小鱼干啦~ 完成一条饮食心理调节方案就能获得一个哦', 'warn');
    setFeedMode(false);
    return;
  }

  var result = window.Companion ? Companion.feed(kind) : { ok: true, reason: 'fed', leveled: false };

  el.dataset.act = kind === 'cat' ? 'jump' : 'hop';
  el.dataset.feed = '1';
  spawnHearts(el);
  const lines = (FEED_LINES[kind] && FEED_LINES[kind][LANG]) || FEED_LINES[kind].zh;
  const txt = lines[Math.floor(Math.random() * lines.length)];
  const bubble = document.getElementById(bubbleId);
  if (bubble) {
    bubble.textContent = txt;
    el.dataset.bubble = '1';
    setTimeout(() => { el.dataset.bubble = '0'; }, 2200);
  }
  setTimeout(() => {
    el.dataset.feed = '0';
    el.dataset.act = 'idle';
  }, 1300);
  setFeedMode(false);

  // 刷新小鱼干计数与等级显示
  if (window.Companion) {
    Companion.renderFishCount();
    updateBondTags();
    // 升级 -> 应用形态 + 弹升级动画
    if (result && result.leveled) {
      if (result.evolved) Companion.applyForm(kind);
      setTimeout(function () {
        Companion.showLevelUp({
          kind: kind,
          fromLevel: result.fromLevel,
          toLevel: result.toLevel,
          evolved: result.evolved
        });
      }, 700);
    }
  }
}

// 小鱼干从打卡处飞向首页徽章方向的小反馈
function flyFishToHome(fromX, fromY) {
  var fish = document.createElement('div');
  fish.className = 'fish-fly';
  fish.textContent = '🐟';
  fish.style.left = fromX + 'px';
  fish.style.top = fromY + 'px';
  document.body.appendChild(fish);
  var badge = document.getElementById('fishBadge');
  var tx = window.innerWidth - 80, ty = 80;
  if (badge) {
    var r = badge.getBoundingClientRect();
    tx = r.left + r.width / 2; ty = r.top + r.height / 2;
  }
  requestAnimationFrame(function () {
    fish.style.transform = 'translate(' + (tx - fromX) + 'px,' + (ty - fromY) + 'px) scale(.5)';
    fish.style.opacity = '0';
  });
  setTimeout(function () { fish.remove(); }, 800);
}

// 更新两只动物头顶的亲密等级标签
function updateBondTags() {
  if (!window.Companion) return;
  ['cat', 'peng'].forEach(function (kind) {
    var p = Companion.progress(kind);
    var lvEl = document.querySelector('[data-bond-lv="' + kind + '"]');
    if (lvEl) lvEl.textContent = 'Lv' + p.level + (p.isMax ? ' ★' : '');
  });
}

function setupFeed() {
  const btn = document.getElementById('feedBtn');
  if (!btn || FEED_STARTED) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setFeedMode(!FEED_MODE);
  });
  FEED_STARTED = true;
}

// ============ 草地野餐场景(可互动企鹅 + 小猫)============
const PICNIC_LINES = {
  cat: {
    zh: ['喵~', '一起野餐吧!', '这块三明治给你~', '今天天气真好', '呼噜呼噜…', '想晒太阳~', '番茄好吃!', '陪我玩会儿嘛'],
    en: ['Meow~', "Let's picnic!", 'Sandwich for you~', 'Lovely day!', 'Purr purr…', 'Sunbathing~', 'Yummy tomato!', 'Play with me']
  },
  peng: {
    zh: ['企鹅来啦!', '冰镇果汁?', '咕~咕~', '一起吃点心吧', '今天也要开心鸭', '扑棱扑棱~', '阳光暖暖的', '欢迎来到食味日记!'],
    en: ['Penguin here!', 'Cold juice?', 'Coo~ coo~', 'Snack time!', 'Be happy today', 'Flap flap~', 'Warm sunshine', 'Welcome to Taste Diary!']
  }
};

let PICNIC_STARTED = {};
let PICNIC_BLINK = {};

function picnicShowBubble(bubbleId, text) {
  const b = document.getElementById(bubbleId);
  if (!b) return;
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove('show'), 2000);
}

function pokePicnicCat(catId, bubbleId) {
  const cat = document.getElementById(catId);
  if (!cat) return;
  cat.dataset.poke = '1';
  setTimeout(() => { cat.dataset.poke = '0'; }, 520);
  const lines = PICNIC_LINES.cat[LANG] || PICNIC_LINES.cat.zh;
  picnicShowBubble(bubbleId, lines[Math.floor(Math.random() * lines.length)]);
}

function pokePicnicPeng(pengId, bubbleId) {
  const peng = document.getElementById(pengId);
  if (!peng) return;
  peng.dataset.poke = '1';
  setTimeout(() => { peng.dataset.poke = '0'; }, 520);
  const lines = PICNIC_LINES.peng[LANG] || PICNIC_LINES.peng.zh;
  picnicShowBubble(bubbleId, lines[Math.floor(Math.random() * lines.length)]);
}

function picnicCatBlinkLoop(key, catId) {
  const cat = document.getElementById(catId);
  if (cat) {
    cat.dataset.blink = '1';
    setTimeout(() => { cat.dataset.blink = '0'; }, 150);
  }
  PICNIC_BLINK[key] = setTimeout(() => picnicCatBlinkLoop(key, catId), 2600 + Math.random() * 3200);
}

// key: 唯一标识; ids: { cat, peng, catBubble, pengBubble }
function startPicnic(key, ids) {
  const cat = document.getElementById(ids.cat);
  const peng = document.getElementById(ids.peng);
  if (!cat || !peng) return;
  if (!PICNIC_STARTED[key]) {
    const bind = (el, fn) => {
      el.addEventListener('click', fn);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
    };
    bind(cat, () => pokePicnicCat(ids.cat, ids.catBubble));
    bind(peng, () => pokePicnicPeng(ids.peng, ids.pengBubble));
    PICNIC_STARTED[key] = true;
    if (PICNIC_BLINK[key]) clearTimeout(PICNIC_BLINK[key]);
    PICNIC_BLINK[key] = setTimeout(() => picnicCatBlinkLoop(key, ids.cat), 2400);
    // 入场招呼一次
    setTimeout(() => {
      const l = PICNIC_LINES.peng[LANG] || PICNIC_LINES.peng.zh;
      picnicShowBubble(ids.pengBubble, l[l.length - 1]);
    }, 800);
  }
}

async function loadApiStatus() {
  const s = await apiCall('GET', '/api/status');
  API_STATUS = s.api;
  const bar = document.getElementById('apiStatusBar');
  if (s.api && !s.api.hasKey) {
    bar.classList.add('show');
    bar.innerHTML = LANG === 'zh'
      ? '⚠️ 当前为 <b>演示模式(Mock)</b> — 未配置 ANTHROPIC_API_KEY。识别会返回示例数据。'
        + '配置后即可启用真实的 Claude Vision 食物识别。'
      : '⚠️ Currently in <b>Demo Mode (Mock)</b> — ANTHROPIC_API_KEY not configured. '
        + 'Recognition returns sample data. Configure the key to enable real Claude Vision recognition.';
  } else {
    bar.classList.remove('show');
  }
}

// ============ 欢迎页语言切换(登录系统已移除)============
function setupWelcomeLang() {
  const authLang = document.getElementById('authLangSwitch');
  if (authLang) {
    authLang.onclick = () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      localStorage.setItem('sm_lang', LANG);
      applyI18n();
      authLang.textContent = LANG === 'zh' ? '中 ▸ EN' : 'EN ▸ 中';
    };
    authLang.textContent = LANG === 'zh' ? '中 ▸ EN' : 'EN ▸ 中';
  }
}

// ============ 顶部按钮 ============
function setupTopbar() {
  document.getElementById('langSwitch').onclick = () => {
    LANG = LANG === 'zh' ? 'en' : 'zh';
    localStorage.setItem('sm_lang', LANG);
    applyI18n();
    // 重新渲染当前页(部分内容是 JS 生成的)
    renderHome();
    loadApiStatus();
    const activePage = document.querySelector('.page.active')?.id;
    if (activePage === 'page-history') renderHistory();
    if (activePage === 'page-monthly') renderMonthly();
    if (activePage === 'page-plan') {
      const tab = document.querySelector('.plan-tab.active');
      if (tab) renderPlan(tab.dataset.plan);
    }
  };

  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => showPage(item.dataset.page);
  });

  document.getElementById('logoBtn').onclick = () => showPage('home');
}

// ============ 页面切换 ============
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === name);
  });

  // 各页面加载
  if (name === 'home') renderHome();
  if (name === 'upload') resetUpload();
  if (name === 'history') renderHistory();
  if (name === 'monthly') renderMonthly();
  if (name === 'plan') {
    const tab = document.querySelector('.plan-tab.active') || document.querySelector('.plan-tab');
    if (tab) {
      document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPlan(tab.dataset.plan);
    }
  }

  // 滚到顶
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 首页 ============
const DAILY_TIPS_ZH = [
  '一餐里加一种颜色不同的蔬菜,营养就翻倍啦 🥬',
  '吃饭前喝一小杯温水,胃口会更平静',
  '细嚼慢咽 20 次,大脑才能感受到「饱」的信号',
  '不要在情绪激动时进食,先深呼吸三次再开始',
  '蛋白质放在主食前吃,血糖波动更小',
  '每天一把坚果,皮肤会感谢你',
  '一周吃三次深海鱼,头脑会更清醒',
  '黑暗中进食会让你不知不觉吃多,开灯吧',
  '一日三餐间隔 4-5 小时最舒服',
  '允许自己偶尔吃喜欢的食物,完美主义会让人崩溃',
];
const DAILY_TIPS_EN = [
  'Add one differently-coloured veggie — nutrition doubles 🥬',
  'A small cup of warm water before meals calms your appetite',
  'Chew 20 times — your brain needs time to feel "full"',
  'Don\'t eat in a stormy mood. Take three deep breaths first',
  'Eat protein before carbs — gentler on your blood sugar',
  'A handful of nuts daily, and your skin will thank you',
  'Deep-sea fish 3x a week sharpens your mind',
  'Eating in darkness makes you overeat. Turn the light on',
  '4-5 hours between meals feels just right',
  'Let yourself enjoy what you love sometimes. Perfectionism breaks people',
];

function renderHome() {
  // 首页问候:显示本地昵称,没有则用默认称呼
  const heroEl = document.getElementById('heroName');
  if (heroEl) {
    const nm = Store.getName();
    heroEl.textContent = nm || (LANG === 'zh' ? '朋友' : 'friend');
  }
  // 今日 tip
  const tips = LANG === 'zh' ? DAILY_TIPS_ZH : DAILY_TIPS_EN;
  const today = new Date();
  const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % tips.length;
  document.getElementById('dailyTip').textContent = tips[idx];

  // 大相机按钮
  document.getElementById('bigCameraBtn').onclick = () => showPage('upload');
  document.querySelectorAll('.entry-card').forEach(card => {
    card.onclick = () => showPage(card.dataset.page);
  });
}

// ============ 上传流程 ============
function resetUpload() {
  CURRENT_IMAGE = null;
  CURRENT_ITEMS = [];
  document.getElementById('uploadPreview').classList.remove('show');
  document.getElementById('previewImg').src = '';
  const descBox = document.getElementById('mealDesc');
  if (descBox) descBox.value = '';
  const row = document.getElementById('uploadMainRow');
  if (row) row.classList.remove('has-image');
  document.getElementById('recognizeStatus').style.display = 'none';
  document.getElementById('foodListPanel').style.display = 'none';
}

function setupUpload() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const cameraInput = document.getElementById('cameraInput');

  document.getElementById('btnPickFile').onclick = (e) => { e.stopPropagation(); fileInput.click(); };
  document.getElementById('btnUseCamera').onclick = (e) => { e.stopPropagation(); openCamera(); };
  document.getElementById('btnRemoveImg').onclick = (e) => {
    e.stopPropagation();
    resetUpload();
  };

  fileInput.onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f); };
  cameraInput.onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f); };

  // 拖拽
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // 点击空白区域也能上传
  zone.addEventListener('click', e => {
    // 只有点击到空白处才触发(避免按钮重复触发)
    if (e.target === zone || e.target.classList.contains('upload-title') ||
        e.target.classList.contains('upload-hint') || e.target.classList.contains('upload-scarecrow') ||
        e.target.closest('.upload-scarecrow')) {
      fileInput.click();
    }
  });

  // 食材清单操作
  document.getElementById('btnReupload').onclick = resetUpload;
  document.getElementById('btnGenerateReport').onclick = generateReport;

  // 搜索
  document.getElementById('foodSearch').oninput = e => searchFoods(e.target.value);
  document.getElementById('btnShowAll').onclick = () => showAllFoods();

  // 摄像头弹窗控制
  document.getElementById('camCancel').onclick = closeCamera;
  document.getElementById('camCapture').onclick = captureCamera;
  document.getElementById('camRetake').onclick = retakeCamera;
  document.getElementById('camUse').onclick = useCameraShot;
  document.getElementById('camOverlay').addEventListener('click', e => {
    if (e.target.id === 'camOverlay') closeCamera();
  });
}

// ============ 摄像头 ============
let CAM_STREAM = null;

async function openCamera() {
  const overlay = document.getElementById('camOverlay');
  const video = document.getElementById('camVideo');
  const shot = document.getElementById('camShot');
  const msg = document.getElementById('camMsg');
  const btnCapture = document.getElementById('camCapture');
  const btnRetake = document.getElementById('camRetake');
  const btnUse = document.getElementById('camUse');

  // 重置 UI
  overlay.style.display = 'flex';
  video.style.display = 'block';
  shot.style.display = 'none';
  shot.src = '';
  btnCapture.style.display = '';
  btnRetake.style.display = 'none';
  btnUse.style.display = 'none';
  msg.style.display = 'block';
  msg.textContent = t('cam.starting');

  // 环境检查:getUserMedia 需要安全上下文 (https 或 localhost)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const reason = window.isSecureContext ? t('cam.noDevice') : t('cam.insecure');
    msg.textContent = reason;
    toast(reason, 'err');
    return;
  }

  try {
    CAM_STREAM = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = CAM_STREAM;
    await video.play().catch(() => {});
    msg.style.display = 'none';
  } catch (err) {
    let reason = t('cam.denied');
    if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.name === 'OverconstrainedError')) {
      reason = t('cam.noDevice');
    }
    msg.textContent = reason;
    toast(reason, 'err');
    stopCamera();
  }
}

function stopCamera() {
  if (CAM_STREAM) {
    CAM_STREAM.getTracks().forEach(tr => tr.stop());
    CAM_STREAM = null;
  }
  const video = document.getElementById('camVideo');
  if (video) video.srcObject = null;
}

function closeCamera() {
  stopCamera();
  document.getElementById('camOverlay').style.display = 'none';
}

function captureCamera() {
  const video = document.getElementById('camVideo');
  const canvas = document.getElementById('camCanvas');
  const shot = document.getElementById('camShot');
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(video, 0, 0, w, h);
  shot.src = canvas.toDataURL('image/jpeg', 0.9);

  video.style.display = 'none';
  shot.style.display = 'block';
  document.getElementById('camCapture').style.display = 'none';
  document.getElementById('camRetake').style.display = '';
  document.getElementById('camUse').style.display = '';
}

function retakeCamera() {
  const video = document.getElementById('camVideo');
  const shot = document.getElementById('camShot');
  video.style.display = 'block';
  shot.style.display = 'none';
  shot.src = '';
  document.getElementById('camCapture').style.display = '';
  document.getElementById('camRetake').style.display = 'none';
  document.getElementById('camUse').style.display = 'none';
}

function useCameraShot() {
  const canvas = document.getElementById('camCanvas');
  canvas.toBlob(blob => {
    closeCamera();
    if (blob) {
      const file = new File([blob], `meal-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFile(file);
    }
  }, 'image/jpeg', 0.9);
}

async function handleFile(file) {
  if (file.size > 8 * 1024 * 1024) {
    toast(t('upload.tooLarge'), 'err');
    return;
  }
  // 转 base64
  const reader = new FileReader();
  reader.onload = async () => {
    CURRENT_IMAGE = reader.result;
    document.getElementById('previewImg').src = CURRENT_IMAGE;
    document.getElementById('uploadPreview').classList.add('show');
    const row = document.getElementById('uploadMainRow');
    if (row) row.classList.add('has-image');
    await recognizeImage();
  };
  reader.readAsDataURL(file);
}

async function recognizeImage() {
  if (!CURRENT_IMAGE) return;
  const statusEl = document.getElementById('recognizeStatus');
  const rsText = document.getElementById('rsText');
  statusEl.style.display = 'block';
  rsText.textContent = t('upload.recognizing');
  document.getElementById('foodListPanel').style.display = 'none';

  const r = await apiCall('POST', '/api/recognize', { image: CURRENT_IMAGE });
  statusEl.style.display = 'none';

  if (!r.success) {
    toast(r.message || t('upload.noResult'), 'err');
    // 仍然显示空清单让用户手动添加
    CURRENT_ITEMS = [];
    showFoodPanel(r.mode || 'error', r.message || '');
    return;
  }

  CURRENT_ITEMS = (r.items || []).map(it => ({
    id: it.id,
    servings: it.servings || 1,
    zh: it.zh,
    en: it.en,
    cat: it.cat,
    unit: it.unit,
    // 营养数据（弹窗用）—— 先填后端给的，没给的下面补
    cal: it.cal,
    p: it.p,
    c: it.c,
    f: it.f,
    fiber: it.fiber,
    na: it.na,
    ca: it.ca,
    fe: it.fe,
    vc: it.vc
  }));

  // 后端 /api/recognize 不一定返回营养字段, 缺失则单独补
  await Promise.all(CURRENT_ITEMS.map(async (it) => {
    if (it.cal != null) return; // 已经有了, 跳过
    try {
      const f = await apiCall('GET', '/api/foods/' + it.id);
      if (f && !f.err) {
        it.cal = f.cal; it.p = f.p; it.c = f.c; it.f = f.f;
        it.fiber = f.fiber; it.na = f.na; it.ca = f.ca; it.fe = f.fe; it.vc = f.vc;
      }
    } catch (e) {}
  }));

  if (CURRENT_ITEMS.length === 0) {
    toast(t('upload.noResult'), 'err');
  } else {
    toast(t('upload.recognized'), 'ok');
  }
  showFoodPanel(r.mode || 'unknown', r.message || '');
}

function showFoodPanel(mode, message) {
  document.getElementById('foodListPanel').style.display = 'block';
  // 模式标识
  const tag = document.getElementById('apiModeTag');
  if (mode === 'claude-vision') {
    tag.textContent = LANG === 'zh' ? '✓ AI 真实识别' : '✓ AI Recognition';
    tag.className = 'api-mode-tag';
  } else if (mode === 'mock') {
    tag.textContent = LANG === 'zh' ? '⚠ 演示数据' : '⚠ Demo Data';
    tag.className = 'api-mode-tag mock';
  } else {
    tag.textContent = LANG === 'zh' ? '手动添加' : 'Manual';
    tag.className = 'api-mode-tag mock';
  }
  renderFoodItems();
  // 滚动到清单面板
  setTimeout(() => {
    document.getElementById('foodListPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function renderFoodItems() {
  const wrap = document.getElementById('foodItems');
  if (CURRENT_ITEMS.length === 0) {
    wrap.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--ink2);padding:20px;font-family:'VT323',monospace;font-size:18px">
      ${LANG === 'zh' ? '清单是空的,请在下方搜索添加食材' : 'List is empty — search below to add ingredients'}
    </div>`;
    return;
  }
  wrap.innerHTML = CURRENT_ITEMS.map((item, i) => {
    const name = LANG === 'zh' ? item.zh : item.en;
    const icon = pixelFoodIcon(item.cat);
    const catClass = catColorClass(item.cat);
    const catLabel = catDisplayLabel(item.cat);
    return `<div class="food-item ${catClass}" onclick="openFoodTip(${i},event)">
      <div class="fi-header">
        <div class="fi-icon">${icon}</div>
        <div class="fi-name">${name}</div>
      </div>
      <div class="fi-cat-label">▸ ${catLabel}</div>
      <div class="fi-body">
        <div class="fi-meta-row">
          <span class="fi-meta-label">${LANG === 'zh' ? '单位' : 'Unit'}</span>
          <span class="fi-meta-val">${item.unit}</span>
        </div>
        <div class="fi-serv-row">
          <span class="fi-serv-label">${LANG === 'zh' ? '份数' : 'Servings'}</span>
          <div class="fi-serv-ctrls">
            <button class="fi-btn" onclick="event.stopPropagation();changeServ(${i},-0.5)">−</button>
            <span class="fi-serv">${item.servings}</span>
            <button class="fi-btn" onclick="event.stopPropagation();changeServ(${i},0.5)">+</button>
          </div>
        </div>
        <button class="fi-btn fi-del" onclick="event.stopPropagation();removeItem(${i})">✕ ${LANG === 'zh' ? '删除' : 'Delete'}</button>
      </div>
    </div>`;
  }).join('');
}

// 食材分类 → 头部色块 class (后端分类: staple/protein/veg/fruit/light/fried/sweet/drink/dish)
function catColorClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c === 'staple' || /(grain|主食|碳水|rice|noodle|bread)/.test(c)) return 'cat-grain';
  if (c === 'protein' || /(meat|蛋白|肉|蛋|egg|chicken|beef|pork|fish|shrimp)/.test(c)) return 'cat-meat';
  if (c === 'veg' || /(veg|蔬|菜|leaf)/.test(c)) return 'cat-veg';
  if (c === 'fruit' || /(水果|berry)/.test(c)) return 'cat-fruit';
  if (c === 'light') return 'cat-light';
  if (c === 'fried') return 'cat-fried';
  if (c === 'sweet') return 'cat-sweet';
  if (c === 'drink') return 'cat-drink';
  if (c === 'dish') return 'cat-dish';
  return 'cat-grain';
}

// 食材分类 → 显示标签 (中英文)
function catDisplayLabel(cat) {
  if (!cat) return LANG === 'zh' ? '其他' : 'Other';
  const map = {
    staple:  { zh: '主食类 · Staple',    en: 'Staple' },
    protein: { zh: '蛋白质 · Protein',   en: 'Protein' },
    veg:     { zh: '蔬菜类 · Vegetable', en: 'Vegetable' },
    fruit:   { zh: '水果类 · Fruit',     en: 'Fruit' },
    light:   { zh: '清淡餐 · Light',     en: 'Light Meal' },
    fried:   { zh: '高油炸物 · Fried',   en: 'Fried Food' },
    sweet:   { zh: '甜品饮料 · Sweet',   en: 'Sweet/Dessert' },
    drink:   { zh: '饮品 · Drink',       en: 'Beverage' },
    dish:    { zh: '中式菜肴 · Dish',    en: 'Chinese Dish' }
  };
  const k = (cat || '').toLowerCase();
  if (map[k]) return map[k][LANG] || cat;
  return cat;
}

// 撒星星特效
function sparkleBurst(x, y) {
  const stars = ['✦', '✧', '⋆', '✦', '✧', '★', '✫', '✬'];
  const colors = ['#fce29c', '#f4a974', '#ff8a96', '#c8b5e0', '#97c459', '#a8c5dc'];
  for (let i = 0; i < 24; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'sparkle-star';
      s.textContent = stars[i % stars.length];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 100;
      s.style.setProperty('--tx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--ty', Math.sin(ang) * dist + 'px');
      s.style.color = colors[i % colors.length];
      s.style.fontSize = (12 + Math.random() * 8) + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }, i * 25);
  }
}

// 打开食材详情弹窗
window.openFoodTip = function(i, ev) {
  const item = CURRENT_ITEMS[i];
  if (!item) return;
  // 卡片震动
  const card = ev.currentTarget;
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  // 星星
  sparkleBurst(ev.clientX, ev.clientY);
  // 等待震动开始后再弹窗
  setTimeout(() => {
    const name = LANG === 'zh' ? item.zh : item.en;
    document.getElementById('foodTipName').textContent = name;
    document.getElementById('foodTipCat').textContent = '▸ ' + catDisplayLabel(item.cat);
    document.getElementById('foodTipDesc').textContent = item.desc || (LANG === 'zh'
      ? `一份「${name}」, ${item.unit || ''} · 当前 ${item.servings || 1} 份`
      : `A serving of ${name}, ${item.unit || ''} · ${item.servings || 1} ×`);
    // 营养数据：后端的 cal/p/c/f 是「单份」原始值，按 servings 缩放
    // (后端 nutrition.js 里 cal/p/c/f 是 unit 一份的数据)
    const s = item.servings || 1;
    const fmt = (v, digits) => (v == null || isNaN(v)) ? '—' : (digits === 0 ? Math.round(v * s) : (v * s).toFixed(digits));
    document.getElementById('ftCal').textContent  = fmt(item.cal,  0) + ' kcal';
    document.getElementById('ftPro').textContent  = fmt(item.p,    1) + ' g';
    document.getElementById('ftCarb').textContent = fmt(item.c,    1) + ' g';
    document.getElementById('ftFat').textContent  = fmt(item.f,    1) + ' g';
    document.getElementById('foodTipBackdrop').classList.add('show');
  }, 300);
};
window.closeFoodTip = function() {
  document.getElementById('foodTipBackdrop').classList.remove('show');
};

window.changeServ = function(i, delta) {
  CURRENT_ITEMS[i].servings = Math.max(0.5, Math.min(10, +(CURRENT_ITEMS[i].servings + delta).toFixed(1)));
  renderFoodItems();
};
window.removeItem = function(i) {
  CURRENT_ITEMS.splice(i, 1);
  renderFoodItems();
};

// 食物搜索
let searchTimer = null;
async function searchFoods(q) {
  clearTimeout(searchTimer);
  if (!q || !q.trim()) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  searchTimer = setTimeout(async () => {
    const list = await apiCall('GET', '/api/foods/search?q=' + encodeURIComponent(q));
    renderSearchResults(list);
  }, 200);
}

async function showAllFoods() {
  const list = await apiCall('GET', '/api/foods/all');
  renderSearchResults(list.filter(f => f.id !== 'generic_meal'));
}

function renderSearchResults(list) {
  const wrap = document.getElementById('searchResults');
  if (!list || list.length === 0) {
    wrap.innerHTML = `<div style="grid-column:1/-1;color:var(--ink2);font-family:'VT323',monospace;font-size:15px;text-align:center;padding:14px">
      ${LANG === 'zh' ? '没找到,试试其他关键词?' : 'No match — try another keyword?'}
    </div>`;
    return;
  }
  wrap.innerHTML = list.map(f => {
    const name = LANG === 'zh' ? f.zh : f.en;
    return `<div class="sr-card" onclick="addItem('${f.id}')">
      <div class="sr-name">${name}</div>
      <div class="sr-cal">${f.cal} kcal</div>
    </div>`;
  }).join('');
}

window.addItem = async function(id) {
  // 检查是否已存在
  const exist = CURRENT_ITEMS.find(it => it.id === id);
  if (exist) {
    exist.servings = +(exist.servings + 0.5).toFixed(1);
    renderFoodItems();
    toast(LANG === 'zh' ? '已增加份数' : 'Increased servings', 'ok');
    return;
  }
  const f = await apiCall('GET', '/api/foods/' + id);
  if (!f || f.err) return;
  CURRENT_ITEMS.push({
    id: f.id,
    servings: 1,
    zh: f.zh,
    en: f.en,
    cat: f.cat,
    unit: f.unit,
    // 营养数据（弹窗用，沿用后端字段名）
    cal: f.cal,
    p: f.p,
    c: f.c,
    f: f.f,
    fiber: f.fiber,
    na: f.na,
    ca: f.ca,
    fe: f.fe,
    vc: f.vc
  });
  renderFoodItems();
  toast(LANG === 'zh' ? '已添加' : 'Added', 'ok');
};

// 像素食物图标 SVG
function pixelFoodIcon(cat) {
  const icons = {
    staple: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="3" y="8" width="10" height="6" fill="#f4a974"/>
      <rect x="3" y="7" width="10" height="1" fill="#fce29c"/>
      <rect x="4" y="9" width="2" height="1" fill="#fff"/>
      <rect x="10" y="11" width="2" height="1" fill="#fff"/></svg>`,
    protein: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="3" y="4" width="10" height="8" fill="#e85a4f"/>
      <rect x="3" y="4" width="10" height="2" fill="#ff8a96"/>
      <rect x="4" y="9" width="2" height="2" fill="#fce29c"/></svg>`,
    veg: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="6" y="2" width="4" height="2" fill="#7bc457"/>
      <rect x="4" y="4" width="8" height="8" fill="#5fa849"/>
      <rect x="5" y="6" width="2" height="2" fill="#c9e8ad"/>
      <rect x="9" y="9" width="2" height="2" fill="#c9e8ad"/></svg>`,
    fruit: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="7" y="2" width="2" height="2" fill="#5fa849"/>
      <rect x="4" y="4" width="8" height="8" fill="#e85a4f"/>
      <rect x="6" y="6" width="1" height="1" fill="#fff"/></svg>`,
    light: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="3" y="6" width="10" height="6" fill="#a8d5ba"/>
      <rect x="4" y="7" width="2" height="1" fill="#fff"/>
      <rect x="10" y="9" width="2" height="1" fill="#fff"/></svg>`,
    fried: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="3" y="6" width="10" height="6" fill="#d97f3f"/>
      <rect x="4" y="4" width="8" height="2" fill="#a67244"/>
      <rect x="5" y="8" width="2" height="1" fill="#fce29c"/></svg>`,
    sweet: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="4" y="3" width="8" height="3" fill="#ff8a96"/>
      <rect x="4" y="6" width="8" height="6" fill="#deb78a"/>
      <rect x="6" y="2" width="1" height="1" fill="#e85a4f"/>
      <rect x="9" y="2" width="1" height="1" fill="#e85a4f"/></svg>`,
    drink: `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <rect x="5" y="3" width="6" height="10" fill="#a8c5dc"/>
      <rect x="5" y="3" width="6" height="2" fill="#c8e0f0"/>
      <rect x="6" y="6" width="1" height="1" fill="#fff"/></svg>`,
  };
  return icons[cat] || icons.light;
}

// ============ 生成报告 ============
async function generateReport() {
  if (CURRENT_ITEMS.length === 0) {
    toast(t('upload.empty'), 'err');
    return;
  }
  gLoad(true, t('g.generating'));
  const descEl = document.getElementById('mealDesc');
  const description = descEl ? descEl.value.trim() : '';
  const r = await apiCall('POST', '/api/report', {
    items: CURRENT_ITEMS.map(it => ({ id: it.id, servings: it.servings })),
    imageRef: CURRENT_IMAGE,
    description
  });
  gLoad(false);
  if (!r.success) {
    toast(r.message || (LANG === 'zh' ? '生成失败' : 'Failed'), 'err');
    return;
  }
  CURRENT_RECORD = r.record;
  CURRENT_RECORD.imageRef = CURRENT_IMAGE;
  showPage('report');
  fillReport(CURRENT_RECORD);

  // 自动保存到本地历史——避免用户忘记点「保存」而丢失记录
  // 用 saveAsync 把照片压成缩略图再存,移动端不再溢出
  if (await Store.saveAsync(CURRENT_RECORD)) {
    CURRENT_RECORD._saved = true;
    toast(t('report.autoSaved'), 'ok');
  }
}

function fillReport(record) {
  // 顶部日期
  document.getElementById('reportDate').textContent = fmtDate(record.date);

  // 餐食照片
  const photo = document.getElementById('reportPhoto');
  photo.src = record.imageRef || '';

  // 热量
  document.getElementById('rCal').textContent = record.evaluation.totals.cal;
  const ratioEl = document.getElementById('rRatio');
  const ratio = record.evaluation.ratio;
  let ratioText, ratioCls;
  if (ratio > 30) { ratioText = (LANG === 'zh' ? '偏高 +' : 'HIGH +') + ratio + '%'; ratioCls = 'warn'; }
  else if (ratio < -30) { ratioText = (LANG === 'zh' ? '偏低 ' : 'LOW ') + ratio + '%'; ratioCls = 'warn'; }
  else { ratioText = (LANG === 'zh' ? '适中 ' : 'BALANCED ') + (ratio>=0?'+':'') + ratio + '%'; ratioCls = 'good'; }
  ratioEl.textContent = ratioText;
  ratioEl.className = 'cal-status ' + ratioCls;

  // 食材清单
  const fsList = document.getElementById('rFoodList');
  fsList.innerHTML = record.detailed.map(it => {
    const name = LANG === 'zh' ? it.zh : it.en;
    return `<div class="fs-item">${name}<span class="fs-x">×${it.servings}</span></div>`;
  }).join('');

  // 三大营养素 (动画填充)
  const macroPct = record.evaluation.macroRatio;
  const achievement = record.evaluation.achievement;
  document.getElementById('rProtein').textContent = record.evaluation.totals.p;
  document.getElementById('rCarb').textContent = record.evaluation.totals.c;
  document.getElementById('rFat').textContent = record.evaluation.totals.f;
  document.getElementById('rProteinPct').textContent = macroPct.p + '%';
  document.getElementById('rCarbPct').textContent = macroPct.c + '%';
  document.getElementById('rFatPct').textContent = macroPct.f + '%';
  setTimeout(() => {
    document.getElementById('rProteinBar').style.width = Math.min(100, achievement.p) + '%';
    document.getElementById('rCarbBar').style.width = Math.min(100, achievement.c) + '%';
    document.getElementById('rFatBar').style.width = Math.min(100, achievement.f) + '%';
  }, 200);

  // 维生素 & 矿物质
  const tot = record.evaluation.totals;
  const microGrid = document.getElementById('microGrid');
  const microItems = LANG === 'zh' ? [
    { name: '膳食纤维', val: tot.fiber + 'g' },
    { name: '钠 Na', val: tot.na + 'mg' },
    { name: '钙 Ca', val: tot.ca + 'mg' },
    { name: '铁 Fe', val: tot.fe + 'mg' },
    { name: '维C', val: tot.vc + 'mg' },
    { name: '碳水', val: tot.c + 'g' },
  ] : [
    { name: 'Fiber', val: tot.fiber + 'g' },
    { name: 'Sodium', val: tot.na + 'mg' },
    { name: 'Calcium', val: tot.ca + 'mg' },
    { name: 'Iron', val: tot.fe + 'mg' },
    { name: 'Vit C', val: tot.vc + 'mg' },
    { name: 'Carbs', val: tot.c + 'g' },
  ];
  microGrid.innerHTML = microItems.map(m =>
    `<div class="micro-cell"><span class="mc-name">${m.name}</span><span class="mc-val">${m.val}</span></div>`
  ).join('');

  // 右侧:餐食分类
  const catTag = document.getElementById('rMealType');
  catTag.textContent = LANG === 'zh' ? record.evaluation.catName.zh : record.evaluation.catName.en;

  // 进食动机
  const motive = record.evaluation.motive;
  document.getElementById('rMoodTag').textContent = LANG === 'zh' ? motive.zh : motive.en;
  document.getElementById('rMoodDesc').textContent = LANG === 'zh' ? motive.desc_zh : motive.desc_en;

  // 心理评分
  const psy = record.evaluation.psy;
  document.getElementById('rScoreNum').textContent = psy.mood;
  document.getElementById('rStressNum').textContent = psy.stress;
  document.getElementById('rBalanceNum').textContent = psy.balance;
  setTimeout(() => {
    document.getElementById('rScoreFill').style.width = psy.mood + '%';
    document.getElementById('rStressFill').style.width = psy.stress + '%';
    document.getElementById('rBalanceFill').style.width = psy.balance + '%';
  }, 300);

  // 心理分析(打字机效果)
  const analysisText = buildAnalysisText(record);
  typewriter(document.getElementById('rAnalysis'), analysisText, 28);

  // 进食心理报告(仅当有描述时)
  renderPsychReport(record.psychReport);

  // tips
  const tipsList = document.getElementById('rTips');
  const tips = LANG === 'zh' ? record.evaluation.tips.zh : record.evaluation.tips.en;
  tipsList.innerHTML = tips.map(tp => `<div class="tip-item">${tp}</div>`).join('');

  // 按钮事件(每次都重新绑定避免堆积)
  document.getElementById('btnSaveReport').onclick = saveCurrentReport;
  document.getElementById('btnCloseReport').onclick = () => {
    showEncourage();
  };
}

function buildAnalysisText(record) {
  const psy = record.evaluation.psy;
  const motive = record.evaluation.motive;
  const fromDesc = record.evaluation.motiveSource === 'description';
  if (LANG === 'zh') {
    if (fromDesc) {
      return `结合你写下的当餐心境,这更像是一次「${motive.zh}」。情绪指数 ${psy.mood} 分,压力相关度 ${psy.stress} 分,营养均衡度 ${psy.balance} 分(均衡度仍来自营养计算)。${motive.desc_zh}。具体的进食心理分析见上方报告。`;
    }
    return `这是一餐 ${motive.zh}。综合三大营养素分布、热量与食物类别,你当前的情绪指数为 ${psy.mood} 分,压力相关度 ${psy.stress} 分,营养均衡度 ${psy.balance} 分。${motive.desc_zh}。建议留意当下情绪状态,并参考下方的小建议慢慢调整。`;
  }
  if (fromDesc) {
    return `Based on what you wrote about this meal, this reads more like "${motive.en}". Mood ${psy.mood}/100, stress relevance ${psy.stress}/100, nutritional balance ${psy.balance}/100 (balance still from nutrition data). ${motive.desc_en}. See the detailed eating-psychology report above.`;
  }
  return `This was a ${motive.en.toLowerCase()} session. Based on macronutrient distribution, calories, and food categories, your mood index is ${psy.mood}/100, stress relevance ${psy.stress}/100, and nutritional balance ${psy.balance}/100. ${motive.desc_en}. Pay attention to your present emotional state, and consider the tips below to gradually adjust.`;
}

function renderPsychReport(psych) {
  const box = document.getElementById('psychReport');
  if (!box) return;

  // 描述为空 -> 后端返回 null -> 不展示心理报告
  if (!psych) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pick = (zh, en) => LANG === 'zh' ? zh : en;

  let html = '';
  // 横幅
  html += `<div class="psych-banner"><span class="banner-icon">✎</span><span>${t('report.psychTitle')}</span></div>`;
  // 用户原文引用
  if (psych.sourceText) {
    html += `<div class="psych-desc-quote">“${esc(psych.sourceText)}”</div>`;
  }

  if (psych.matched) {
    // 主导动机
    const p = psych.primary;
    html += `<div class="psych-primary">
      <div class="pp-group">${t('report.psychPrimaryLab')} · ${esc(pick(p.groupZh, p.groupEn))}</div>
      <div class="pp-name">${esc(pick(p.zh, p.en))}</div>
      <div class="pp-desc">${esc(pick(p.desc_zh, p.desc_en))}</div>
    </div>`;

    // 各大类 / 子类
    html += '<div class="psych-groups">';
    for (const g of psych.groups) {
      html += `<div class="psych-group">
        <div class="psych-group-head">${esc(pick(g.zh, g.en))}</div>`;
      for (const it of g.items) {
        html += `<div class="psych-item">
          <span class="pi-name">${esc(pick(it.zh, it.en))}</span>
          <div class="pi-desc">${esc(pick(it.desc_zh, it.desc_en))}</div>
        </div>`;
      }
      html += '</div>';
    }
    html += '</div>';
  } else {
    // 有描述但无可归类线索
    html += `<div class="psych-note">${esc(pick(psych.note_zh, psych.note_en))}</div>`;
  }

  box.innerHTML = html;
  box.style.display = 'block';
}

function typewriter(el, text, speed) {
  el.innerHTML = '';
  let i = 0;
  const cursor = '<span class="typing-cursor"></span>';
  const step = () => {
    if (i <= text.length) {
      el.innerHTML = text.slice(0, i) + cursor;
      i++;
      setTimeout(step, speed);
    } else {
      el.innerHTML = text;
    }
  };
  step();
}

async function saveCurrentReport() {
  if (!CURRENT_RECORD) return;
  if (CURRENT_RECORD._saved) {
    toast(t('report.alreadySaved'), 'ok');
    return;
  }
  gLoad(true, t('g.saving'));
  const ok = await Store.saveAsync(CURRENT_RECORD);
  gLoad(false);
  if (ok) {
    CURRENT_RECORD._saved = true;
    toast(t('report.saved'), 'ok');
  } else {
    toast(LANG === 'zh' ? '保存失败,本地存储空间可能已满' : 'Save failed — local storage may be full', 'err');
  }
}

// ============ 鼓励文案 ============
const ENCOURAGE_ZH = [
  '不必和昨天的自己比,你今天已经做得很好',
  '一餐而已,世界不会因为它倾斜',
  '允许自己慢慢来,你不是机器',
  '吃饭这件事,本来就是温柔的',
  '你愿意记录,就是关心自己的开始',
  '完美的饮食不存在,稳定的节奏才重要',
  '此刻你正在为自己花一点心思,这就很难得',
  '不要被数字捆住,身体的感受最诚实',
  '今天的努力,明天的身体会记得',
  '一个人吃饭,也要好好吃',
  '比起减重,先学会和身体做朋友',
  '不开心的时候吃东西,也是被允许的',
  '吃,本来就该是享受',
  '一日三餐,是写给自己的小诗',
  '别让饮食成为另一种焦虑的源头',
  '你比你想象的更值得被好好对待',
  '健康是种节奏,不是种成绩',
  '把"应该吃什么"换成"想吃什么"试试',
  '记得给身体一些温柔的食物',
  '今天的这一餐,已经是一个进步',
];
const ENCOURAGE_EN = [
  'Don\'t compare yourself to yesterday. You\'re doing great today',
  'It\'s just one meal. The world won\'t tilt',
  'Allow yourself to go slow. You\'re not a machine',
  'Eating is meant to be gentle',
  'The fact you\'re tracking is already self-care',
  'Perfect eating doesn\'t exist. Steady rhythm does',
  'You\'re investing thought in yourself right now — that\'s rare',
  'Don\'t be tied by numbers. Your body\'s feelings are most honest',
  'Today\'s effort will be remembered by tomorrow\'s body',
  'Even eating alone, eat well',
  'Before losing weight, learn to befriend your body',
  'Eating when unhappy is also allowed',
  'Eating should be enjoyable',
  'Three meals a day are little poems to yourself',
  'Don\'t let food become another source of anxiety',
  'You deserve more kindness than you think',
  'Health is a rhythm, not a grade',
  'Try swapping "what should I eat" for "what do I want"',
  'Remember to give your body some gentle food',
  'Today\'s meal is already a step forward',
];

function showEncourage() {
  const modal = document.getElementById('encourageModal');
  const textEl = document.getElementById('encourageText');
  const bar = document.getElementById('encourageBar');
  const countEl = document.getElementById('encourageCount');

  const pool = LANG === 'zh' ? ENCOURAGE_ZH : ENCOURAGE_EN;
  const usedKey = 'sm_used_enc_' + LANG;
  let used = JSON.parse(localStorage.getItem(usedKey) || '[]');
  if (used.length >= pool.length) used = [];
  let idx;
  do { idx = Math.floor(Math.random() * pool.length); } while (used.includes(idx));
  used.push(idx);
  localStorage.setItem(usedKey, JSON.stringify(used));

  // 打字机
  typewriter(textEl, pool[idx], 35);
  modal.classList.add('active');

  // 进度条 + 倒计时
  bar.style.transition = 'none';
  bar.style.width = '100%';
  countEl.textContent = '10s';
  void bar.offsetWidth;
  setTimeout(() => {
    bar.style.transition = 'width 10s linear';
    bar.style.width = '0%';
  }, 50);

  // 10s 倒计时
  let secs = 10;
  clearInterval(ENCOURAGE_INTERVAL);
  ENCOURAGE_INTERVAL = setInterval(() => {
    secs--;
    countEl.textContent = secs + 's';
    if (secs <= 0) clearInterval(ENCOURAGE_INTERVAL);
  }, 1000);

  // 10s 后自动关闭
  clearTimeout(ENCOURAGE_TIMER);
  ENCOURAGE_TIMER = setTimeout(() => closeEncourage(), 10000);

  // 手动关闭
  document.getElementById('btnCloseEncourage').onclick = closeEncourage;
}

function closeEncourage() {
  clearTimeout(ENCOURAGE_TIMER);
  clearInterval(ENCOURAGE_INTERVAL);
  document.getElementById('encourageModal').classList.remove('active');
  // 关闭后回到首页
  setTimeout(() => showPage('home'), 300);
}

// ============ 历史记录 ============
function renderHistory() {
  const wrap = document.getElementById('historyContainer');
  const records = Store.getAll();
  if (records.length === 0) {
    wrap.innerHTML = `<div class="empty">
      <div class="empty-mascot">${mascotSVG()}</div>
      ${t('history.empty')}
    </div>`;
    return;
  }
  wrap.innerHTML = '<div class="history-grid">' + records.map(r => {
    const motive = LANG === 'zh' ? r.evaluation.motive.zh : r.evaluation.motive.en;
    const thumb = r.imageRef ? `<img class="h-thumb" src="${r.imageRef}" alt="">`
                             : `<div class="h-thumb" style="display:flex;align-items:center;justify-content:center">${mascotSVG(true)}</div>`;
    const itemsStr = r.detailed.slice(0, 3).map(it => LANG==='zh'?it.zh:it.en).join(' / ') + (r.detailed.length > 3 ? '...' : '');
    return `<div class="h-card" onclick="reopenHistory('${r.id}')">
      <button class="h-del" onclick="event.stopPropagation();deleteHistoryItem('${r.id}')">✕</button>
      ${thumb}
      <div class="h-date">${fmtDate(r.date)}</div>
      <div class="h-info">${itemsStr}</div>
      <div class="h-info" style="color:var(--berry-deep)">${r.evaluation.totals.cal} kcal</div>
      <div class="h-tag">${motive}</div>
    </div>`;
  }).join('') + '</div>';
}

window.reopenHistory = function(id) {
  const rec = Store.getById(id);
  if (!rec) return;
  CURRENT_RECORD = rec;
  showPage('report');
  fillReport(rec);
};

window.deleteHistoryItem = function(id) {
  if (!confirm(t('history.del'))) return;
  Store.remove(id);
  toast(t('history.deleted'), 'ok');
  renderHistory();
};

function mascotSVG(small) {
  const size = small ? 'width:48px;height:48px' : 'width:96px;height:96px';
  return `<svg style="${size}" viewBox="0 0 24 24" shape-rendering="crispEdges">
    <rect x="9" y="2" width="6" height="2" fill="#5fa849"/>
    <rect x="8" y="3" width="2" height="2" fill="#7bc457"/>
    <rect x="14" y="3" width="2" height="2" fill="#7bc457"/>
    <rect x="7" y="5" width="10" height="2" fill="#e85a4f"/>
    <rect x="6" y="7" width="12" height="8" fill="#e85a4f"/>
    <rect x="7" y="15" width="10" height="2" fill="#c44539"/>
    <rect x="9" y="9" width="2" height="2" fill="#fff"/>
    <rect x="13" y="9" width="2" height="2" fill="#fff"/>
    <rect x="10" y="10" width="1" height="1" fill="#2d2418"/>
    <rect x="14" y="10" width="1" height="1" fill="#2d2418"/>
    <rect x="11" y="12" width="2" height="1" fill="#2d2418"/>
    <rect x="7" y="11" width="2" height="1" fill="#ff8a96"/>
    <rect x="15" y="11" width="2" height="1" fill="#ff8a96"/>
  </svg>`;
}

// ============ 月度报告 ============
function renderMonthly() {
  const wrap = document.getElementById('monthlyContent');
  const sub = document.getElementById('monthlySubtitle');
  sub.textContent = t('monthly.subtitle');

  const data = Store.monthly();
  if (!data.ok) {
    if (data.err === 'need_more_data') {
      const need = (data.required || 7) - (data.count || 0);
      const msg = t('monthly.needMoreDesc').replace('{n}', need);
      wrap.innerHTML = `<div class="empty">
        <div class="empty-mascot">${mascotSVG()}</div>
        <div style="font-family:'Press Start 2P','ZCOOL QingKe HuangYou',monospace;font-size:13px;color:var(--ink-dark);margin-bottom:10px">
          ${t('monthly.needMore')}
        </div>
        <div>${LANG === 'zh' ? '当前已有 ' + data.count + ' 餐 / 需要至少 ' + data.required + ' 餐' : 'Current: ' + data.count + ' meals / Required: ' + data.required}</div>
        <div style="margin-top:8px;font-size:17px;color:var(--ink2)">${msg}</div>
      </div>`;
      return;
    }
    wrap.innerHTML = `<div class="empty">${LANG==='zh'?'加载失败':'Load failed'}</div>`;
    return;
  }

  // 渲染统计卡 + 图表
  const avg = data.avg;
  wrap.innerHTML = `
    <div class="month-stats">
      <div class="stat-card pink">
        <div class="stat-card-lab">${t('monthly.avgCal')}</div>
        <div class="stat-card-num">${avg.cal}</div>
        <div class="stat-card-trend">kcal / meal</div>
      </div>
      <div class="stat-card mint">
        <div class="stat-card-lab">${t('monthly.avgMood')}</div>
        <div class="stat-card-num">${avg.mood}/100</div>
        <div class="stat-card-trend">${avg.mood>=70?'GOOD':avg.mood>=50?'OK':'LOW'}</div>
      </div>
      <div class="stat-card sky">
        <div class="stat-card-lab">${t('monthly.avgStress')}</div>
        <div class="stat-card-num">${avg.stress}/100</div>
        <div class="stat-card-trend">${avg.stress<=30?'CALM':avg.stress<=60?'MILD':'HIGH'}</div>
      </div>
      <div class="stat-card lav">
        <div class="stat-card-lab">${t('monthly.avgBalance')}</div>
        <div class="stat-card-num">${avg.balance}/100</div>
        <div class="stat-card-trend">${avg.balance>=70?'GREAT':'SO-SO'}</div>
      </div>
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <div class="chart-title">${t('monthly.cal')}</div>
        <div class="chart-legend"><span><span class="legend-dot" style="background:var(--berry)"></span>${LANG==='zh'?'每餐热量':'kcal'}</span></div>
      </div>
      <canvas class="chart" id="chartCal"></canvas>
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <div class="chart-title">${t('monthly.mood')}</div>
        <div class="chart-legend"><span><span class="legend-dot" style="background:var(--grass)"></span>${LANG==='zh'?'情绪分':'mood'}</span></div>
      </div>
      <canvas class="chart" id="chartMood"></canvas>
    </div>

    <div class="chart-block">
      <div class="chart-header">
        <div class="chart-title">${t('monthly.stress')}</div>
        <div class="chart-legend"><span><span class="legend-dot" style="background:var(--warm-deep)"></span>${LANG==='zh'?'压力分':'stress'}</span></div>
      </div>
      <canvas class="chart" id="chartStress"></canvas>
    </div>

    <div class="month-summary">
      <h3>${t('monthly.summary')}</h3>
      <p>${monthlySummaryText(avg)}</p>
    </div>
  `;

  // 渲染像素折线图
  setTimeout(() => {
    drawPixelChart('chartCal', data.series.cals, '#e85a4f');
    drawPixelChart('chartMood', data.series.moods, '#5fa849');
    drawPixelChart('chartStress', data.series.stresses, '#d97f3f');
  }, 100);
}

function monthlySummaryText(avg) {
  if (LANG === 'zh') {
    let txt = `过去一个月,你平均每餐摄入 ${avg.cal} kcal。`;
    if (avg.mood >= 70) txt += '情绪状态平稳良好,继续保持当前节奏 ✨ ';
    else if (avg.mood >= 50) txt += '情绪状态尚可,但可以更稳定一些。';
    else txt += '情绪指数偏低,留意自己是否在用食物代偿情绪压力。';
    if (avg.stress >= 60) txt += '压力相关进食偏多,建议尝试方案页的暴食/压力调节建议。';
    if (avg.balance < 50) txt += '营养均衡度还有提升空间,可在主食外多加一份蛋白质或蔬菜。';
    return txt;
  }
  let txt = `Over the past month, your average intake is ${avg.cal} kcal per meal. `;
  if (avg.mood >= 70) txt += 'Your mood is stable and positive — keep up the rhythm ✨ ';
  else if (avg.mood >= 50) txt += 'Your mood is okay, but could be more stable. ';
  else txt += 'Mood index is low — watch whether you\'re using food to compensate for stress. ';
  if (avg.stress >= 60) txt += 'Stress-related eating is high. Check the Care Plans page for binge/stress management tips. ';
  if (avg.balance < 50) txt += 'Nutritional balance has room to improve. Add a protein or vegetable beyond your staple. ';
  return txt;
}

function drawPixelChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || data.length === 0) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const pad = 24;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  // 背景网格
  ctx.fillStyle = '#faf3e3';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(122,82,48,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (innerH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }

  // 数据范围
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (innerW / Math.max(data.length - 1, 1)) * i;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });

  // 动画绘制
  let drawn = 0;
  const animStep = () => {
    if (drawn >= pts.length) return;
    // 重画背景已绘制部分
    if (drawn > 0) {
      // 连线段
      const [x1, y1] = pts[drawn - 1];
      const [x2, y2] = pts[drawn];
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    // 数据点(像素方块)
    const [px, py] = pts[drawn];
    ctx.fillStyle = '#2d2418';
    ctx.fillRect(px - 4, py - 4, 8, 8);
    ctx.fillStyle = color;
    ctx.fillRect(px - 3, py - 3, 6, 6);
    drawn++;
    setTimeout(animStep, 80);
  };
  animStep();
}

// ============ 心理方案 ============
function setupPlan() {
  document.querySelectorAll('.plan-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPlan(tab.dataset.plan);
    };
  });
}

// === 打卡存储工具（按日期 + 方案类型存）===
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function planStorageKey(type) {
  return 'taste_diary_plan_' + type + '_' + todayKey();
}
function loadPlanChecks(type, total) {
  try {
    const raw = localStorage.getItem(planStorageKey(type));
    if (!raw) return new Array(total).fill(false);
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length === total ? arr : new Array(total).fill(false);
  } catch (e) { return new Array(total).fill(false); }
}
function savePlanChecks(type, arr) {
  try { localStorage.setItem(planStorageKey(type), JSON.stringify(arr)); } catch (e) {}
  // 顺便清掉昨天及更早的记录，防止本地存储无限增长
  try {
    const today = todayKey();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('taste_diary_plan_') && !k.endsWith(today)) {
        localStorage.removeItem(k); i--;
      }
    }
  } catch (e) {}
}

function renderPlan(type) {
  const wrap = document.getElementById('planContent');
  const data = PLAN_DATA[type];
  if (!data) return;
  const d = data[LANG];
  const total = d.adjList.length + d.actList.length;
  const checks = loadPlanChecks(type, total);

  const progressLabel = t('plan.progress');
  const resetLabel = t('plan.reset');

  const adjItems = d.adjList.map((txt, i) => {
    const idx = i;
    const done = checks[idx] ? 'done' : '';
    return `<div class="plan-check-item ${done}" data-plan-idx="${idx}" data-plan-type="${type}">
      <div class="pc-box"><span class="pc-mark">✓</span></div>
      <div class="pc-text">${txt}</div>
    </div>`;
  }).join('');

  const actItems = d.actList.map((txt, i) => {
    const idx = d.adjList.length + i;
    const done = checks[idx] ? 'done' : '';
    return `<div class="plan-check-item ${done}" data-plan-idx="${idx}" data-plan-type="${type}">
      <div class="pc-box"><span class="pc-mark">✓</span></div>
      <div class="pc-text">${txt}</div>
    </div>`;
  }).join('');

  const doneCount = checks.filter(Boolean).length;
  const pct = total ? (doneCount / total * 100) : 0;

  wrap.innerHTML = `
    <div class="plan-content active">
      <div class="plan-progress-card">
        <span class="plan-progress-label">${progressLabel}</span>
        <div class="plan-progress-bar"><div class="plan-progress-fill" id="planProgFill" style="width:${pct}%"></div></div>
        <span class="plan-progress-count" id="planProgCount">${doneCount} / ${total}</span>
        <button class="plan-reset-btn" id="planResetBtn">${resetLabel}</button>
      </div>

      <div class="plan-section">
        <div class="plan-section-title">
          <div class="plan-icon psy"></div>${d.psyTitle}
        </div>
        <p>${d.psyContent}</p>
      </div>
      <div class="plan-section">
        <div class="plan-section-title">
          <div class="plan-icon"></div>${d.adjTitle}
        </div>
        ${adjItems}
      </div>
      <div class="plan-section">
        <div class="plan-section-title">
          <div class="plan-icon act"></div>${d.actTitle}
        </div>
        ${actItems}
      </div>
    </div>`;

  // 绑定打卡点击
  wrap.querySelectorAll('.plan-check-item').forEach(el => {
    el.addEventListener('click', (ev) => togglePlanCheck(el, type, total, ev));
  });
  // 重置按钮
  const resetBtn = document.getElementById('planResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    savePlanChecks(type, new Array(total).fill(false));
    renderPlan(type);
  });
}

function togglePlanCheck(el, type, total, ev) {
  const idx = parseInt(el.dataset.planIdx, 10);
  const wasOff = !el.classList.contains('done');
  el.classList.toggle('done');
  // 保存状态
  const checks = loadPlanChecks(type, total);
  checks[idx] = el.classList.contains('done');
  savePlanChecks(type, checks);
  // 撒星(只在勾选时)
  if (wasOff) {
    const box = el.querySelector('.pc-box').getBoundingClientRect();
    sparkleBurst(box.left + box.width / 2, box.top + box.height / 2);
    // 完成一条 care plan -> 获得一个小鱼干
    if (window.Companion) {
      Companion.addFish(1);
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      flyFishToHome(cx, cy);
      toast(LANG === 'en' ? '+1 dried fish 🐟' : '获得 1 个小鱼干 🐟', 'ok');
    }
  }
  // 更新进度
  const doneCount = checks.filter(Boolean).length;
  const fill = document.getElementById('planProgFill');
  const count = document.getElementById('planProgCount');
  if (fill) fill.style.width = (doneCount / total * 100) + '%';
  if (count) count.textContent = doneCount + ' / ' + total;
  // 全部完成 -> 弹奖
  if (doneCount === total && wasOff) {
    setTimeout(() => openAchievement(), 500);
  }
}

window.openAchievement = function() {
  const bd = document.getElementById('achievementBackdrop');
  if (bd) bd.classList.add('show');
  // 弹窗时多撒一圈星
  setTimeout(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    sparkleBurst(cx, cy);
  }, 200);
};
window.closeAchievement = function() {
  const bd = document.getElementById('achievementBackdrop');
  if (bd) bd.classList.remove('show');
};

const PLAN_DATA = {
  binge: {
    zh: {
      psyTitle: '🧠 心理学解读 — 暴食行为',
      psyContent: '<b>频繁暴食</b>常常不是因为饿,而是大脑用食物代偿情绪压力。当你长期处在<b>焦虑、孤独、压抑</b>状态时,身体会通过大量进食(尤其是高糖高脂食物)快速激活多巴胺,带来短暂的「平静感」。但这种平静会在 1-2 小时后被<b>负罪感</b>取代,形成恶性循环。识别情绪触发点,是打破循环的第一步。',
      adjTitle: '🌿 心理调节建议',
      adjList: [
        '<b>暴食前 10 分钟暂停</b>:问自己「我现在是饿,还是情绪需要安慰?」',
        '建立<b>情绪日记</b>:记录每次暴食前的事件、心情、想法',
        '允许自己悲伤、生气,而<b>不必用食物压住</b>这些情绪',
        '不要事后惩罚自己(节食/过量运动),那会加剧下一次暴食',
        '寻找<b>替代性的多巴胺来源</b>:散步、洗澡、听喜欢的音乐'
      ],
      actTitle: '🌾 实操方案',
      actList: [
        '<b>三餐定时定量</b>:不饿不吃、饿了就吃,但不漏餐',
        '每餐保证<b>蛋白质(20g+)+ 慢碳水 + 蔬菜</b>,延缓饥饿感',
        '把零食放在<b>不易拿到的位置</b>,减少冲动决策',
        '<b>吃完后离开餐桌</b> 15 分钟,等饱足感传到大脑',
        '每周允许 1-2 顿「<b>正大光明的甜品时间</b>」,避免压抑反弹'
      ]
    },
    en: {
      psyTitle: '🧠 Psychology — Binge Eating',
      psyContent: '<b>Frequent binging</b> is often not about hunger — it\'s the brain compensating for emotional pressure with food. When you live under chronic <b>anxiety, loneliness, or suppression</b>, large amounts of food (especially high-sugar/fat) rapidly activate dopamine, giving brief "calm." But that calm is replaced 1-2 hours later by <b>guilt</b>, forming a vicious cycle. Recognising emotional triggers is the first step to breaking it.',
      adjTitle: '🌿 Psychological Adjustments',
      adjList: [
        '<b>Pause 10 minutes before binging</b>: ask "Am I hungry, or seeking emotional comfort?"',
        'Keep an <b>emotion journal</b>: record events, mood, thoughts before each binge',
        'Allow yourself to grieve or be angry — <b>don\'t suppress it with food</b>',
        'Don\'t punish yourself afterward (dieting/over-exercising) — it makes the next binge worse',
        'Find <b>alternative dopamine sources</b>: walks, baths, favourite music'
      ],
      actTitle: '🌾 Practical Plan',
      actList: [
        '<b>Regular meal timing</b>: eat when hungry, skip nothing',
        'Each meal: <b>protein (20g+) + slow carbs + vegetables</b> — delays hunger return',
        'Place snacks <b>out of easy reach</b> — reduce impulsive decisions',
        '<b>Leave the table for 15 min</b> after eating, let satiety signals reach your brain',
        'Allow 1-2 "<b>guilt-free dessert nights</b>" per week to prevent restriction backlash'
      ]
    }
  },
  restrict: {
    zh: {
      psyTitle: '🧠 心理学解读 — 过度节食',
      psyContent: '<b>过度节食</b>往往源于身材焦虑、控制欲或低自尊感。当你把「瘦」与「自我价值」绑定时,饮食就变成了一种<b>自我惩罚</b>。极端节食会让身体进入「<b>饥荒模式</b>」,基础代谢下降,反弹更严重。研究显示,节食者 2 年后<b>体重反而比基线更高</b>的比例超过 70%。真正可持续的是「<b>稳定的、温柔的进食节奏</b>」。',
      adjTitle: '🌿 心理调节建议',
      adjList: [
        '把「<b>身体接纳</b>」练习每天做 1 分钟:对镜子说出身体好的地方',
        '解绑「<b>瘦 = 美 = 值得被爱</b>」的认知绑定',
        '关注身体<b>能做什么</b>(走路、拥抱、跳舞),而不只是看起来怎样',
        '把社交媒体里制造焦虑的账号<b>取消关注</b>',
        '如果节食已影响生理(停经/掉发),请<b>立即就医</b>'
      ],
      actTitle: '🌾 实操方案',
      actList: [
        '不要跳过早餐,哪怕只有<b>一杯豆浆 + 一颗鸡蛋</b>',
        '每餐至少 <b>400 kcal</b>,女性每日不低于 1500 kcal',
        '主食<b>不可完全戒掉</b>,选择全麦、燕麦、藜麦等慢碳水',
        '油脂每天保留 <b>30-50g</b>(坚果、橄榄油),否则激素紊乱',
        '一周允许 1 天「<b>自由进食日</b>」,让身体知道食物充足、无需囤积'
      ]
    },
    en: {
      psyTitle: '🧠 Psychology — Restrictive Eating',
      psyContent: '<b>Restrictive eating</b> often stems from body anxiety, control needs, or low self-esteem. When you bind "thinness" to "self-worth", eating becomes <b>self-punishment</b>. Extreme restriction triggers "<b>famine mode</b>": basal metabolism drops, rebound is harsher. Research shows over 70% of dieters weigh <b>more than baseline 2 years later</b>. What\'s truly sustainable is a "<b>steady, gentle eating rhythm</b>".',
      adjTitle: '🌿 Psychological Adjustments',
      adjList: [
        'Practice <b>body acceptance</b> 1 min daily — say good things about your body in the mirror',
        'Unbind "<b>thin = beautiful = lovable</b>" cognitive linking',
        'Focus on what your body <b>can do</b> (walk, hug, dance), not just how it looks',
        '<b>Unfollow</b> social accounts that fuel body anxiety',
        'If restriction affects physiology (amenorrhea/hair loss), <b>seek medical help immediately</b>'
      ],
      actTitle: '🌾 Practical Plan',
      actList: [
        'Never skip breakfast — even just <b>soy milk + an egg</b>',
        'Min <b>400 kcal per meal</b>; women: at least 1500 kcal/day',
        '<b>Don\'t cut staples entirely</b> — choose slow carbs like whole wheat, oats, quinoa',
        'Keep <b>30-50g fats</b> daily (nuts, olive oil) — otherwise hormones disrupt',
        'Allow 1 "<b>free eating day</b>" weekly — tell your body food is abundant'
      ]
    }
  },
  irregular: {
    zh: {
      psyTitle: '🧠 心理学解读 — 作息不规律',
      psyContent: '<b>饮食 + 作息不规律</b>会扰乱<b>瘦素</b>和<b>胃饥饿素</b>的分泌周期。研究显示,<b>三餐间隔超过 6 小时</b>或熬夜超过凌晨 1 点,夜间报复性进食的概率提升 3 倍以上。这不是「意志力不够」,而是激素层面的<b>身体抗议</b>。修复节奏比强行节制更有效。',
      adjTitle: '🌿 心理调节建议',
      adjList: [
        '接受「<b>规律比完美更重要</b>」,先建立基础节奏再优化',
        '不要因为偶尔的<b>熬夜或漏餐</b>就全盘放弃,人不是机器',
        '减少「<b>晚上才属于自己</b>」的补偿心理,白天多留一点给自己',
        '工作日和周末<b>作息差异控制在 1 小时内</b>',
        '<b>记录三天的睡眠和饮食时间</b>,看自己真实的节奏'
      ],
      actTitle: '🌾 实操方案',
      actList: [
        '尽量<b>固定起床时间</b>,这是稳定生物钟的关键',
        '早餐在<b>起床后 1 小时内</b>完成,即使简单也要吃',
        '晚餐尽量在<b>睡前 3 小时</b>前结束,避免血糖波动影响睡眠',
        '夜宵选<b>温牛奶、无糖酸奶、香蕉</b>,避免高糖高油',
        '周末不要把作息全打乱,<b>补觉不超过 1.5 小时</b>'
      ]
    },
    en: {
      psyTitle: '🧠 Psychology — Irregular Schedule',
      psyContent: '<b>Irregular eating + sleep</b> disrupts <b>leptin</b> and <b>ghrelin</b> secretion cycles. Research shows: meal gaps over <b>6 hours</b> or staying up past 1AM triples the probability of late-night revenge eating. This isn\'t "lacking willpower" — it\'s a <b>hormonal protest</b>. Restoring rhythm is more effective than forced restriction.',
      adjTitle: '🌿 Psychological Adjustments',
      adjList: [
        'Accept "<b>regularity matters more than perfection</b>" — build a baseline first',
        'Don\'t give up entirely because of occasional <b>all-nighters or skipped meals</b> — you\'re not a machine',
        'Reduce "<b>night belongs to me</b>" compensation — leave more day-time for yourself',
        'Keep weekday-weekend schedule difference <b>within 1 hour</b>',
        '<b>Log 3 days of sleep and meal times</b> to see your real rhythm'
      ],
      actTitle: '🌾 Practical Plan',
      actList: [
        'Try to <b>fix your wake-up time</b> — key for stabilising biological clock',
        'Breakfast within <b>1 hour of waking</b> — even simple counts',
        'Finish dinner <b>3 hours before bed</b> — blood sugar swings disrupt sleep',
        'Late snacks: <b>warm milk, unsweetened yoghurt, banana</b> — avoid high-sugar/fat',
        'Don\'t blow up your schedule on weekends — <b>sleep-in cap: 1.5 hours</b>'
      ]
    }
  }
};

// ============ 启动入口 ============
async function init() {
  applyI18n();
  setupWelcomeLang();
  setupTopbar();
  setupUpload();
  setupPlan();
  setupModals();
  setupWelcomeEnter();

  await bootSequence();

  // 翻书动画结束后停在欢迎页,等用户填昵称(可留空)并点「进入」。
  bookShowWelcome();
  // 预填已保存的昵称,方便老用户直接进
  const nameInput = document.getElementById('nameInput');
  if (nameInput) {
    nameInput.value = Store.getName();
    nameInput.focus();
  }
}

// 欢迎页「进入」按钮:保存昵称(可空)后进入应用
function setupWelcomeEnter() {
  const enter = () => {
    const nameInput = document.getElementById('nameInput');
    Store.setName(nameInput ? nameInput.value : '');
    showApp();
  };
  const btn = document.getElementById('btnEnter');
  if (btn) btn.onclick = enter;
  const nameInput = document.getElementById('nameInput');
  if (nameInput) {
    nameInput.addEventListener('keypress', e => { if (e.key === 'Enter') enter(); });
  }
}

// 弹窗关闭事件绑定
function setupModals() {
  // 食材详情弹窗
  const ftBd = document.getElementById('foodTipBackdrop');
  const ftClose = document.getElementById('foodTipClose');
  if (ftBd) ftBd.addEventListener('click', (e) => { if (e.target === ftBd) window.closeFoodTip(); });
  if (ftClose) ftClose.addEventListener('click', window.closeFoodTip);
  // 成就弹窗
  const achBd = document.getElementById('achievementBackdrop');
  const achClose = document.getElementById('achievementClose');
  if (achBd) achBd.addEventListener('click', (e) => { if (e.target === achBd) window.closeAchievement(); });
  if (achClose) achClose.addEventListener('click', window.closeAchievement);
}

init();
