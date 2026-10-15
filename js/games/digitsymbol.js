// 新游戏E：数字符号匹配（加工速度/视知觉）— 参考 TestMyBrain TMB_DigitSymbolMatching
// 玩法：显示"数字→符号"对照表，然后给出一个数字 + 4个符号选项，选出对应的符号
class DigitSymbolGame {
  // 测试台变体配置
  static variants = [
    { id: 'classic', name: '经典对照', params: { mode: 'classic', total: 10 } },
    { id: 'speed', name: '快速模式', params: { mode: 'speed', total: 14 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (DigitSymbolGame.variants.find(x => x.id === variantId) || DigitSymbolGame.variants[0]).params;
    this.mode = v.mode || 'classic';
    this.totalQuestions = v.total || 10;
    this.currentQ = 0;
    this.correctCount = 0;
    this.timer = null;
    this.pairs = null;
    this.answered = false;
    // 符号池（ASCII 字符，简单可识别）
    this.symbols = ['★', '▲', '●', '◆', '■', '♥', '♦', '♣', '♠', '✚', '☀', '☁', '☂', '♪', '♫', '☺'];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔣 数字符号</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="ds-correct">0</span>/${this.totalQuestions}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="ds-timer">${this.mode === 'speed' ? 8 : 10}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="ds-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">先记住对照表，再选出数字对应的符号</div>
          <div id="ds-key" class="ds-key"></div>
        </div>
      </div>
    `;

    // 生成对照表：0-9 十个数字各配一个符号
    this.pairs = {};
    const symbols = Utils.shuffle(this.symbols.slice(0, 10));
    for (let i = 0; i < 10; i++) {
      this.pairs[i] = symbols[i];
    }

    // 渲染对照表
    const key = document.getElementById('ds-key');
    key.innerHTML = Array.from({ length: 10 }, (_, i) =>
      `<div class="ds-key-item"><span>${i}</span><span>${this.pairs[i]}</span></div>`
    ).join('');
  }

  start() {
    // 显示第一题
    this.showQuestion();
  }

  showQuestion() {
    if (this.currentQ >= this.totalQuestions) {
      this.end();
      return;
    }
    this.answered = false;

    const body = document.getElementById('ds-body');
    // 题目：随机选一个数字
    const digit = Utils.randInt(0, 9);
    const correctSym = this.pairs[digit];

    // 4 个选项：1 正确 + 3 干扰（其他数字的符号）
    const wrongSyms = Object.values(this.pairs).filter(s => s !== correctSym);
    const options = Utils.shuffle([correctSym, ...Utils.pickN(wrongSyms, 3)]);

    // 移除旧题目区（保留对照表）
    const oldQ = document.getElementById('ds-question');
    if (oldQ) oldQ.remove();

    const qDiv = document.createElement('div');
    qDiv.id = 'ds-question';
    qDiv.style.cssText = 'margin-top:20px;text-align:center;width:100%;';
    qDiv.innerHTML = `
      <div style="font-size:44px;font-weight:800;color:var(--text);margin-bottom:20px;">${digit} → ?</div>
      <div class="options-grid" id="ds-options">
        ${options.map((sym, i) => `<button class="option-btn" data-idx="${i}" data-val="${sym}">${sym}</button>`).join('')}
      </div>
    `;
    body.appendChild(qDiv);

    document.getElementById('ds-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.answered) return;
      this.answered = true;
      const val = btn.dataset.val;
      const correct = val === correctSym;

      if (correct) {
        this.correctCount++;
        btn.classList.add('correct');
        document.getElementById('ds-correct').textContent = this.correctCount;
      } else {
        btn.classList.add('wrong');
        // 显示正确答案
        const correctBtn = [...qDiv.querySelectorAll('.option-btn')].find(b => b.dataset.val === correctSym);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      setTimeout(() => {
        this.currentQ++;
        this.showQuestion();
      }, 600);
    });

    // 单题计时
    this.startQuestionTimer();
  }

  startQuestionTimer() {
    if (this.timer) this.timer.stop();
    let timeLeft = this.mode === 'speed' ? 8 : 10;
    const timerEl = document.getElementById('ds-timer');
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
