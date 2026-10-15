// 数据存储
const Store = {
  KEY: 'brain_health_data',

  _data: null,

  _load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this._data = raw ? JSON.parse(raw) : this._default();
    } catch {
      this._data = this._default();
    }
    return this._data;
  },

  _default() {
    return {
      nickname: '',
      ageGroup: '',
      results: null,
      history: []
    };
  },

  _save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
  },

  get() {
    return this._data || this._load();
  },

  setUserInfo(nickname, ageGroup) {
    const data = this.get();
    data.nickname = nickname;
    data.ageGroup = ageGroup;
    this._save();
  },

  saveResults(results) {
    const data = this.get();
    const scores = Object.values(results).filter(r => r && typeof r.score === 'number');
    const avg = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : 0;
    data.results = {
      ...results,
      averageScore: avg,
      timestamp: new Date().toISOString()
    };
    // 历史记录保留5条
    data.history.unshift(data.results);
    if (data.history.length > 5) data.history = data.history.slice(0, 5);
    this._save();
  },

  getResults() {
    return this.get().results;
  },

  getHistory() {
    return this.get().history || [];
  },

  clearResults() {
    const data = this.get();
    data.results = null;
    this._save();
  }
};
