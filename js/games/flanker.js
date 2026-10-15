// 新游戏F：Flanker 侧抑制（注意力/抑制控制）— 参考 TestMyBrain TMB_FlankerAttention
// 玩法：屏幕显示一排箭头，中间箭头指向左或右，两侧箭头可能与中间一致（一致）或不一致（干扰），
//       用户判断中间箭头的指向（忽略两侧）
class FlankerGame {
  // 测试台变体配置
  static variants = [
    { id: 'arrows', name: '箭头干扰', params: { mode: 'arrows', total: 10 } },
    { id: 'congruent', name: '一致/不一致混合', params: { mode: 'mixed', total: 12 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (FlankerGame.variants.find(x => x.id === variantId) || FlankerGame.variants[0]).params;
    this.mode = v.mode || 'arrows';
    this.totalQuestions = v.total || 10;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.answered = false;
    this.reactionTimes = [];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🎯 Flanker 侧抑制</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="fl-correct">0</span></div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="fl-timer">--</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="fl-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">只看<b>中间</b>箭头的指向，忽略两侧干扰</div>
          <div id="fl-stimulus" class="flanker-stimulus"></div>
          <div class="options-grid" style="max-width:280px;margin-top:24px;" id="fl-options">
            <button class="option-btn" data-ans="left">← 左</button>
            <button class="option-btn" data-ans="right">→ 右</button>
          </div>
          <div style="font-size:12px;color:var(--text-light);margin-top:12px;" id="fl-progress"></div>
        </div>
      </div>
    `;
  }

  start() {
    this.showQuestion();
  }

  showQuestion() {
    if (this.currentQ >= this.totalQuestions) {
      this.end();
      return;
    }
    this.answered = false;
    const stim = document.getElementById('fl-stimulus');
    const progress = document.getElementById('fl-progress');
    progress.textContent = `第 ${this.currentQ + 1}/${this.totalQuestions} 题`;

    // 中间方向随机，两侧 50% 一致 50% 不一致
    const centerDir = Math.random() < 0.5 ? 'left' : 'right';
    const flankerDir = (this.mode === 'arrows' || Math.random() < 0.5) ? centerDir : (centerDir === 'left' ? 'right' : 'left');
    const arrow = (dir) => dir === 'left' ? '←' : '→';

    // 5 个箭头：两侧 + 中间（中间高亮）
    stim.innerHTML = `
      <div style="display:flex;gap:8px;font-size:40px;">
        ${arrow(flankerDir)}
        ${arrow(flankerDir)}
        <span style="color:var(--primary);font-weight:800;">${arrow(centerDir)}</span>
        ${arrow(flankerDir)}
        ${arrow(flankerDir)}
      </div>
    `;

    stim.classList.remove('scale-in');
    void stim.offsetWidth;
    stim.classList.add('scale-in');

    this.lastTime = Date.now();

    // 绑定选项
    document.getElementById('fl-options').onclick = (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.answered) return;
      this.answered = true;
      const chosen = btn.dataset.ans;
      const reaction = Date.now() - this.lastTime;
      this.reactionTimes.push(reaction);

      if (chosen === centerDir) {
        this.correctCount++;
        btn.classList.add('correct');
        document.getElementById('fl-correct').textContent = this.correctCount;
      } else {
        btn.classList.add('wrong');
      }

      setTimeout(() => {
        this.currentQ++;
        this.showQuestion();
      }, 600);
    };

    // 单题计时 6 秒
    if (this.timer) this.timer.stop();
    let timeLeft = 6;
    const timerEl = document.getElementById('fl-timer');
    timerEl.textContent = timeLeft;
    this.timer = Utils.createTimer(timeLeft, (remaining) => {
      timerEl.textContent = remaining;
      if (remaining <= 3) timerEl.classList.add('warning');
    }, () => {
      if (!this.answered) {
        this.answered = true;
        this.currentQ++;
        this.showQuestion();
      }
    });
  }

  end() {
    if (this.timer) this.timer.stop();
    const score = Math.min(100, Math.round(this.correctCount * (100 / this.totalQuestions)));
    const avgReaction = this.reactionTimes.length > 0
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : 0;
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.totalQuestions}，平均反应 ${avgReaction}ms`,
      correctCount: this.correctCount,
      avgReaction
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
