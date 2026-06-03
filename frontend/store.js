/* =========================================================
   TASTE DIARY · 本地数据层(localStorage)
   ---------------------------------------------------------
   无账号、无登录。所有历史记录保存在本机浏览器,
   同一台电脑同一浏览器自动可见。
   提供与原后端 /api/history、/api/monthly 等价的功能。
   ========================================================= */

const Store = (() => {
  const HISTORY_KEY = 'sm_history';   // 历史记录数组
  const MAX_RECORDS = 60;             // 与原后端保持一致,最多保留 60 条
  const MONTHLY_MIN = 7;              // 生成月度趋势所需最少餐数

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function writeHistory(arr) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      // 超出配额(图片 base64 占空间)时,丢弃最旧的记录后重试
      console.warn('[Store] 保存失败,尝试精简后重试', e);
      try {
        const trimmed = arr.slice(0, Math.max(10, Math.floor(arr.length / 2)));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
        return true;
      } catch (e2) {
        console.error('[Store] 仍然保存失败', e2);
        return false;
      }
    }
  }

  // 保存一条记录(最新的排在最前)
  function save(record) {
    if (!record) return false;
    const all = readHistory();
    // 去重:同 id 的先移除再插入(支持「重新保存」同一份报告)
    const filtered = all.filter(r => r.id !== record.id);
    filtered.unshift(record);
    return writeHistory(filtered.slice(0, MAX_RECORDS));
  }

  function getAll() {
    return readHistory();
  }

  function getById(id) {
    return readHistory().find(r => r.id === id) || null;
  }

  function remove(id) {
    const all = readHistory();
    return writeHistory(all.filter(r => r.id !== id));
  }

  function clear() {
    try { localStorage.removeItem(HISTORY_KEY); return true; }
    catch { return false; }
  }

  // 昵称(纯本地,可留空)
  const NAME_KEY = 'sm_name';
  function getName() {
    try { return localStorage.getItem(NAME_KEY) || ''; }
    catch { return ''; }
  }
  function setName(name) {
    try {
      const v = (name || '').trim();
      if (v) localStorage.setItem(NAME_KEY, v);
      else localStorage.removeItem(NAME_KEY);
      return true;
    } catch { return false; }
  }

  // 计算月度趋势(逻辑搬自原后端 /api/monthly)
  function monthly() {
    const records = readHistory();
    if (records.length < MONTHLY_MIN) {
      return {
        ok: false,
        err: 'need_more_data',
        count: records.length,
        required: MONTHLY_MIN
      };
    }
    const recent30 = records.slice(0, 30).reverse();
    const cals = recent30.map(r => r.evaluation.totals.cal);
    const moods = recent30.map(r => r.evaluation.psy.mood);
    const stresses = recent30.map(r => r.evaluation.psy.stress);
    const balances = recent30.map(r => r.evaluation.psy.balance);
    const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return {
      ok: true,
      count: records.length,
      series: { cals, moods, stresses, balances },
      avg: {
        cal: avg(cals),
        mood: avg(moods),
        stress: avg(stresses),
        balance: avg(balances)
      }
    };
  }

  return { save, getAll, getById, remove, clear, monthly, getName, setName };
})();

window.Store = Store;
