// 游戏三：颜色干扰（执行力）- Stroop变体
class ExecutiveGame {
  // 测试台变体配置
  static variants = [
    { id: 'incongruent', name: '纯不一致', params: { mix: 0 } },
    { id: 'mixed', name: '混合(1/3一致)', params: { mix: 0.33 } },
    { id: 'switch', name: '切换任务', params: { mix: 0.33, taskSwitch: true } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (ExecutiveGame.variants.find(x => x.id === variantId) || ExecutiveGame.variants[0]).params;
    this.mix = v.mix || 0;            // 一致题占比（0=全不一致）
    this.taskSwitch = v.taskSwitch || false; // 切换任务模式
    this.correctCount = 0;
    this.totalAnswered = 0;
    this.duration = 45;
    this.timer = null;
    this.currentColor = null;
    this.answered = false;
    this.reactionTimes = [];
    this.lastTime = 0;
    this.consistent = false;
  }

  init() {
    const hint = this.taskSwitch
      ? '看词的颜色 → 选对应颜色；出现 <b>圆点</b> 时改选圆点颜色（任务切换）'
      : this.mix > 0
        ? '选择文字的<strong>显示颜色</strong>（部分文字颜色与含义一致）'
        : '选择文字的<strong>显示颜色</strong>，而非文字含义';
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🎨 颜色干扰</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="exec-correct">0</span></div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="exec-timer">${this.duration}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="exec-body">
          <div style="color:var(--text-light);font-size:14px;margin-bottom:16px;">${hint}</div>
          <div id="exec-task-indicator" style="font-size:16px;font-weight:700;color:var(--primary);min-height:24px;margin-bottom:8px;"></div>
          <div class="stroop-word" id="exec-word"></div>
          <div class="color-buttons" id="exec-colors">
            <button class="color-btn color-btn--red" data-color="red"></button>
            <button class="color-btn color-btn--blue" data-color="blue"></button>
            <button class="color-btn color-btn--green" data-color="green"></button>
            <button class="color-btn color-btn--yellow" data-color="yellow"></button>
          </div>
        </div>
      </div>
    `;
  }

  start() {
    this.showNextWord();

    // 绑定颜色按钮
    document.getElementById('exec-colors').addEventListener('click', (e) => {
      const btn = e.target.closest('.color-btn');
      if (!btn || this.answered) return;
      this.answered = true;

      const chosen = btn.dataset.color;
      const reaction = Date.now() - this.lastTime;
      this.reactionTimes.push(reaction);
      this.totalAnswered++;

      if (chosen === this.currentColor) {
        this.correctCount++;
        btn.classList.add('correct');
        document.getElementById('exec-correct').textContent = this.correctCount;
      } else {
        btn.classList.add('wrong');
      }

      setTimeout(() => {
        btn.classList.remove('correct', 'wrong');
        this.showNextWord();
      }, 300);
    });

    // 游戏计时
    this.timer = Utils.createTimer(this.duration, (remaining) => {
      const timerEl = document.getElementById('exec-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  showNextWord() {
    this.answered = false;
    const colors = ['red', 'blue', 'green', 'yellow'];
    const colorNames = { red: '红色', blue: '蓝色', green: '绿色', yellow: '黄色' };
    const colorHex = { red: '#F56C6C', blue: '#4A90D9', green: '#67C23A', yellow: '#E6A23C' };

    const wordColor = Utils.pick(colors);
    let displayColor;

    if (this.taskSwitch) {
      // 切换任务：按比例随机决定本次任务是"看词"还是"看色块"
      this.task = Math.random() < 0.5 ? 'word' : 'block';
      displayColor = Utils.pick(colors.filter(c => c !== wordColor));
    } else if (this.mix > 0 && Math.random() < this.mix) {
      // 一致题：含义与显示色相同
      displayColor = wordColor;
      this.consistent = true;
    } else {
      // 不一致题
      displayColor = Utils.pick(colors.filter(c => c !== wordColor));
      this.consistent = false;
    }
    this.currentColor = displayColor;

    const wordEl = document.getElementById('exec-word');
    const indicatorEl = document.getElementById('exec-task-indicator');

    if (this.taskSwitch && this.task === 'block') {
      // 显示色块任务：不显示文字，只显示色块
      wordEl.textContent = '●';
      wordEl.style.color = colorHex[displayColor];
      indicatorEl.textContent = '选圆点颜色';
    } else {
      wordEl.textContent = colorNames[wordColor];
      wordEl.style.color = colorHex[displayColor];
      indicatorEl.textContent = this.taskSwitch ? '选文字颜色' : '';
    }

    wordEl.classList.remove('scale-in');
    void wordEl.offsetWidth;
    wordEl.classList.add('scale-in');

    this.lastTime = Date.now();
  }

  end() {
    if (this.timer) this.timer.stop();
    this.answered = true;

    const score = Math.min(100, Math.round(this.correctCount * 5));
    const avgReaction = this.reactionTimes.length > 0
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : 0;

    this.onComplete({
      score,
      detail: `正确 ${this.correctCount} 题，平均反应 ${avgReaction}ms`,
      correctCount: this.correctCount,
      avgReaction
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
