// 新游戏A：舒尔特方格（注意力/视知觉）— 参考 drafterleo/schulte & freefocusgames
// 玩法：5x5 方格随机填 1-25，按顺序依次点击数字，用时越短越好
class SchulteGame {
  // 测试台变体配置
  static variants = [
    { id: 'classic', name: '经典5x5', params: { size: 5, mode: 'classic' } },
    { id: 'challenge', name: '挑战4x4', params: { size: 4, mode: 'challenge' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (SchulteGame.variants.find(x => x.id === variantId) || SchulteGame.variants[0]).params;
    this.size = v.size || 5;
    this.mode = v.mode || 'classic';
    this.total = this.size * this.size;
    this.current = 1;
    this.startTime = 0;
    this.timer = null;
    this.numbers = [];
    this.duration = this.mode === 'challenge' ? 60 : 90;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">👀 舒尔特方格</div>
          <div class="game__info">
            <div class="game__stat">当前 <span class="game__stat-value" id="sch-current">1</span>/${this.total}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="sch-timer">${this.duration}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="sch-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">按从小到大的顺序点击数字（1 → ${this.total}）</div>
          <div id="sch-grid" style="display:grid;grid-template-columns:repeat(${this.size},1fr);gap:8px;width:100%;max-width:320px;"></div>
          <div id="sch-done" style="display:none;font-size:20px;font-weight:700;color:var(--success);margin-top:20px;"></div>
        </div>
      </div>
    `;
    this.generateGrid();
  }

  generateGrid() {
    // 生成 1..total 的随机排列
    this.numbers = Utils.shuffle(Array.from({ length: this.total }, (_, i) => i + 1));
    const grid = document.getElementById('sch-grid');
    grid.innerHTML = this.numbers.map((n, i) =>
      `<button class="schulte-cell" data-idx="${i}" data-val="${n}">${n}</button>`
    ).join('');
  }

  start() {
    this.startTime = Date.now();

    document.getElementById('sch-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.schulte-cell');
      if (!btn || btn.disabled) return;

      const val = parseInt(btn.dataset.val);
      if (val === this.current) {
        // 正确：标记为已点击（变灰不可点）
        btn.classList.add('done');
        btn.disabled = true;
        this.current++;
        document.getElementById('sch-current').textContent = this.current;

        if (this.current > this.total) {
          this.end();
        }
      } else {
        // 错误：闪烁红色
        btn.classList.add('flash-wrong');
        setTimeout(() => btn.classList.remove('flash-wrong'), 300);
      }
    });

    // 倒计时
    this.timer = Utils.createTimer(this.duration, (remaining) => {
      const timerEl = document.getElementById('sch-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  end() {
    if (this.timer) this.timer.stop();

    const elapsed = (Date.now() - this.startTime) / 1000;
    const completed = this.current - 1; // 已完成数量

    const doneEl = document.getElementById('sch-done');
    if (completed >= this.total) {
      doneEl.style.display = 'block';
      doneEl.textContent = `🎉 完成！用时 ${elapsed.toFixed(1)} 秒`;
    } else {
      doneEl.style.display = 'block';
      doneEl.textContent = `⏱ 时间到！已完成 ${completed}/${this.total}`;
    }

    // 计分：完成度为基础分，用时快加分
    let score = completed / this.total * 60;
    if (completed >= this.total) {
      // 全部完成：用时越短分越高（<60s 满分）
      score += Math.max(0, 40 - (elapsed - 20) * 0.5);
    }
    score = Math.min(100, Math.max(0, Math.round(score)));

    this.onComplete({
      score,
      detail: `完成 ${completed}/${this.total}，用时 ${elapsed.toFixed(1)}s`,
      completed,
      elapsed
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
