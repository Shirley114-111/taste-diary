/* ============================================================
   companion.js — 小鱼干积分 & 亲密度系统
   - 小鱼干：完成每一条 eating psychology care plan +1，喂猫/喂企鹅共用同一库存
   - 亲密度：猫、企鹅各自独立，共 10 级
   - 升级消耗：Lv1→2 需 2 个，Lv2→3 需 4 个，Lv3→4 需 8 个 …（即升到第 n 级需 2^(n-1) 个）
   - 形态：到达 Lv3 / Lv5 / Lv10 永久变身
   - 全部用 localStorage 持久化（与项目其它数据一致）
   ============================================================ */
(function (global) {
  'use strict';

  var LS_FISH = 'sm_fish';                 // 小鱼干库存
  var LS_BOND_CAT = 'sm_bond_cat';         // 猫累计已投喂(用于计算等级)
  var LS_BOND_PENG = 'sm_bond_peng';       // 企鹅累计已投喂

  // 升级消耗（温和递增）：从 Lv(L) 升到 Lv(L+1) 需要 L*2 个小鱼干
  var MAX_LEVEL = 10;

  // 从 Lv(from) 升到 Lv(from+1) 需要的小鱼干数。
  // 规则（温和递增）：升到第 2 级需 2，第 3 级需 4，第 4 级需 6 … 第 n 级需 (n-1)*2
  function costFromTo(fromLevel) { return fromLevel * 2; }   // Lv1→2:2, Lv2→3:4, Lv3→4:6 …

  // 到达等级 L 的累计阈值 = 2 + 4 + … + (L-1)*2 = (L-1)*L
  function cumulativeForLevel(L) { return (L - 1) * L; }     // L=1→0, L=2→2, L=3→6, L=10→90

  /* ---------- 读写 ---------- */
  function getFish() {
    var n = parseInt(localStorage.getItem(LS_FISH) || '0', 10);
    return isNaN(n) ? 0 : Math.max(0, n);
  }
  function setFish(n) {
    localStorage.setItem(LS_FISH, String(Math.max(0, Math.floor(n))));
    renderFishCount();
  }
  function addFish(n) { setFish(getFish() + (n || 0)); }

  function getFed(kind) {
    var key = kind === 'cat' ? LS_BOND_CAT : LS_BOND_PENG;
    var n = parseInt(localStorage.getItem(key) || '0', 10);
    return isNaN(n) ? 0 : Math.max(0, n);
  }
  function setFed(kind, n) {
    var key = kind === 'cat' ? LS_BOND_CAT : LS_BOND_PENG;
    localStorage.setItem(key, String(Math.max(0, Math.floor(n))));
  }

  /* ---------- 等级计算 ----------
     fed = 该动物累计被投喂的小鱼干数
     温和递增规则：到 Lv2 需 2；到 Lv3 需 2+4=6；到 Lv4 需 2+4+6=12 …
     到达等级 L 的累计阈值 cumulative(L) = (L-1)*L
  */
  function levelFromFed(fed) {
    var lv = 1;
    while (lv < MAX_LEVEL && fed >= cumulativeForLevel(lv + 1)) lv++;
    return lv;
  }

  // 当前这一级的进度：返回 {level, intoLevel, needForNext, pct, isMax}
  function progress(kind) {
    var fed = getFed(kind);
    var lv = levelFromFed(fed);
    if (lv >= MAX_LEVEL) {
      return { level: MAX_LEVEL, intoLevel: 0, needForNext: 0, pct: 100, isMax: true };
    }
    var base = cumulativeForLevel(lv);                          // 进入本级时的累计阈值
    var need = cumulativeForLevel(lv + 1) - base;               // 本级升到下一级需要的小鱼干
    var into = fed - base;
    var pct = need > 0 ? Math.min(100, Math.round(into / need * 100)) : 0;
    return { level: lv, intoLevel: into, needForNext: need, pct: pct, isMax: false };
  }

  /* ---------- 投喂 ----------
     返回结果对象，供 UI 决定播放什么动画：
     { ok, reason, leveled, fromLevel, toLevel, evolved, prog }
  */
  function feed(kind) {
    if (getFish() <= 0) {
      return { ok: false, reason: 'no_fish' };
    }
    var before = progress(kind);
    if (before.isMax) {
      // 满级仍可投喂表达爱意，但不再消耗用于升级；这里选择"满级不再消耗小鱼干"
      return { ok: true, reason: 'max', leveled: false, fromLevel: MAX_LEVEL, toLevel: MAX_LEVEL, evolved: false, prog: before };
    }
    // 扣 1 个小鱼干，喂给该动物
    setFish(getFish() - 1);
    setFed(kind, getFed(kind) + 1);

    var after = progress(kind);
    var leveled = after.level > before.level;
    var evolved = leveled && [3, 5, 10].indexOf(after.level) !== -1;
    return {
      ok: true, reason: 'fed',
      leveled: leveled,
      fromLevel: before.level,
      toLevel: after.level,
      evolved: evolved,
      prog: after
    };
  }

  /* ============================================================
     形态变身：往现有 SVG 上叠加配件层（保留原走动/眨眼动画）
     - 配件以独立 <g class="evo-acc"> 注入，升级时先清除旧的再加新的
     - 猫: Lv3 围巾 / Lv5 加花冠 / Lv10 整体换皮(星之喵)
     - 企鹅: Lv3 围巾 / Lv5 加贝雷帽 / Lv10 整体换皮(提督)
     ============================================================ */

  // —— 猫的配件（坐标基于 viewBox 0 0 32 32，与 index.html 中一致）——
  var CAT_SCARF = '' +
    '<rect x="8" y="15" width="12" height="2" fill="#e8607d"/>' +
    '<rect x="9" y="17" width="2" height="3" fill="#e8607d"/>' +
    '<rect x="8" y="16" width="12" height="1" fill="#c94462"/>';

  var CAT_CROWN = '' +
    '<rect x="7" y="3" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="11" y="2" width="2" height="2" fill="#ff8aa8"/>' +
    '<rect x="15" y="2" width="2" height="2" fill="#a3d977"/>' +
    '<rect x="19" y="3" width="2" height="2" fill="#ff8aa8"/>';

  // Lv10 星之喵：奶金皮毛 + 皇冠 + 紫眼 + 身上星纹（整体换装层）
  var CAT_STAR = '' +
    // 皮毛覆盖（盖住原白色身体/头）
    '<rect x="9" y="16" width="16" height="9" fill="#fbf3da"/>' +
    '<rect x="8" y="7" width="12" height="9" fill="#fbf3da"/>' +
    '<rect x="8" y="4" width="3" height="3" fill="#fbf3da"/>' +
    '<rect x="17" y="4" width="3" height="3" fill="#fbf3da"/>' +
    // 身上星纹
    '<rect x="11" y="18" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="18" y="20" width="2" height="2" fill="#ff8aa8"/>' +
    // 紫眼
    '<rect x="10" y="10" width="2" height="3" fill="#7b6cff"/>' +
    '<rect x="16" y="10" width="2" height="3" fill="#7b6cff"/>' +
    '<rect x="10" y="10" width="1" height="1" fill="#fff"/>' +
    '<rect x="16" y="10" width="1" height="1" fill="#fff"/>' +
    // 鼻子腮红
    '<rect x="13" y="13" width="2" height="1" fill="#ff9db0"/>' +
    '<rect x="9" y="13" width="1" height="1" fill="#ff9db0"/>' +
    '<rect x="18" y="13" width="1" height="1" fill="#ff9db0"/>' +
    // 紫围巾
    '<rect x="8" y="15" width="12" height="2" fill="#7b6cff"/>' +
    '<rect x="9" y="17" width="2" height="3" fill="#7b6cff"/>' +
    // 皇冠
    '<rect x="12" y="1" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="14" y="0" width="2" height="2" fill="#fff0b0"/>' +
    '<rect x="16" y="1" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="13" y="2" width="4" height="1" fill="#f0b400"/>';

  // —— 企鹅的配件（viewBox 0 0 30 32）——
  var PENG_SCARF = '' +
    '<rect x="7" y="15" width="16" height="2" fill="#4aa6e0"/>' +
    '<rect x="8" y="17" width="3" height="3" fill="#4aa6e0"/>' +
    '<rect x="7" y="16" width="16" height="1" fill="#2f86c2"/>';

  var PENG_BERET = '' +
    '<rect x="8" y="3" width="14" height="2" fill="#d8455f"/>' +
    '<rect x="7" y="5" width="16" height="2" fill="#d8455f"/>' +
    '<rect x="14" y="1" width="2" height="2" fill="#b83149"/>';

  // Lv10 提督企鹅：海军帽 + 深蓝制服 + 金纽扣肩章（整体换装层）
  var PENG_ADMIRAL = '' +
    // 深蓝制服盖住身体
    '<rect x="6" y="8" width="18" height="16" fill="#28365a"/>' +
    '<rect x="7" y="24" width="16" height="2" fill="#1f2a44"/>' +
    // 白脸 + 白肚
    '<rect x="9" y="8" width="12" height="7" fill="#fbf8f1"/>' +
    '<rect x="9" y="14" width="12" height="10" fill="#fbf8f1"/>' +
    // 海军军官帽
    '<rect x="7" y="2" width="16" height="2" fill="#1f2a44"/>' +
    '<rect x="6" y="4" width="18" height="3" fill="#28365a"/>' +
    '<rect x="12" y="3" width="6" height="2" fill="#ffd24a"/>' +
    '<rect x="14" y="3" width="2" height="2" fill="#ff6b6b"/>' +
    // 眼睛(高光)
    '<rect x="10" y="9" width="3" height="4" fill="#23262f"/>' +
    '<rect x="17" y="9" width="3" height="4" fill="#23262f"/>' +
    '<rect x="11" y="9" width="1" height="1" fill="#fff"/>' +
    '<rect x="18" y="9" width="1" height="1" fill="#fff"/>' +
    // 喙
    '<rect x="13" y="13" width="4" height="2" fill="#f4a73f"/>' +
    // 金色纽扣(肚皮排扣)
    '<rect x="11" y="15" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="17" y="15" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="14" y="17" width="2" height="2" fill="#ffd24a"/>' +
    '<rect x="14" y="20" width="2" height="2" fill="#ffd24a"/>' +
    // 腮红
    '<rect x="9" y="13" width="2" height="1" fill="#ffb3c1"/>' +
    '<rect x="19" y="13" width="2" height="1" fill="#ffb3c1"/>';

  // 返回某等级该叠加的配件 SVG 串（累积式：高级别含低级别配件）
  function accessoryFor(kind, level) {
    if (kind === 'cat') {
      if (level >= 10) return CAT_STAR;            // 整体换装
      if (level >= 5) return CAT_SCARF + CAT_CROWN;
      if (level >= 3) return CAT_SCARF;
      return '';
    } else {
      if (level >= 10) return PENG_ADMIRAL;        // 整体换装
      if (level >= 5) return PENG_SCARF + PENG_BERET;
      if (level >= 3) return PENG_SCARF;
      return '';
    }
  }

  // 把配件应用到首页对应动物的 SVG 上
  function applyForm(kind) {
    var hostId = kind === 'cat' ? 'heroCat' : 'heroPeng';
    var host = document.getElementById(hostId);
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg) return;
    var lv = progress(kind).level;

    // 移除旧配件层
    var old = svg.querySelector('.evo-acc');
    if (old) old.parentNode.removeChild(old);

    var acc = accessoryFor(kind, lv);
    if (!acc) return;

    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'evo-acc');
    g.innerHTML = acc;
    svg.appendChild(g);  // 叠在最上层
  }

  function applyAllForms() { applyForm('cat'); applyForm('peng'); }

  /* ============================================================
     升级弹窗 + 进度条动画 + Lv10 特效
     ============================================================ */
  function levelName(kind, level) {
    var CN = {
      cat: { 3: '围巾喵', 5: '花冠喵', 10: '星之喵 ✨' },
      peng: { 3: '围巾企鹅', 5: '贝雷帽企鹅', 10: '提督企鹅 ⚓' }
    };
    return (CN[kind] && CN[kind][level]) || (kind === 'cat' ? '小白猫' : '小企鹅');
  }

  // 展示升级进度条动画弹窗
  // opts: { kind, fromLevel, toLevel, evolved, fillFrom, fillTo }
  function showLevelUp(opts) {
    var kind = opts.kind;
    var isMax = opts.toLevel >= MAX_LEVEL;
    var animalCN = kind === 'cat' ? '小猫' : '企鹅';

    var backdrop = document.createElement('div');
    backdrop.className = 'evo-backdrop' + (isMax ? ' evo-max' : '');
    var newFormName = levelName(kind, opts.toLevel);
    var evolvedLine = opts.evolved
      ? '<div class="evo-newform">形态进化 → ' + newFormName + '</div>'
      : '';

    backdrop.innerHTML =
      '<div class="evo-card">' +
        '<div class="evo-title">' + animalCN + '亲密度提升!</div>' +
        '<div class="evo-anim" data-evo-stage></div>' +
        '<div class="evo-levelrow">' +
          '<span class="evo-lv-from">Lv' + opts.fromLevel + '</span>' +
          '<div class="evo-bar"><div class="evo-bar-fill" data-evo-bar></div></div>' +
          '<span class="evo-lv-to">Lv' + opts.toLevel + '</span>' +
        '</div>' +
        evolvedLine +
        '<button class="evo-btn" data-evo-close>▸ 收下</button>' +
      '</div>';

    document.body.appendChild(backdrop);

    // 进度条从满 -> 归零 -> 进入新等级（视觉上表现"升级了"）
    var bar = backdrop.querySelector('[data-evo-bar]');
    var stage = backdrop.querySelector('[data-evo-stage]');
    // 放入新形态的静态预览
    stage.innerHTML = formPreviewSVG(kind, opts.toLevel);

    requestAnimationFrame(function () {
      backdrop.classList.add('show');
      // 先填满旧进度
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(function () {
        // 然后归零再涨到新一级的起点，制造"跃迁"感
        bar.style.transition = 'width .5s ease';
        bar.style.width = '0%';
        setTimeout(function () { bar.style.width = '100%'; }, 520);
      });
    });

    if (isMax) launchConfetti(backdrop);

    backdrop.querySelector('[data-evo-close]').addEventListener('click', function () {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.remove(); }, 300);
    });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        backdrop.classList.remove('show');
        setTimeout(function () { backdrop.remove(); }, 300);
      }
    });
  }

  // 弹窗里展示的新形态静态预览 SVG
  function formPreviewSVG(kind, level) {
    if (kind === 'cat') {
      var catBase =
        '<rect x="9" y="16" width="16" height="9" fill="#f4f1ea"/>' +
        '<rect x="11" y="25" width="3" height="2" fill="#f4f1ea"/>' +
        '<rect x="19" y="25" width="3" height="2" fill="#f4f1ea"/>' +
        '<rect x="8" y="7" width="12" height="10" fill="#f4f1ea"/>' +
        '<rect x="8" y="4" width="3" height="3" fill="#f4f1ea"/>' +
        '<rect x="17" y="4" width="3" height="3" fill="#f4f1ea"/>' +
        '<rect x="10" y="10" width="2" height="3" fill="#3b6b48"/>' +
        '<rect x="16" y="10" width="2" height="3" fill="#3b6b48"/>' +
        '<rect x="10" y="10" width="1" height="1" fill="#fff"/>' +
        '<rect x="16" y="10" width="1" height="1" fill="#fff"/>' +
        '<rect x="13" y="13" width="2" height="1" fill="#ffaeba"/>';
      return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" width="96" height="96">' +
        catBase + accessoryFor('cat', level) + '</svg>';
    } else {
      var pengBase =
        '<rect x="9" y="27" width="5" height="2" fill="#f4a73f"/>' +
        '<rect x="16" y="27" width="5" height="2" fill="#f4a73f"/>' +
        '<rect x="6" y="8" width="18" height="16" fill="#2d3142"/>' +
        '<rect x="9" y="8" width="12" height="7" fill="#fbf8f1"/>' +
        '<rect x="9" y="14" width="12" height="10" fill="#fbf8f1"/>' +
        '<rect x="10" y="9" width="3" height="4" fill="#23262f"/>' +
        '<rect x="17" y="9" width="3" height="4" fill="#23262f"/>' +
        '<rect x="13" y="13" width="4" height="2" fill="#f4a73f"/>' +
        '<rect x="4" y="11" width="3" height="9" fill="#2d3142"/>' +
        '<rect x="23" y="11" width="3" height="9" fill="#2d3142"/>';
      return '<svg viewBox="0 0 30 32" shape-rendering="crispEdges" width="96" height="96">' +
        pengBase + accessoryFor('peng', level) + '</svg>';
    }
  }

  // Lv10 满级彩带特效
  function launchConfetti(host) {
    var colors = ['#ffd24a', '#ff8aa8', '#7b6cff', '#4aa6e0', '#a3d977', '#ff6b6b'];
    for (var i = 0; i < 28; i++) {
      var p = document.createElement('div');
      p.className = 'evo-confetti';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      host.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 3200); })(p);
    }
  }

  /* ---------- 小鱼干计数 UI 渲染 ---------- */
  function renderFishCount() {
    var els = document.querySelectorAll('[data-fish-count]');
    var n = getFish();
    els.forEach(function (el) { el.textContent = n; });
  }

  /* ---------- 暴露接口 ---------- */
  global.Companion = {
    getFish: getFish,
    addFish: addFish,
    setFish: setFish,
    feed: feed,
    progress: progress,
    levelFromFed: levelFromFed,
    getFed: getFed,
    renderFishCount: renderFishCount,
    applyForm: applyForm,
    applyAllForms: applyAllForms,
    showLevelUp: showLevelUp,
    levelName: levelName,
    MAX_LEVEL: MAX_LEVEL,
    costFromTo: costFromTo
  };
})(window);
