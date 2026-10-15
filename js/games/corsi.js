// 新游戏：Corsi方块广度（视空间工作记忆）— 参考 Bianca2252/corsi-block-tapping & zniesen/CorsiBlockTappingTask
// 玩法：9个方块随机布局，逐个点亮（1秒/个），用户按顺序点击复现。长度3→9递增，答错结束
class CorsiGame {
  // 测试台变体配置
  static variants = [
    { id: 'classic', name: '经典Corsi', params: { reverse: false, startLen: 3 } },
    { id: 'reverse', name: '反向Corsi', params: { reverse: true, startLen: 3 } },
    { id: 'fast', name: '快速模式', params: { reverse: false, startLen: 3, speed: 600 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (CorsiGame.variants.find(x => x.id === variantId) || CorsiGame.variants[0]).params;
    this.reverse = v.reverse || false;
    this.startLen = v.startLen || 3;
    this.speed = v.speed || 900;
    this.currentLength = this.startLen;
    this.sequence = [];
    this.userInput = [];
    this.phase = 'idle'; // idle | show | recall
    this.timers = [];
    this.correctCount = 0;
  }

  init() {
    const hint = this.reverse ? '记住点亮顺序，然后<b>倒序</b>点击（最后一个先点）' : '记住点亮顺序，然后按顺序点击';
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">视知觉测试</div>
          <div class="game__info">
            <div class="game__stat">长度 <span class="game__stat-value" id="cs-length">${this.currentLength}</span></div>
          </div>
        </div>
        <div class="game__body" id="cs-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">${hint}</div>
          <div id="cs-message" style="font-size:16px;font-weight:600;color:var(--text);min-height:24px;margin-bottom:12px;"></div>
          <div id="cs-board" style="position:relative;width:300px;height:300px;max-width:100%;"></div>
        </div>
      </div>
    `;
    this.generateBoard();
  }

  generateBoard() {
    const board = document.getElementById('cs-board');
    // 9 个方块，规整的 3x3 网格布局（更清晰、适老）
    const positions = [];
    const grid = 3;
    const cellW = 300 / grid;
    const cellH = 300 / grid;

    for (let i = 0; i < 9; i++) {
      const gx = i % grid;
      const gy = Math.floor(i / grid);
      // 方块中心精确落在格点（无抖动，对齐规整）
      positions.push({
        x: gx * cellW + cellW / 2,
        y: gy * cellH + cellH / 2
      });
    }

    // 预生成方块按钮（不可点，仅用于高亮）
    board.innerHTML = positions.map((p, i) =>
      `<div class="corsi-cell" data-idx="${i}" style="left:${p.x}px;top:${p.y}px;"></div>`
    ).join('');
  }

  start() {
    this.nextRound();
  }

  nextRound() {
    this.userInput = [];
    this.phase = 'show';

    // 生成随机序列
    const indices = Utils.randInts(0, 8, this.currentLength);
    this.sequence = indices;

    document.getElementById('cs-length').textContent = this.currentLength;
    const msg = document.getElementById('cs-message');
    msg.textContent = '';
    msg.style.color = 'var(--text)';

    const cells = document.querySelectorAll('.corsi-cell');
    cells.forEach(c => c.classList.remove('active', 'correct', 'wrong', 'recalled'));

    // show 阶段一开始就绑定点击监听（允许用户提前点击正确方块，不被吞掉）
    this.bindRecall();

    // 逐个点亮
    indices.forEach((idx, i) => {
      const t = setTimeout(() => {
        cells[idx].classList.add('active');
        const t2 = setTimeout(() => {
          cells[idx].classList.remove('active');
          // 全部显示完毕 → 进入回忆阶段
          if (i === indices.length - 1) {
            this.phase = 'recall';
            msg.textContent = this.reverse ? '现在请倒序点击（最后亮的先点）' : '请按顺序点击刚才亮过的方块';
          }
        }, this.speed);
        this.timers.push(t2);
      }, i * (this.speed + 300));
      this.timers.push(t);
    });
  }

  bindRecall() {
    const board = document.getElementById('cs-board');
    // 先移除旧监听器，避免多轮累积导致重复判定
    if (this._recallHandler) {
      board.removeEventListener('click', this._recallHandler);
      this._recallHandler = null;
    }
    // 本回合已点击的方块集合（防幽灵点击/双击导致误判）
    this._clickedSet = new Set();

    // 判断点击是否命中"下一个预期方块"（show 阶段预点击也算）
    const isExpected = (idx) => idx === this.sequence[this.userInput.length];

    const handler = (e) => {
      const cell = e.target.closest('.corsi-cell');
      if (!cell) return;
      // 游戏已结束或已进入下一轮：不再接收点击
      if (this.phase === 'ended' || this.phase === 'next') return;

      const idx = parseInt(cell.dataset.idx);

      const expected = this.sequence[this.userInput.length];

      // 防重复：同一方块只认第一次"有效"点击（连点/幽灵点击第二次直接忽略）
      if (this._clickedSet.has(idx)) return;

      if (idx === expected) {
        // 正确：标记（记入防重集合，防止双击同一方块推进两次）
        this._clickedSet.add(idx);
        cell.classList.add('recalled');
        this.userInput.push(idx);

        if (this.userInput.length === this.sequence.length) {
          // 全部答对 → 锁 phase，防止答完后 800ms 内的误点继续触发判定
          this.phase = 'next';
          this.correctCount++;
          this.currentLength++;
          const msg = document.getElementById('cs-message');
          msg.textContent = '✓ 正确！';
          msg.style.color = 'var(--success)';

          setTimeout(() => {
            this.nextRound();
          }, 800);
        }
      } else if (this.phase === 'recall') {
        // 错误（仅 recall 阶段判负；show 阶段点错只是忽略，展示还没结束不该判负）
        this._clickedSet.add(idx);
        this.phase = 'ended';
        const msg = document.getElementById('cs-message');
        msg.textContent = '✗ 顺序不对';
        msg.style.color = 'var(--danger)';
        cell.classList.add('wrong');
        // 高亮正确序列作为反馈
        this.sequence.forEach((si, i) => {
          setTimeout(() => {
            document.querySelectorAll('.corsi-cell')[si].classList.add('correct');
          }, i * 200);
        });
        setTimeout(() => this.end(), 1600);
      }
      // show 阶段点错：不记入防重集合、不判负，仅忽略（用户可能在等待时误触）
    };

    // show 阶段就绑定：允许用户在方块还在点亮时提前点击"下一个正确方块"
    // （适老场景用户常急着点，若等到 recall 才允许，提前点击会被吞掉导致错位误判）
    board.addEventListener('click', handler);
    this._recallHandler = handler;
  }

  end() {
    // 清理所有定时器
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    const length = this.currentLength - 1; // 失败轮取上一轮长度
    let score;
    if (length >= 7) score = 90 + Math.min(10, (length - 7) * 5);
    else if (length >= 5) score = 70 + (length - 5) * 10;
    else if (length >= 4) score = 50 + (length - 4) * 20;
    else score = Math.max(0, length * 16);
    score = Math.min(100, Math.max(0, Math.round(score)));

    this.onComplete({
      score,
      detail: `最长记忆 ${length} 个方块`,
      rawLength: length
    });
  }

  destroy() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    const board = document.getElementById('cs-board');
    if (board && this._recallHandler) {
      board.removeEventListener('click', this._recallHandler);
    }
  }
}
