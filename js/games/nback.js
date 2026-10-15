// 新游戏C：N-Back 记忆（工作记忆）— 参考 freefocusgames 的 Dual N-Back
// 玩法：屏幕连续显示字母/数字，用户需判断当前出现的刺激是否与 n 步前相同
class NBackGame {
  // 测试台变体配置
  static variants = [
    { id: '1back', name: '1-Back', params: { n: 1 } },
    { id: '2back', name: '2-Back', params: { n: 2 } },
    { id: 'dual', name: '双任务2-Back', params: { n: 2, dual: true } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (NBackGame.variants.find(x => x.id === variantId) || NBackGame.variants[0]).params;
    this.n = v.n || 1;
    this.dual = v.dual || false;
    this.totalTrials = 20;
    this.currentTrial = 0;
    this.correctCount = 0;
    this.timer = null;
    this.sequence = [];
    this.positions = [];
    this.isMatch = [];
    this.isPosMatch = [];
    this.answered = false;
  }

  init() {
    const label = this.dual ? `双任务 ${this.n}-Back` : `${this.n}-Back 记忆`;
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🧩 ${label}</div>
          <div class="game__info">
            <div class="game__stat">正确 <span class="game__stat-value" id="nb-correct">0</span></div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="nb-timer">${this.totalTrials * 2.5}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="nb-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">
            判断当前刺激是否与 ${this.n} 步前相同${this.dual ? '（字母 或 位置 任一相同即按匹配）' : ''}
          </div>
          <div id="nb-stimulus" style="font-size:64px;font-weight:800;color:var(--primary);min-height:100px;display:flex;align-items:center;justify-content:center;"></div>
          <div class="options-grid" style="max-width:280px;margin-top:24px;" id="nb-options">
            <button class="option-btn" data-ans="match">✅ 匹配</button>
            <button class="option-btn" data-ans="nomatch">❌ 不匹配</button>
          </div>
          <div style="font-size:12px;color:var(--text-light);margin-top:16px;" id="nb-progress"></div>
        </div>
      </div>
    `;
    this.generateSequence();
  }

  generateSequence() {
    // 字母池 + 位置池（3x3 网格的 9 个位置）
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'];
    const posCount = 9;

    // 随机生成序列，保证部分匹配
    for (let i = 0; i < this.totalTrials; i++) {
      // 前 n 个随机；之后 30% 概率与前 n 步相同
      let letter, pos;
      if (i >= this.n && Math.random() < 0.3) {
        letter = this.sequence[i - this.n];
      } else {
        letter = Utils.pick(letters);
      }
      if (this.dual) {
        if (i >= this.n && Math.random() < 0.3) {
          pos = this.positions[i - this.n];
        } else {
          pos = Utils.randInt(0, posCount - 1);
        }
      } else {
        pos = Utils.randInt(0, posCount - 1);
      }
      this.sequence.push(letter);
      this.positions.push(pos);

      // 记录是否匹配
      if (i >= this.n) {
        this.isMatch.push(letter === this.sequence[i - this.n]);
        this.isPosMatch.push(pos === this.positions[i - this.n]);
      } else {
        this.isMatch.push(false);
        this.isPosMatch.push(false);
      }
    }
  }

  start() {
    this.showTrial();
    // 总计时：每 trial 2.5 秒
    const totalTime = this.totalTrials * 2.5;
    this.timer = Utils.createTimer(Math.ceil(totalTime), (remaining) => {
      const timerEl = document.getElementById('nb-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  showTrial() {
    if (this.currentTrial >= this.totalTrials) {
      this.end();
      return;
    }

    this.answered = false;
    const stim = document.getElementById('nb-stimulus');
    const progress = document.getElementById('nb-progress');

    // 显示刺激
    if (this.dual) {
      // 双任务：显示字母在网格中的位置
      const gridSize = 3;
      const pos = this.positions[this.currentTrial];
      const row = Math.floor(pos / gridSize);
      const col = pos % gridSize;
      stim.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,40px);gap:4px;">
        ${Array.from({ length: 9 }, (_, i) =>
          `<div style="width:40px;height:40px;border-radius:6px;${i === pos ? 'background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;' : 'background:rgba(74,144,217,0.08);'}">${i === pos ? this.sequence[this.currentTrial] : ''}</div>`
        ).join('')}
      </div>`;
    } else {
      stim.textContent = this.sequence[this.currentTrial];
      stim.classList.remove('scale-in');
      void stim.offsetWidth;
      stim.classList.add('scale-in');
    }

    progress.textContent = `第 ${this.currentTrial + 1}/${this.totalTrials} 轮`;

    // 绑定选项（用事件代理，每次重建避免重复）
    const optionsEl = document.getElementById('nb-options');
    if (optionsEl) {
      optionsEl.onclick = (e) => {
        const btn = e.target.closest('.option-btn');
        if (!btn || this.answered) return;
        const isMatch = btn.dataset.ans === 'match';
        this.handleAnswer(isMatch);
      };
    }

    // 2.5 秒后自动进入下一轮
    setTimeout(() => {
      if (this.answered) return;
      this.answered = true;
      this.autoAdvance();
    }, 2500);
  }

  // 未作答自动推进（计错）
  autoAdvance() {
    this.currentTrial++;
    this.showTrial();
  }

  handleAnswer(isCorrectMatch) {
    if (this.answered) return;
    this.answered = true;

    const btns = document.querySelectorAll('#nb-options .option-btn');
    const expected = this.isMatch[this.currentTrial];
    const expectedPos = this.isPosMatch[this.currentTrial];
    // 双任务：任一匹配即应选"匹配"
    const shouldMatch = this.dual ? (expected || expectedPos) : expected;

    if (isCorrectMatch === shouldMatch) {
      this.correctCount++;
      document.getElementById('nb-correct').textContent = this.correctCount;
      btns.forEach(b => b.classList.remove('correct', 'wrong'));
      // 反馈
      const chosenBtn = [...btns].find(b => (b.dataset.ans === 'match') === isCorrectMatch);
      if (chosenBtn) chosenBtn.classList.add('correct');
    } else {
      btns.forEach(b => b.classList.remove('correct', 'wrong'));
      const chosenBtn = [...btns].find(b => (b.dataset.ans === 'match') === isCorrectMatch);
      if (chosenBtn) chosenBtn.classList.add('wrong');
      // 显示正确答案
      const correctBtn = [...btns].find(b => (b.dataset.ans === 'match') === shouldMatch);
      if (correctBtn) correctBtn.classList.add('correct');
    }

    setTimeout(() => {
      this.currentTrial++;
      this.showTrial();
    }, 700);
  }

  end() {
    if (this.timer) this.timer.stop();
    const score = Math.min(100, Math.round(this.correctCount / this.totalTrials * 100));
    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.totalTrials}`,
      correctCount: this.correctCount
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
