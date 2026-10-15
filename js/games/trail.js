// 新游戏D：连线测试 Trail Making（执行功能）— 参考 TestMyBrain TMB_TrailMaking
// 玩法A（数字连线）：依次点击 1→2→3...→25 散落的数字
// 玩法B（字母数字交替）：1→A→2→B→3→C... 交替点击
class TrailGame {
  // 测试台变体配置
  static variants = [
    { id: 'numbers', name: '数字连线', params: { mode: 'numbers' } },
    { id: 'alternate', name: '字母交替', params: { mode: 'alternate' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (TrailGame.variants.find(x => x.id === variantId) || TrailGame.variants[0]).params;
    this.mode = v.mode || 'numbers';
    this.current = 0; // 当前目标索引
    this.startTime = 0;
    this.timer = null;
    this.errors = 0;
    this.duration = this.mode === 'alternate' ? 90 : 60;
  }

  init() {
    const isAlt = this.mode === 'alternate';
    const seq = isAlt ? this.buildAltSequence() : Array.from({ length: 15 }, (_, i) => i + 1);
    this.sequence = seq;

    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔗 ${isAlt ? '字母交替连线' : '数字连线'}</div>
          <div class="game__info">
            <div class="game__stat">当前 <span class="game__stat-value" id="tr-current">${seq[0]}</span></div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="tr-timer">${this.duration}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="tr-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">
            ${isAlt ? '按顺序交替点击：1→A→2→B→3→C...' : '按从小到大顺序点击数字'}
          </div>
          <div id="tr-board"></div>
        </div>
      </div>
    `;
    this.renderBoard();
  }

  // 交替序列：1,A,2,B,3,C,... (数字 + 字母)
  buildAltSequence() {
    const seq = [];
    for (let i = 1; i <= 10; i++) {
      seq.push(i);
      seq.push(String.fromCharCode(64 + i)); // A,B,C...
    }
    return seq;
  }

  renderBoard() {
    const board = document.getElementById('tr-board');
    // 4x5 网格布局，随机分布
    const gridCols = 4, gridRows = 5;
    const positions = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        positions.push({ x: 12 + c * 24, y: 14 + r * 16 });
      }
    }
    const shuffled = Utils.shuffle(positions);

    board.innerHTML = this.sequence.map((item, i) => {
      const pos = shuffled[i % shuffled.length];
      const isNum = typeof item === 'number';
      const cls = isNum ? 'trail-cell--num' : 'trail-cell--letter';
      return `<button class="trail-cell ${cls}" data-idx="${i}" data-val="${item}" style="left:${pos.x}%;top:${pos.y}%;">${item}</button>`;
    }).join('');

    // 绑定点击
    board.addEventListener('click', (e) => {
      const btn = e.target.closest('.trail-cell');
      if (!btn || btn.classList.contains('done')) return;
      this.handleClick(btn);
    });
  }

  handleClick(btn) {
    const idx = parseInt(btn.dataset.idx);
    const val = this.sequence[idx];

    if (idx === this.current) {
      // 正确
      btn.classList.add('done');
      btn.disabled = true;
      this.current++;
      if (this.current >= this.sequence.length) {
        this.end();
      } else {
        document.getElementById('tr-current').textContent = this.sequence[this.current];
      }
    } else {
      // 错误
      this.errors++;
      btn.classList.add('flash-wrong');
      setTimeout(() => btn.classList.remove('flash-wrong'), 300);
    }
  }

  start() {
    this.startTime = Date.now();
    this.timer = Utils.createTimer(this.duration, (remaining) => {
      const timerEl = document.getElementById('tr-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  end() {
    if (this.timer) this.timer.stop();
    const elapsed = (Date.now() - this.startTime) / 1000;
    const completed = this.current;

    // 计分：完成比例为主，错误扣分，速度快加分
    let score = completed / this.sequence.length * 70;
    score -= this.errors * 2;
    if (completed >= this.sequence.length) {
      score += Math.max(0, 30 - elapsed * 0.3);
    }
    score = Math.min(100, Math.max(0, Math.round(score)));

    this.onComplete({
      score,
      detail: `完成 ${completed}/${this.sequence.length}，错误 ${this.errors} 次，用时 ${elapsed.toFixed(1)}s`,
      completed,
      errors: this.errors,
      elapsed
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
