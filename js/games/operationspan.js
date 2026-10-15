// 新游戏G：运算广度 Operation Span（工作记忆+计算力）— 参考 working_memory_tests
// 玩法：每轮显示一道算术题 + 一个字母，用户先判断算术对错，再按顺序回忆字母
class OperationSpanGame {
  // 测试台变体配置
  static variants = [
    { id: 'classic', name: '经典运算广度', params: { maxSet: 3 } },
    { id: 'hard', name: '强化版', params: { maxSet: 4 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (OperationSpanGame.variants.find(x => x.id === variantId) || OperationSpanGame.variants[0]).params;
    this.maxSet = v.maxSet || 3;
    this.setSize = 2; // 从 2 个字母开始
    this.round = 0;
    this.maxRounds = 5;
    this.correctCount = 0;
    this.totalJudged = 0;
    this.timer = null;
    this.letters = [];
    this.phase = 'judge'; // judge | recall
    this.currentItem = 0;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">⚖️ 运算广度</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="os-correct">0</span></div>
          </div>
        </div>
        <div class="game__body" id="os-body"></div>
      </div>
    `;
  }

  start() {
    this.startRound();
  }

  startRound() {
    if (this.round >= this.maxRounds) {
      this.end();
      return;
    }
    this.round++;
    this.setSize = Math.min(2 + this.round - 1, this.maxSet);
    this.currentItem = 0;
    this.letters = [];

    // 生成本轮的算术题序列
    this.equations = [];
    for (let i = 0; i < this.setSize; i++) {
      const eq = this.generateEquation();
      this.letters.push(String.fromCharCode(65 + Utils.randInt(0, 25)));
      this.equations.push(eq);
    }

    this.phase = 'judge';
    this.showEquation();
  }

  generateEquation() {
    // 简单加减法，答案随机正确或错误
    let a = Utils.randInt(10, 50);
    let b = Utils.randInt(10, 50);
    const op = Math.random() < 0.5 ? '+' : '-';
    let realAnswer;
    if (op === '+') {
      realAnswer = a + b;
    } else {
      if (a < b) [a, b] = [b, a];
      realAnswer = a - b;
    }
    const isCorrect = Math.random() < 0.5;
    const shownAnswer = isCorrect ? realAnswer : realAnswer + Utils.pick([-1, 1]) * Utils.randInt(2, 5);
    return { a, b, op, shownAnswer, isCorrect };
  }

  showEquation() {
    const body = document.getElementById('os-body');
    const eq = this.equations[this.currentItem];

    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">第 ${this.round}/${this.maxRounds} 轮 · 题目 ${this.currentItem + 1}/${this.setSize} · 判断对错</div>
      <div style="font-size:36px;font-weight:700;color:var(--text);margin-bottom:8px;font-variant-numeric:tabular-nums;">${eq.a} ${eq.op} ${eq.b} = ${eq.shownAnswer}</div>
      <div style="font-size:24px;font-weight:700;color:var(--primary);margin-bottom:24px;">记住这个字母：${this.letters[this.currentItem]}</div>
      <div class="options-grid" style="max-width:280px;" id="os-options">
        <button class="option-btn" data-ans="true">✅ 正确</button>
        <button class="option-btn" data-ans="false">❌ 错误</button>
      </div>
    `;

    document.getElementById('os-options').onclick = (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn) return;
      const chosen = btn.dataset.ans === 'true';
      const correct = chosen === eq.isCorrect;
      if (correct) {
        this.correctCount++;
        document.getElementById('os-correct').textContent = this.correctCount;
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
      }
      this.totalJudged++;

      setTimeout(() => {
        this.currentItem++;
        if (this.currentItem >= this.setSize) {
          this.showRecall();
        } else {
          this.showEquation();
        }
      }, 700);
    };
  }

  showRecall() {
    const body = document.getElementById('os-body');
    body.innerHTML = `
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:16px;">按顺序回忆刚才的字母</div>
      <div class="os-recall-box" id="os-recall-box"></div>
      <div style="font-size:13px;color:var(--text-light);margin-bottom:16px;">输入 ${this.setSize} 个字母</div>
      <div class="os-letter-pad" id="os-letter-pad">
        ${Array.from({ length: 26 }, (_, i) => `<button class="os-letter-btn" data-letter="${String.fromCharCode(65 + i)}">${String.fromCharCode(65 + i)}</button>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;">
        <button class="btn btn-primary" id="os-confirm">确认</button>
        <button class="btn" id="os-clear" style="border:1px solid var(--border);">清除</button>
      </div>
    `;

    this.userRecall = '';
    const box = document.getElementById('os-recall-box');

    document.getElementById('os-letter-pad').onclick = (e) => {
      const btn = e.target.closest('.os-letter-btn');
      if (!btn) return;
      if (this.userRecall.length < this.setSize) {
        this.userRecall += btn.dataset.letter;
        box.textContent = this.userRecall.split('').join(' ');
      }
    };

    document.getElementById('os-clear').onclick = () => {
      this.userRecall = '';
      box.textContent = '';
    };

    document.getElementById('os-confirm').onclick = () => {
      if (this.userRecall.length < this.setSize) return;
      const correct = this.userRecall === this.letters.join('');
      // 反馈
      if (correct) {
        this.correctCount++;
        document.getElementById('os-correct').textContent = this.correctCount;
        box.style.color = 'var(--success)';
        box.style.borderColor = 'var(--success)';
      } else {
        box.style.color = 'var(--danger)';
        box.style.borderColor = 'var(--danger)';
        box.textContent = `正确: ${this.letters.join(' ')}`;
      }

      setTimeout(() => {
        this.startRound();
      }, 1200);
    };
  }

  end() {
    if (this.timer) this.timer.stop();
    // 计分：字母回忆正确占比 + 算术判断正确占比
    const recallScore = Math.round(this.correctCount / (this.totalJudged + 5) * 100);
    const score = Math.min(100, Math.max(0, recallScore));
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount} 次（算术判断 ${this.totalJudged} 题）`,
      correctCount: this.correctCount,
      totalJudged: this.totalJudged
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
