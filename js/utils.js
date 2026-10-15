// 工具函数
const Utils = {
  // 随机整数 [min, max]
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 随机浮点 [min, max)
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // 打乱数组（Fisher-Yates）
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // 从数组中随机取一个
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // 从数组中随机取 n 个不重复
  pickN(arr, n) {
    return Utils.shuffle(arr).slice(0, n);
  },

  // 生成不重复的随机整数数组
  randInts(min, max, count) {
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);
    return Utils.pickN(pool, count);
  },

  // 计时器
  createTimer(duration, onTick, onEnd) {
    let remaining = duration;
    const interval = setInterval(() => {
      remaining--;
      if (onTick) onTick(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onEnd) onEnd();
      }
    }, 1000);
    return {
      stop() { clearInterval(interval); },
      getRemaining() { return remaining; }
    };
  },

  // 延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 等级判定
  getLevel(score) {
    if (score >= 90) return { label: '优秀', class: 'excellent', color: '#67C23A' };
    if (score >= 70) return { label: '良好', class: 'good', color: '#4A90D9' };
    if (score >= 50) return { label: '一般', class: 'normal', color: '#E6A23C' };
    return { label: '需关注', class: 'concern', color: '#F56C6C' };
  },

  // 格式化时间
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  }
};
