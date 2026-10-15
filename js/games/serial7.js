// 新游戏：连续减7（计算力/工作记忆）— 参考 cf3901646/cognitive-assessment（MoCA 临床范式）
// 玩法：从100开始连续减7（100→93→86→79→72→65），共5步，大键盘输入，实时反馈
class Serial7Game {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准100起', params: { start: 100, steps: 5 } },
    { id: 'easy', name: '轻松版90起', params: { start: 90, steps: 4 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (Serial7Game.variants.find(x => x.id === variantId) || Serial7Game.variants[0]).params;
    this.startNum = v.start || 100;
    this.steps = v.steps || 5;
    this.currentStep = 0;
    this.correctCount = 0;
    this.userInput = '';
    this.answered = false;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">➖ 连续减7</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="s7-correct">0</span>/${this.steps}</div>
          </div>
        </div>
        <div class="game__body" id="s7-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">从 <b>${this.startNum}</b> 开始，连续减 7（共 ${this.steps} 步）</div>
          <div id="s7-question" style="font-size:36px;font-weight:700;color:var(--text);margin-bottom:12px;font-variant-numeric:tabular-nums;"></div>
          <div id="s7-input-area">
            <div id="s7-user-display" style="font-size:32px;font-weight:600;letter-spacing:4px;color:var(--primary);min-height:44px;margin-bottom:16px;"></div>
            <div class="num-pad" id="s7-numpad">
              <button class="num-pad__btn" data-num="1">1</button>
              <button class="num-pad__btn" data-num="2">2</button>
              <button class="num-pad__btn" data-num="3">3</button>
              <button class="num-pad__btn" data-num="4">4</button>
              <button class="num-pad__btn" data-num="5">5</button>
              <button class="num-pad__btn" data-num="6">6</button>
              <button class="num-pad__btn" data-num="7">7</button>
              <button class="num-pad__btn" data-num="8">8</button>
              <button class="num-pad__btn" data-num="9">9</button>
              <button class="num-pad__btn num-pad__btn--action" data-num="del">删除</button>
              <button class="num-pad__btn" data-num="0">0</button>
              <button class="num-pad__btn num-pad__btn--action" data-num="ok">确认</button>
            </div>
            <div id="s7-feedback" style="font-size:14px;min-height:20px;margin-top:12px;text-align:center;"></div>
          </div>
        </div>
      </div>
    `;
    this.bindNumpad();
  }

  start() {
    this.showQuestion();
  }

  showQuestion() {
    this.userInput = '';
    this.answered = false;
    const expected = this.startNum - 7 * (this.currentStep + 1);

    document.getElementById('s7-question').textContent = `${this.startNum - 7 * this.currentStep} - 7 = ?`;
    document.getElementById('s7-user-display').textContent = '';
    document.getElementById('s7-feedback').textContent = '';
  }

  bindNumpad() {
    const numpad = document.getElementById('s7-numpad');
    numpad.addEventListener('click', (e) => {
      const btn = e.target.closest('.num-pad__btn');
      if (!btn || this.answered) return;
      const num = btn.dataset.num;

      if (num === 'del') {
        this.userInput = this.userInput.slice(0, -1);
      } else if (num === 'ok') {
        this.checkAnswer();
        return;
      } else {
        if (this.userInput.length < 3) this.userInput += num;
      }
      document.getElementById('s7-user-display').textContent = this.userInput;
    });
  }

  checkAnswer() {
    if (this.answered) return;
    this.answered = true;

    const expected = this.startNum - 7 * (this.currentStep + 1);
    const correct = parseInt(this.userInput) === expected;
    const feedback = document.getElementById('s7-feedback');

    if (correct) {
      this.correctCount++;
      document.getElementById('s7-correct').textContent = this.correctCount;
      feedback.textContent = '✓ 正确！';
      feedback.style.color = 'var(--success)';
    } else {
      feedback.innerHTML = `✗ 正确答案是 <b>${expected}</b>`;
      feedback.style.color = 'var(--danger)';
    }

    setTimeout(() => {
      this.currentStep++;
      if (this.currentStep < this.steps) {
        this.showQuestion();
      } else {
        this.end();
      }
    }, 1000);
  }

  end() {
    // 计分：正确数/步数 × 100
    const score = Math.round(this.correctCount / this.steps * 100);
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.steps} 步`,
      correctCount: this.correctCount
    });
  }

  destroy() {}
}
