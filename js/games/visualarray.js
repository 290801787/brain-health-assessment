// 新游戏B：视觉阵列记忆（视觉工作记忆）— 参考 working_memory_tests 的 Cowan 范式
// 玩法：先显示若干彩色方块，短暂记忆后消失；然后显示一个圆圈圈住某个位置的方块，
//       判断圈中颜色是否与原显示相同（或从色板选出对应颜色）
class VisualArrayGame {
  // 测试台变体配置
  static variants = [
    { id: 'judge', name: '颜色判断', params: { mode: 'judge' } },
    { id: 'recall', name: '颜色回忆', params: { mode: 'recall' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (VisualArrayGame.variants.find(x => x.id === variantId) || VisualArrayGame.variants[0]).params;
    this.mode = v.mode || 'judge';
    this.totalQuestions = 8;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.setSize = 5;
    this.colors = ['#F56C6C', '#4A90D9', '#67C23A', '#E6A23C', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🖼 视觉阵列</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="va-correct">0</span>/${this.totalQuestions}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="va-timer">--</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="va-body"></div>
      </div>
    `;
  }

  start() {
    this.showQuestion();
  }

  // 生成一题：随机颜色方块布局
  generateTrial() {
    const positions = [];
    const used = new Set();
    for (let i = 0; i < this.setSize; i++) {
      // 在 3x3 网格中随机选不重复位置
      let pos;
      do { pos = Utils.randInt(0, 8); } while (used.has(pos));
      used.add(pos);
      positions.push({ pos, color: Utils.pick(this.colors) });
    }
    // 判断模式：随机选一个位置作为"测试位"，50% 概率颜色改变
    const testIdx = Utils.randInt(0, this.setSize - 1);
    const testPos = positions[testIdx].pos;
    const originalColor = positions[testIdx].color;
    let newColor = originalColor;
    let changed = false;
    if (this.mode === 'judge') {
      changed = Math.random() < 0.5;
      if (changed) {
        // 换一个不同颜色
        do { newColor = Utils.pick(this.colors); } while (newColor === originalColor);
      }
    }
    return { positions, testPos, originalColor, newColor, changed };
  }

  showQuestion() {
    if (this.currentQ >= this.totalQuestions) {
      this.end();
      return;
    }

    const body = document.getElementById('va-body');
    const trial = this.generateTrial();

    // 阶段1：显示彩色方块 1.5 秒
    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">记忆这些方块的颜色（1.5秒）</div>
      <div class="va-grid" id="va-grid"></div>
    `;
    const grid = document.getElementById('va-grid');
    grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
      const cell = trial.positions.find(p => p.pos === i);
      return `<div class="va-cell" data-pos="${i}" style="${cell ? `background:${cell.color};` : ''}"></div>`;
    }).join('');

    // 1.5 秒后进入回忆阶段
    setTimeout(() => {
      if (this.currentQ >= this.totalQuestions) return;
      this.showRecall(trial);
    }, 1500);
  }

  // 阶段2：显示测试界面
  showRecall(trial) {
    const body = document.getElementById('va-body');

    if (this.mode === 'judge') {
      // 判断模式：显示一个圈住的方块，问颜色是否一致
      body.innerHTML = `
        <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">圈中的方块颜色和刚才一样吗？</div>
        <div class="va-grid" id="va-grid"></div>
        <div class="options-grid" style="margin-top:24px;" id="va-options">
          <button class="option-btn" data-ans="same">✅ 一样</button>
          <button class="option-btn" data-ans="diff">❌ 不一样</button>
        </div>
      `;
      const grid = document.getElementById('va-grid');
      grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const cell = trial.positions.find(p => p.pos === i);
        return `<div class="va-cell" data-pos="${i}" style="${cell ? `background:${cell.color};` : ''}"></div>`;
      }).join('');
      // 在测试位置加圆圈标记
      const testCell = grid.querySelector(`.va-cell[data-pos="${trial.testPos}"]`);
      if (testCell) testCell.classList.add('va-test');

      document.getElementById('va-options').addEventListener('click', (e) => {
        const btn = e.target.closest('.option-btn');
        if (!btn || this.answered) return;
        this.answered = true;
        const chosen = btn.dataset.ans;
        const correct = (chosen === 'same') === !trial.changed;
        this.handleAnswer(correct, btn);
      });
    } else {
      // 回忆模式：圈住一个位置，从色板选原始颜色
      body.innerHTML = `
        <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">圈中方块刚才是什么颜色？</div>
        <div class="va-grid" id="va-grid"></div>
        <div class="color-buttons" id="va-colors" style="margin-top:24px;"></div>
      `;
      const grid = document.getElementById('va-grid');
      grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const cell = trial.positions.find(p => p.pos === i);
        return `<div class="va-cell" data-pos="${i}" style="${cell ? `background:${cell.color};` : ''}"></div>`;
      }).join('');
      const testCell = grid.querySelector(`.va-cell[data-pos="${trial.testPos}"]`);
      if (testCell) testCell.classList.add('va-test');

      // 色板按钮（去掉原色，增加难度）
      const palette = this.colors.filter(c => c !== trial.originalColor);
      const options = Utils.shuffle([trial.originalColor, ...Utils.pickN(palette, 3)]);
      const colorsEl = document.getElementById('va-colors');
      colorsEl.innerHTML = options.map((c, i) =>
        `<button class="color-btn" data-color="${c}" style="background:${c};"></button>`
      ).join('');

      colorsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.color-btn');
        if (!btn || this.answered) return;
        this.answered = true;
        const chosen = btn.dataset.color;
        this.handleAnswer(chosen === trial.originalColor, btn);
      });
    }
  }

  handleAnswer(correct, btn) {
    if (correct) {
      this.correctCount++;
      btn.classList.add('correct');
      document.getElementById('va-correct').textContent = this.correctCount;
    } else {
      btn.classList.add('wrong');
    }

    setTimeout(() => {
      this.currentQ++;
      this.answered = false;
      this.showQuestion();
    }, 700);
  }

  end() {
    const score = Math.min(100, Math.round(this.correctCount * 12.5));
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.totalQuestions}`,
      correctCount: this.correctCount
    });
  }

  destroy() {}
}
