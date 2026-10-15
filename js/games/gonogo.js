// 新游戏：Go/No-Go 反应抑制（执行功能）— 参考 vekteo/GoNoGo_jsPsych（Bezdjian 2009 范式）
// 玩法：屏幕快速出现刺激。出现"GO"刺激（绿色圆）→ 点击；出现"NO-GO"刺激（红色方块）→ 不点击
// 测反应速度与冲动控制（漏点=漏报，误点=虚报）
class GoNoGoGame {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准70/30', params: { goRatio: 0.7, total: 40, interval: 1000 } },
    { id: 'challenge', name: '挑战50/50', params: { goRatio: 0.5, total: 40, interval: 800 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (GoNoGoGame.variants.find(x => x.id === variantId) || GoNoGoGame.variants[0]).params;
    this.goRatio = v.goRatio || 0.7;
    this.total = v.total || 40;
    this.interval = v.interval || 1000;
    this.trialIndex = 0;
    this.hits = 0;      // 正确点击 GO
    this.misses = 0;    // 漏点 GO
    this.falseAlarms = 0; // 误点 NO-GO
    this.correctRejects = 0; // 正确不点 NO-GO
    this.timers = [];
    this.running = false;
    this.trialStart = 0;
    this.reactionTimes = [];
    this.trials = [];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🎯 Go/No-Go</div>
          <div class="game__info">
            <div class="game__stat">进度 <span class="game__stat-value" id="gn-progress">0</span>/${this.total}</div>
          </div>
        </div>
        <div class="game__body" id="gn-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:16px;text-align:center;">
            看到 <b style="color:var(--success);">绿色圆</b> 快速点击<br>
            看到 <b style="color:var(--danger);">红色方块</b> 千万不要点！
          </div>
          <div id="gn-stimulus" style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;"></div>
          <div id="gn-feedback" style="font-size:14px;min-height:20px;margin-top:16px;"></div>
        </div>
      </div>
    `;
  }

  start() {
    // 生成刺激序列
    this.trials = [];
    const nGo = Math.round(this.total * this.goRatio);
    for (let i = 0; i < this.total; i++) {
      this.trials.push(i < nGo ? 'go' : 'nogo');
    }
    // 打乱，但避免开头连续 NO-GO 过多（前2个保证至少1个GO，避免用户还没反应）
    this.trials = Utils.shuffle(this.trials);
    if (!this.trials.slice(0, 2).includes('go')) {
      this.trials[0] = 'go';
    }

    this.running = true;
    this.showTrial();
  }

  showTrial() {
    if (!this.running || this.trialIndex >= this.total) {
      this.end();
      return;
    }

    const type = this.trials[this.trialIndex];
    const stimulus = document.getElementById('gn-stimulus');
    const feedback = document.getElementById('gn-feedback');

    // 显示刺激
    const isGo = type === 'go';
    stimulus.innerHTML = isGo
      ? `<div style="width:90px;height:90px;border-radius:50%;background:var(--success);"></div>`
      : `<div style="width:80px;height:80px;background:var(--danger);border-radius:8px;"></div>`;

    feedback.textContent = '';
    this.trialStart = Date.now();
    this.currentType = type;
    this.responded = false;

    // 绑定点击（事件委托到 body）
    if (!this._clickHandler) {
      this._clickHandler = () => this.handleResponse();
      document.getElementById('gn-body').addEventListener('click', this._clickHandler);
    }

    // 刺激显示时长：GO 800ms，NO-GO 600ms（太短用户来不及反应）
    const showTime = isGo ? 1000 : 800;
    const t = setTimeout(() => {
      // 未响应
      if (!this.responded) {
        if (isGo) {
          this.misses++;
          feedback.textContent = '漏了！';
          feedback.style.color = 'var(--warning)';
        } else {
          this.correctRejects++;
        }
        stimulus.innerHTML = '';
        this.advance();
      }
    }, showTime);
    this.timers.push(t);
  }

  handleResponse() {
    if (this.responded || !this.running) return;
    this.responded = true;

    const rt = Date.now() - this.trialStart;
    const stimulus = document.getElementById('gn-stimulus');
    const feedback = document.getElementById('gn-feedback');

    if (this.currentType === 'go') {
      this.hits++;
      this.reactionTimes.push(rt);
      feedback.textContent = '✓';
      feedback.style.color = 'var(--success)';
      stimulus.innerHTML = '';
    } else {
      this.falseAlarms++;
      feedback.textContent = '✗ 不该点！';
      feedback.style.color = 'var(--danger)';
      stimulus.innerHTML = '';
    }

    this.advance();
  }

  advance() {
    this.trialIndex++;
    document.getElementById('gn-progress').textContent = this.trialIndex;
    const t = setTimeout(() => this.showTrial(), this.interval);
    this.timers.push(t);
  }

  end() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    const stimulus = document.getElementById('gn-stimulus');
    if (stimulus) stimulus.innerHTML = '';

    // 计分：命中率 + 虚报率惩罚
    const hitRate = this.total > 0 ? this.hits / Math.max(1, this.trials.filter(t => t === 'go').length) : 0;
    const faRate = this.falseAlarms / Math.max(1, this.trials.filter(t => t === 'nogo').length);

    // 满分100：命中率80分 + 抑制正确20分，虚报扣分
    let score = hitRate * 70 + (1 - faRate) * 30;
    score = Math.min(100, Math.max(0, Math.round(score * 100) / 100));

    // 平均反应时（参考指标）
    const avgRt = this.reactionTimes.length
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : 0;

    this.onComplete({
      score: Math.round(score),
      detail: `命中 ${this.hits} 漏点 ${this.misses} 误点 ${this.falseAlarms}${avgRt ? `，平均反应 ${avgRt}ms` : ''}`,
      hits: this.hits,
      misses: this.misses,
      falseAlarms: this.falseAlarms,
      avgReaction: avgRt
    });
  }

  destroy() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    const body = document.getElementById('gn-body');
    if (body && this._clickHandler) {
      body.removeEventListener('click', this._clickHandler);
    }
  }
}
