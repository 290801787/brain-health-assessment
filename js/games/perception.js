// 游戏六：空间旋转（视知觉）
class PerceptionGame {
  // 测试台变体配置
  static variants = [
    { id: 'basic', name: '旋转判别', params: { mode: 'basic' } },
    { id: 'mirror', name: '旋转+镜像', params: { mode: 'mirror' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (PerceptionGame.variants.find(x => x.id === variantId) || PerceptionGame.variants[0]).params;
    this.mode = v.mode || 'basic';
    this.totalQuestions = 8;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.answered = false;
    this.questions = [];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔄 空间旋转</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="perc-correct">0</span>/${this.totalQuestions}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="perc-timer">8</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="perc-body"></div>
      </div>
    `;
    this.generateQuestions();
  }

  generateQuestions() {
    // 3x3 方块组合形状（全部为不对称形状，确保旋转90/180/270 + 镜像产生4个互异选项，杜绝"做对判错"）
    const shapes = [
      // L形
      [[1,0,0],[1,0,0],[1,1,0]],
      // 反L
      [[0,0,1],[0,0,1],[0,1,1]],
      // 角
      [[1,1,0],[1,0,0],[0,0,0]],
      // 阶梯
      [[0,0,1],[0,1,1],[1,1,0]],
      // 小z
      [[1,1,0],[0,1,0],[0,0,1]],
      // 闪电
      [[0,1,0],[1,1,0],[1,0,0]],
      // 钩
      [[1,0,0],[1,1,0],[0,0,1]],
      // 曲
      [[1,1,1],[0,0,1],[1,0,0]]
    ];

    this.questions = shapes.slice(0, this.totalQuestions).map(base => {
      const rotation = Utils.pick([90, 180, 270]);
      const rotated = this.rotateMatrix(base, rotation);

      // 生成镜像作为干扰
      const mirrored = this.mirrorMatrix(rotated);
      const otherRotations = [90, 180, 270].filter(r => r !== rotation);
      const distractor1 = this.rotateMatrix(base, Utils.pick(otherRotations));
      const distractor2 = this.mirrorMatrix(this.rotateMatrix(base, Utils.pick(otherRotations)));

      // 正确项固定为 rotated，干扰项从"该形状的全部 8 种对称变换"中采样
      const gridKey = g => JSON.stringify(g);
      const allTransforms = [];
      for (const r of [90, 180, 270]) {
        const rot = this.rotateMatrix(base, r);
        if (gridKey(rot) !== gridKey(rotated)) allTransforms.push(rot);
        const mir = this.mirrorMatrix(rot);
        if (gridKey(mir) !== gridKey(rotated)) allTransforms.push(mir);
      }
      // 去重
      const uniqueTransforms = [];
      const seenT = new Set();
      for (const t of allTransforms) {
        const k = gridKey(t);
        if (!seenT.has(k)) { seenT.add(k); uniqueTransforms.push(t); }
      }

      // 从唯一变换中抽 3 个干扰项（必然互异，且都不等于正确答案）
      const shuffledTransforms = Utils.shuffle(uniqueTransforms);
      const distractors = shuffledTransforms.slice(0, 3);
      // 若变换不足 3 个（极小概率），用"稍作调整"的备选形状补位
      const fallbackShapes = shapes.filter(s => gridKey(s) !== gridKey(base));

      let options = [
        { grid: rotated, correct: true },
        { grid: distractors[0], correct: false },
        { grid: distractors[1], correct: false },
        { grid: distractors[2], correct: false }
      ];

      // 兜底：若仍有重复（理论上不应发生），用其他形状补位
      let seen = new Set(options.map(o => gridKey(o.grid)));
      let guard = 0;
      while (seen.size < 4 && guard < 20 && fallbackShapes.length > 0) {
        const alt = fallbackShapes[guard % fallbackShapes.length];
        const k = gridKey(alt);
        if (!seen.has(k)) {
          const dupIdx = options.findIndex((o, i) => !o.correct && options.filter(x => gridKey(x.grid) === gridKey(o.grid)).length > 1);
          if (dupIdx >= 0) { options[dupIdx] = { grid: alt, correct: false }; seen.add(k); }
        }
        guard++;
      }

      const shuffled = Utils.shuffle(options);
      const answerIndex = shuffled.findIndex(o => o.correct);

      return {
        base,
        rotation,
        options: shuffled,
        answerIndex
      };
    });
  }

  rotateMatrix(matrix, degrees) {
    const n = matrix.length;
    let result = matrix.map(r => [...r]);

    const times = degrees / 90;
    for (let t = 0; t < times; t++) {
      const prev = result.map(r => [...r]);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          result[j][n - 1 - i] = prev[i][j];
        }
      }
    }
    return result;
  }

  mirrorMatrix(matrix) {
    return matrix.map(row => [...row].reverse());
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
    const q = this.questions[this.currentQ];
    const body = document.getElementById('perc-body');

    // 参考图：基础模式显示原始形状；镜像模式显示旋转后的形状（更贴近真实心理旋转测验）
    const refGrid = this.mode === 'mirror' ? q.options.find(o => o.correct).grid : q.base;
    const refSvg = this.drawGrid(refGrid, 28);
    const hint = this.mode === 'mirror'
      ? '判断哪个选项与上图完全一致（注意镜像干扰）'
      : '选出旋转后与原图一致的图形';
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      optionsHtml += `
        <button class="spatial-option" data-idx="${i}">
          ${this.drawGrid(opt.grid, 18)}
        </button>
      `;
    });

    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">${hint}</div>
      <div class="spatial-ref">${refSvg}</div>
      <div class="spatial-options" id="perc-options">${optionsHtml}</div>
    `;

    document.getElementById('perc-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.spatial-option');
      if (!btn || this.answered) return;
      this.answered = true;

      const idx = parseInt(btn.dataset.idx);
      this.handleAnswer(idx, q.answerIndex);
    });

    this.startQuestionTimer();
  }

  startQuestionTimer() {
    if (this.timer) this.timer.stop();
    let timeLeft = 8;
    const timerEl = document.getElementById('perc-timer');
    timerEl.textContent = timeLeft;
    timerEl.classList.remove('warning');

    this.timer = Utils.createTimer(8, (remaining) => {
      timerEl.textContent = remaining;
      if (remaining <= 3) timerEl.classList.add('warning');
    }, () => {
      if (!this.answered) {
        this.answered = true;
        this.handleAnswer(-1, this.questions[this.currentQ].answerIndex);
      }
    });
  }

  handleAnswer(selected, correct) {
    if (this.timer) this.timer.stop();

    const btns = document.querySelectorAll('.spatial-option');
    if (selected === correct) {
      this.correctCount++;
      btns[correct].classList.add('correct');
      document.getElementById('perc-correct').textContent = this.correctCount;
    } else {
      if (selected >= 0) btns[selected].classList.add('wrong');
      btns[correct].classList.add('correct');
    }

    setTimeout(() => {
      this.currentQ++;
      this.showQuestion();
    }, 600);
  }

  drawGrid(matrix, cellSize) {
    const n = matrix.length;
    const gap = 2;
    const totalSize = n * (cellSize + gap) - gap;
    let svg = `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = j * (cellSize + gap);
        const y = i * (cellSize + gap);
        if (matrix[i][j]) {
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="var(--primary)" rx="3"/>`;
        } else {
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="rgba(74,144,217,0.1)" rx="3"/>`;
        }
      }
    }

    svg += `</svg>`;
    return svg;
  }

  end() {
    if (this.timer) this.timer.stop();
    const score = Math.min(100, Math.round(this.correctCount * 12.5));
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
