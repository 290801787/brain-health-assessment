// 游戏四：速算挑战（计算力）
class CalculationGame {
  // 测试台变体配置
  static variants = [
    { id: 'dynamic', name: '动态难度', params: { mode: 'dynamic' } },
    { id: 'fixed', name: '固定题库', params: { mode: 'fixed' } },
    { id: 'mixed', name: '四则混合', params: { mode: 'mixed' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (CalculationGame.variants.find(x => x.id === variantId) || CalculationGame.variants[0]).params;
    this.mode = v.mode || 'dynamic';
    this.correctCount = 0;
    this.totalAnswered = 0;
    this.duration = 45;
    this.timer = null;
    this.answered = false;
    this.difficulty = 0; // 0=简单, 1=中等, 2=较难
    this.streak = 0;
    this.qIndex = 0;
    // 固定题库（预生成 30 题，避免随机生成导致答案/干扰项重复）
    this.fixedBank = this.buildFixedBank();
  }

  buildFixedBank() {
    const bank = [];
    // 简单：两位数加减（10-50）
    bank.push(
      { a: 23, b: 15, op: '+', answer: 38 },
      { a: 41, b: 27, op: '+', answer: 68 },
      { a: 35, b: 19, op: '+', answer: 54 },
      { a: 50, b: 32, op: '+', answer: 82 },
      { a: 28, b: 14, op: '+', answer: 42 },
      { a: 47, b: 23, op: '-', answer: 24 },
      { a: 50, b: 18, op: '-', answer: 32 },
      { a: 36, b: 22, op: '-', answer: 14 },
      { a: 44, b: 29, op: '-', answer: 15 },
      { a: 49, b: 31, op: '-', answer: 18 }
    );
    // 中等：两位数加减（30-99）
    bank.push(
      { a: 67, b: 48, op: '+', answer: 115 },
      { a: 89, b: 56, op: '+', answer: 145 },
      { a: 73, b: 39, op: '+', answer: 112 },
      { a: 95, b: 47, op: '+', answer: 142 },
      { a: 68, b: 54, op: '+', answer: 122 },
      { a: 91, b: 36, op: '-', answer: 55 },
      { a: 83, b: 57, op: '-', answer: 26 },
      { a: 97, b: 68, op: '-', answer: 29 },
      { a: 76, b: 49, op: '-', answer: 27 },
      { a: 88, b: 62, op: '-', answer: 26 }
    );
    // 较难：乘法（2-9 × 2-9）
    bank.push(
      { a: 6, b: 7, op: '×', answer: 42 },
      { a: 8, b: 9, op: '×', answer: 72 },
      { a: 7, b: 8, op: '×', answer: 56 },
      { a: 9, b: 6, op: '×', answer: 54 },
      { a: 5, b: 7, op: '×', answer: 35 },
      { a: 8, b: 6, op: '×', answer: 48 },
      { a: 4, b: 9, op: '×', answer: 36 },
      { a: 7, b: 9, op: '×', answer: 63 },
      { a: 6, b: 8, op: '×', answer: 48 },
      { a: 3, b: 9, op: '×', answer: 27 }
    );
    return bank;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔢 速算挑战</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="calc-correct">0</span></div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="calc-timer">${this.duration}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="calc-body">
          <div id="calc-question" style="font-size:36px;font-weight:700;color:var(--text);margin-bottom:32px;font-variant-numeric:tabular-nums;"></div>
          <div class="options-grid" id="calc-options"></div>
        </div>
      </div>
    `;
  }

  start() {
    this.showQuestion();

    this.timer = Utils.createTimer(this.duration, (remaining) => {
      const timerEl = document.getElementById('calc-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  generateQuestion() {
    let a, b, op, answer;

    // 四则混合模式：加减乘随机
    if (this.mode === 'mixed') {
      const ops = ['+', '-', '×'];
      op = Utils.pick(ops);
      if (op === '+') {
        a = Utils.randInt(10, 90); b = Utils.randInt(10, 90); answer = a + b;
      } else if (op === '-') {
        a = Utils.randInt(20, 99); b = Utils.randInt(10, a); answer = a - b;
      } else {
        a = Utils.randInt(2, 9); b = Utils.randInt(2, 9); answer = a * b;
      }
      return this.withOptions(a, b, op, answer);
    }

    // 固定题库模式：按难度顺序取题（简单→中等→较难）
    if (this.mode === 'fixed') {
      const idx = this.qIndex % this.fixedBank.length;
      this.qIndex++;
      const q = this.fixedBank[idx];
      return this.withOptions(q.a, q.b, q.op, q.answer);
    }

    // 动态难度模式（默认）
    if (this.difficulty === 0) {
      // 简单：两位数加减
      a = Utils.randInt(10, 50);
      b = Utils.randInt(10, 50);
      if (Math.random() > 0.5) {
        op = '+';
        answer = a + b;
      } else {
        op = '-';
        if (a < b) [a, b] = [b, a];
        answer = a - b;
      }
    } else if (this.difficulty === 1) {
      // 中等：较大两位数加减
      a = Utils.randInt(30, 99);
      b = Utils.randInt(30, 99);
      if (Math.random() > 0.5) {
        op = '+';
        answer = a + b;
      } else {
        op = '-';
        if (a < b) [a, b] = [b, a];
        answer = a - b;
      }
    } else {
      // 较难：一位数乘法
      a = Utils.randInt(2, 9);
      b = Utils.randInt(2, 9);
      op = '×';
      answer = a * b;
    }

    return this.withOptions(a, b, op, answer);
  }

  // 统一生成 4 个选项（1 正确 + 3 干扰），干扰项为正且与正确答案互异
  withOptions(a, b, op, answer) {
    const wrongs = new Set();
    let guard = 0;
    while (wrongs.size < 3 && guard < 50) {
      const off = Utils.randInt(1, 9);
      const sign = Math.random() > 0.5 ? 1 : -1;
      const w = answer + sign * off;
      // 干扰项须为正数、不等于答案、且与已有干扰互异
      if (w > 0 && w !== answer) wrongs.add(w);
      guard++;
    }
    // 万一凑不齐（极小概率），补 1/2/3
    let i = 1;
    while (wrongs.size < 3) { wrongs.add(answer + i++); }

    const options = [answer, ...wrongs];
    const shuffled = Utils.shuffle(options);

    return { a, b, op, answer, options: shuffled };
  }

  showQuestion() {
    this.answered = false;
    const q = this.generateQuestion();

    document.getElementById('calc-question').textContent = `${q.a} ${q.op} ${q.b} = ?`;

    const optionsEl = document.getElementById('calc-options');
    optionsEl.innerHTML = q.options.map((opt, i) =>
      `<button class="option-btn" data-idx="${i}" data-val="${opt}">${opt}</button>`
    ).join('');

    optionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.answered) return;
      this.answered = true;
      this.totalAnswered++;

      const val = parseInt(btn.dataset.val);
      const correctIdx = q.options.indexOf(q.answer);

      if (val === q.answer) {
        this.correctCount++;
        this.streak++;
        btn.classList.add('correct');
        document.getElementById('calc-correct').textContent = this.correctCount;

        // 动态难度
        if (this.streak >= 3 && this.difficulty < 2) {
          this.difficulty++;
          this.streak = 0;
        }
      } else {
        this.streak = 0;
        btn.classList.add('wrong');
        // 显示正确答案
        document.querySelectorAll('.option-btn')[correctIdx].classList.add('correct');

        // 动态难度降低
        if (this.difficulty > 0 && this.totalAnswered > 2) {
          this.difficulty--;
        }
      }

      setTimeout(() => {
        this.showQuestion();
      }, 400);
    });
  }

  end() {
    if (this.timer) this.timer.stop();
    this.answered = true;

    const score = Math.min(100, Math.round(this.correctCount * 6.67));
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount} 题`,
      correctCount: this.correctCount
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
