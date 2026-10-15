// 游戏二：图形类比（抽象力）
class AbstractionGame {
  // 测试台变体配置
  static variants = [
    { id: 'basic', name: '基础4关系', params: { mode: 'basic' } },
    { id: 'extend', name: '扩展关系', params: { mode: 'extend' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (AbstractionGame.variants.find(x => x.id === variantId) || AbstractionGame.variants[0]).params;
    this.mode = v.mode || 'basic';
    this.totalQuestions = 8;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.questions = [];
    this.answered = false;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔮 图形类比</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="abs-correct">0</span>/${this.totalQuestions}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="abs-timer">8</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="abs-body"></div>
      </div>
    `;
    this.generateQuestions();
  }

  generateQuestions() {
    // 基础：8题 = 2形状 + 2数量 + 2旋转 + 2组合
    // 扩展：8题 = 2形状 + 2数量 + 2旋转 + 2颜色（或组合+嵌套）
    const qTypes = this.mode === 'extend'
      ? ['shape', 'shape', 'count', 'count', 'rotate', 'rotate', 'color', 'nest']
      : ['shape', 'shape', 'count', 'count', 'rotate', 'rotate', 'combo', 'combo'];
    this.questions = qTypes.map(type => this.createQuestion(type));
  }

  createQuestion(type) {
    const shapes = ['circle', 'square', 'triangle', 'diamond'];
    const shapeA = Utils.pick(shapes);
    const shapeB = Utils.pick(shapes.filter(s => s !== shapeA));
    const shapeC = Utils.pick(shapes.filter(s => s !== shapeA));
    const shapeD = Utils.pick(shapes.filter(s => s !== shapeC && s !== shapeB));

    let question = { type };

    switch (type) {
      case 'shape': {
        // 大→小变化
        const target = Utils.pick(shapes);
        const answer = target; // 同形状
        const wrong1 = shapes.filter(s => s !== target)[0];
        const wrong2 = shapes.filter(s => s !== target && s !== wrong1)[0];
        const wrong3 = shapes.filter(s => s !== target && s !== wrong1 && s !== wrong2)[0];
        question = {
          type,
          a: { shape: shapeA, size: 'big', fill: true },
          b: { shape: shapeA, size: 'small', fill: true },
          c: { shape: target, size: 'big', fill: true },
          answer: { shape: target, size: 'small', fill: true },
          options: [
            { shape: target, size: 'small', fill: true },
            { shape: wrong1, size: 'small', fill: true },
            { shape: target, size: 'big', fill: true },
            { shape: wrong2, size: 'small', fill: true }
          ],
          answerIndex: 0
        };
        // 随机打乱选项
        const ans = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans);
        break;
      }
      case 'count': {
        // 1个→2个
        const target = Utils.pick(shapes);
        const wrong = shapes.filter(s => s !== target);
        question = {
          type,
          a: { shape: target, count: 1, fill: true },
          b: { shape: target, count: 2, fill: true },
          c: { shape: target, count: 1, fill: true },
          answer: { shape: target, count: 2, fill: true },
          options: [
            { shape: target, count: 2, fill: true },
            { shape: wrong[0], count: 2, fill: true },
            { shape: target, count: 3, fill: true },
            { shape: wrong[1], count: 1, fill: true }
          ],
          answerIndex: 0
        };
        const ans = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans);
        break;
      }
      case 'rotate': {
        // 旋转90度
        const rotations = [90, 180, 270];
        const rot = Utils.pick(rotations);
        question = {
          type,
          a: { shape: 'arrow', rotation: 0 },
          b: { shape: 'arrow', rotation: rot },
          c: { shape: 'arrow', rotation: 0 },
          answer: { shape: 'arrow', rotation: rot },
          rot,
          options: [
            { shape: 'arrow', rotation: rot },
            { shape: 'arrow', rotation: (rot + 90) % 360 },
            { shape: 'arrow', rotation: (rot + 180) % 360 },
            { shape: 'arrow', rotation: (rot + 270) % 360 }
          ],
          answerIndex: 0
        };
        const ans = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans);
        break;
      }
      case 'combo': {
        // 空心→实心
        const target = Utils.pick(shapes);
        const wrong = shapes.filter(s => s !== target);
        question = {
          type,
          a: { shape: target, fill: false },
          b: { shape: target, fill: true },
          c: { shape: target, fill: false },
          answer: { shape: target, fill: true },
          options: [
            { shape: target, fill: true },
            { shape: wrong[0], fill: true },
            { shape: target, fill: false },
            { shape: wrong[1], fill: true }
          ],
          answerIndex: 0
        };
        const ans = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans);
        break;
      }
      case 'color': {
        // 无填充→有颜色（着色变化）
        const target = Utils.pick(shapes);
        const wrong = shapes.filter(s => s !== target);
        const colA = 'var(--text-light)';
        const colB = 'var(--primary)';
        question = {
          type,
          a: { shape: target, fill: true, color: colA },
          b: { shape: target, fill: true, color: colB },
          c: { shape: target, fill: true, color: colA },
          answer: { shape: target, fill: true, color: colB },
          options: [
            { shape: target, fill: true, color: colB },
            { shape: wrong[0], fill: true, color: colB },
            { shape: target, fill: true, color: colA },
            { shape: wrong[1], fill: true, color: colB }
          ],
          answerIndex: 0
        };
        const ans2 = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans2);
        break;
      }
      case 'nest': {
        // 无嵌套→嵌套（外框套内形）
        const outer = Utils.pick(shapes);
        const inner = Utils.pick(shapes.filter(s => s !== outer));
        const wrong = shapes.filter(s => s !== inner);
        question = {
          type,
          a: { shape: inner, fill: true },
          b: { shape: inner, fill: true, nest: outer },
          c: { shape: inner, fill: true },
          answer: { shape: inner, fill: true, nest: outer },
          options: [
            { shape: inner, fill: true, nest: outer },
            { shape: wrong[0], fill: true, nest: outer },
            { shape: inner, fill: true },
            { shape: wrong[1], fill: true, nest: outer }
          ],
          answerIndex: 0
        };
        const ans3 = question.options[0];
        question.options = Utils.shuffle(question.options);
        question.answerIndex = question.options.indexOf(ans3);
        break;
      }
    }
    return question;
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
    const body = document.getElementById('abs-body');

    // 绘制类比关系
    const aSvg = this.drawShape(q.a);
    const bSvg = this.drawShape(q.b);
    const cSvg = this.drawShape(q.c);

    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      optionsHtml += `<button class="option-btn" data-idx="${i}">${this.drawShape(opt)}</button>`;
    });

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
        <div style="text-align:center;">
          ${aSvg}
          <div style="font-size:12px;color:var(--text-light);margin-top:4px;">A</div>
        </div>
        <div style="font-size:28px;color:var(--primary);">→</div>
        <div style="text-align:center;">
          ${bSvg}
          <div style="font-size:12px;color:var(--text-light);margin-top:4px;">B</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
        <div style="text-align:center;">
          ${cSvg}
          <div style="font-size:12px;color:var(--text-light);margin-top:4px;">C</div>
        </div>
        <div style="font-size:28px;color:var(--primary);">→</div>
        <div style="font-size:28px;color:var(--text-light);">?</div>
      </div>
      <div class="options-grid" id="abs-options">
        ${optionsHtml}
      </div>
    `;

    // 绑定选项
    document.getElementById('abs-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.answered) return;
      this.answered = true;
      const idx = parseInt(btn.dataset.idx);
      this.handleAnswer(idx, q.answerIndex);
    });

    // 倒计时
    this.startQuestionTimer();
  }

  startQuestionTimer() {
    if (this.timer) this.timer.stop();
    let timeLeft = 8;
    const timerEl = document.getElementById('abs-timer');
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

    const btns = document.querySelectorAll('.option-btn');
    if (selected === correct) {
      this.correctCount++;
      btns[correct].classList.add('correct');
      document.getElementById('abs-correct').textContent = this.correctCount;
    } else {
      if (selected >= 0) btns[selected].classList.add('wrong');
      btns[correct].classList.add('correct');
    }

    setTimeout(() => {
      this.currentQ++;
      this.showQuestion();
    }, 600);
  }

  drawShape(config) {
    const size = config.size === 'big' ? 60 : config.size === 'small' ? 36 : 48;
    // 支持自定义颜色（color 题型）
    const fill = config.color || (config.fill !== false ? 'var(--primary)' : 'none');
    const stroke = config.color ? (config.color === 'none' ? 'var(--primary)' : config.color) : 'var(--primary)';
    const sw = config.fill !== false ? 0 : 2.5;
    const rotation = config.rotation || 0;

    let shape = '';
    if (config.shape === 'circle') {
      shape = `<circle cx="24" cy="24" r="${size/2 - 4}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (config.shape === 'square') {
      const s = size - 8;
      shape = `<rect x="${24 - s/2}" y="${24 - s/2}" width="${s}" height="${s}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (config.shape === 'triangle') {
      const r = size/2 - 4;
      const points = [
        [24, 24 - r],
        [24 - r * Math.cos(Math.PI/6), 24 + r * Math.sin(Math.PI/6)],
        [24 + r * Math.cos(Math.PI/6), 24 + r * Math.sin(Math.PI/6)]
      ].map(p => p.join(',')).join(' ');
      shape = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (config.shape === 'diamond') {
      const r = size/2 - 4;
      const points = [[24, 24-r], [24+r, 24], [24, 24+r], [24-r, 24]].map(p => p.join(',')).join(' ');
      shape = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    } else if (config.shape === 'arrow') {
      const points = [[24, 8], [40, 24], [32, 24], [32, 40], [16, 40], [16, 24], [8, 24]].map(p => p.join(',')).join(' ');
      shape = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }

    // 嵌套（nest 题型）：外层大框包住内层形状
    if (config.nest) {
      const nestStroke = 'var(--primary)';
      let outer = '';
      if (config.nest === 'circle') outer = `<circle cx="24" cy="24" r="22" fill="none" stroke="${nestStroke}" stroke-width="2.5"/>`;
      else if (config.nest === 'square') outer = `<rect x="2" y="2" width="44" height="44" fill="none" stroke="${nestStroke}" stroke-width="2.5" rx="2"/>`;
      else if (config.nest === 'triangle') {
        outer = `<polygon points="24,2 42,44 6,44" fill="none" stroke="${nestStroke}" stroke-width="2.5"/>`;
      } else if (config.nest === 'diamond') {
        outer = `<polygon points="24,2 46,24 24,46 2,24" fill="none" stroke="${nestStroke}" stroke-width="2.5"/>`;
      }
      shape = outer + shape;
    }

    // 数量
    let count = config.count || 1;
    let shapes = '';
    if (count === 1) {
      shapes = shape;
    } else {
      const offset = count === 2 ? [-8, 8] : count === 3 ? [-14, 0, 14] : [0];
      shapes = offset.map(x => `<g transform="translate(${x},0)">${shape}</g>`).join('');
    }

    const w = count > 1 ? 64 : 48;
    const transform = rotation ? `transform="rotate(${rotation}, 24, 24)"` : '';

    return `<svg width="${w}" height="48" viewBox="0 0 ${w} 48" style="display:block;margin:auto;">${shapes}</svg>`;
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
