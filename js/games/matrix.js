// 新游戏H：矩阵推理（抽象推理）— 参考 TestMyBrain TMB_Matrix
// 玩法：3x3 矩阵，右下角缺失，用户根据行列规律选出正确的图形
class MatrixGame {
  // 测试台变体配置
  static variants = [
    { id: 'basic', name: '基础规律', params: { mode: 'basic' } },
    { id: 'hard', name: '进阶规律', params: { mode: 'hard' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (MatrixGame.variants.find(x => x.id === variantId) || MatrixGame.variants[0]).params;
    this.mode = v.mode || 'basic';
    this.totalQuestions = 6;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.answered = false;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🧮 矩阵推理</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="mx-correct">0</span>/${this.totalQuestions}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="mx-timer">10</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="mx-body"></div>
      </div>
    `;
  }

  start() {
    this.showQuestion();
  }

  // 生成一个矩阵题：shape 变化规律
  generateQuestion() {
    const shapes = ['circle', 'square', 'triangle', 'diamond'];
    // 选一个形状作为主元素
    const base = Utils.pick(shapes);
    const others = shapes.filter(s => s !== base);

    // 规律类型：
    // 1) 数量递增：每行数量 1→2→3
    // 2) 形状变化：每行 形状A→形状B→形状C
    // 3) 颜色变化：无填充→有填充
    // 4) 组合：外框+内部
    const pattern = Utils.pick(['count', 'shape', 'fill', 'count', 'fill']);

    let matrix = []; // 3x3，每个格子 {shape, count, fill}
    let answer = null;

    if (pattern === 'count') {
      // 每行数量递增 1→2→3（基础版 1→2，进阶版 1→2→3）
      const counts = this.mode === 'hard' ? [1, 2, 3] : [1, 2, 2];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          matrix.push({ shape: base, count: counts[c], fill: true });
        }
      }
      answer = { shape: base, count: this.mode === 'hard' ? 3 : 2, fill: true };
    } else if (pattern === 'shape') {
      // 每行形状变化：row0=base, row1=others[0], row2=others[1]
      const rowShapes = [base, others[0], others[1]];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          matrix.push({ shape: rowShapes[c], count: 1, fill: true });
        }
      }
      answer = { shape: others[1], count: 1, fill: true };
    } else {
      // fill：每列填充状态变化（空→实心→空心/实心）
      const fillSeq = [false, true, true];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          matrix.push({ shape: base, count: 1, fill: fillSeq[c] });
        }
      }
      answer = { shape: base, count: 1, fill: true };
    }

    // 生成干扰项（3 个）
    const wrongOptions = [
      { shape: others[0], count: answer.count, fill: answer.fill },
      { shape: base, count: answer.count === 1 ? 2 : 1, fill: answer.fill },
      { shape: base, count: answer.count, fill: !answer.fill }
    ];

    const options = Utils.shuffle([answer, ...wrongOptions]);
    return { matrix, answer, options };
  }

  showQuestion() {
    if (this.currentQ >= this.totalQuestions) {
      this.end();
      return;
    }
    this.answered = false;
    const body = document.getElementById('mx-body');
    const q = this.generateQuestion();

    // 渲染 3x3 矩阵（右下角为 ?）
    let matrixHtml = '<div style="display:grid;grid-template-columns:repeat(3,80px);gap:6px;">';
    q.matrix.forEach((cell, i) => {
      const isMissing = i === 8;
      matrixHtml += `<div style="width:80px;height:80px;border:2px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;${isMissing ? 'background:rgba(74,144,217,0.08);' : 'background:var(--bg-white);'}">
        ${isMissing ? '<span style="font-size:28px;color:var(--text-light);">?</span>' : this.drawCell(cell)}
      </div>`;
    });
    matrixHtml += '</div>';

    let optionsHtml = '<div class="options-grid" style="max-width:340px;margin-top:24px;" id="mx-options">';
    q.options.forEach((opt, i) => {
      optionsHtml += `<button class="option-btn" data-idx="${i}">${this.drawCell(opt)}</button>`;
    });
    optionsHtml += '</div>';

    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">观察规律，选出右下角缺失的图形</div>
      ${matrixHtml}
      ${optionsHtml}
    `;

    document.getElementById('mx-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.answered) return;
      this.answered = true;
      const idx = parseInt(btn.dataset.idx);
      const correct = q.options[idx] === q.answer;

      if (correct) {
        this.correctCount++;
        btn.classList.add('correct');
        document.getElementById('mx-correct').textContent = this.correctCount;
      } else {
        btn.classList.add('wrong');
        // 显示正确答案
        const correctBtn = [...document.querySelectorAll('#mx-options .option-btn')].find(b => q.options[parseInt(b.dataset.idx)] === q.answer);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      setTimeout(() => {
        this.currentQ++;
        this.showQuestion();
      }, 700);
    });

    // 单题计时 10 秒
    if (this.timer) this.timer.stop();
    let timeLeft = 10;
    const timerEl = document.getElementById('mx-timer');
    timerEl.textContent = timeLeft;
    timerEl.classList.remove('warning');
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

  drawCell(cell) {
    const size = cell.count > 1 ? 20 : 36;
    let svg = '';
    const fill = cell.fill ? 'var(--primary)' : 'none';
    const stroke = 'var(--primary)';
    const sw = cell.fill ? 0 : 2.5;

    const drawOne = () => {
      const x = 24, y = 24;
      if (cell.shape === 'circle') return `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (cell.shape === 'square') return `<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="2"/>`;
      if (cell.shape === 'triangle') {
        return `<polygon points="${x},${y - size/2} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      }
      if (cell.shape === 'diamond') {
        return `<polygon points="${x},${y - size/2} ${x + size/2},${y} ${x},${y + size/2} ${x - size/2},${y}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      }
      return '';
    };

    if (cell.count > 1) {
      const offsets = cell.count === 2 ? [-10, 10] : [-18, 0, 18];
      svg = offsets.map(o => `<g transform="translate(${o},0)">${drawOne()}</g>`).join('');
      return `<svg width="64" height="48" viewBox="0 0 64 48" style="display:block;margin:auto;">${svg}</svg>`;
    }
    return `<svg width="48" height="48" viewBox="0 0 48 48" style="display:block;margin:auto;">${drawOne()}</svg>`;
  }

  end() {
    if (this.timer) this.timer.stop();
    const score = Math.min(100, Math.round(this.correctCount * (100 / this.totalQuestions)));
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.totalQuestions}`,
      correctCount: this.correctCount
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
