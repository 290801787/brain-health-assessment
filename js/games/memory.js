// 游戏一：数字记忆（记忆力）
class MemoryGame {
  // 测试台变体配置
  static variants = [
    { id: 'forward', name: '正向序列', params: { reverse: false } },
    { id: 'backward', name: '反向输入', params: { reverse: true } },
    { id: 'fast', name: '快速模式(1s)', params: { reverse: false, showTime: 1000 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (MemoryGame.variants.find(x => x.id === variantId) || MemoryGame.variants[0]).params;
    this.reverse = v.reverse || false;
    this.showTime = v.showTime || 2000;
    this.digits = [];
    this.userInput = '';
    this.currentLength = 3;
    this.timer = null;
  }

  init() {
    const hint = this.reverse ? '记住数字，然后<b>倒序</b>输入（如 4 7 2 → 2 7 4）' : '记住数字，然后按顺序输入';
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">记忆力测试</div>
          <div class="game__info">
            <div class="game__stat">长度 <span class="game__stat-value" id="mem-length">${this.currentLength}</span></div>
          </div>
        </div>
        <div class="game__body" id="mem-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">${hint}</div>
          <div id="mem-display" style="font-size:42px;font-weight:700;letter-spacing:12px;color:var(--primary);min-height:60px;"></div>
          <div id="mem-input-area" style="display:none;">
            <div id="mem-user-display" style="font-size:32px;font-weight:600;letter-spacing:10px;color:var(--text);min-height:50px;margin-bottom:24px;"></div>
            <div class="num-pad" id="mem-numpad">
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
          </div>
        </div>
      </div>
    `;
  }

  start() {
    this.nextRound();
  }

  nextRound() {
    this.userInput = '';
    this.digits = [];
    for (let i = 0; i < this.currentLength; i++) {
      this.digits.push(Utils.randInt(0, 9));
    }

    document.getElementById('mem-length').textContent = this.currentLength;
    const display = document.getElementById('mem-display');
    const inputArea = document.getElementById('mem-input-area');

    // 显示数字
    inputArea.style.display = 'none';
    display.style.display = 'block';
    display.textContent = this.digits.join('  ');
    display.classList.remove('scale-in');
    void display.offsetWidth;
    display.classList.add('scale-in');

    // 显示数字（时长可配置，快速模式 1s，默认 2s）
    setTimeout(() => {
      display.style.display = 'none';
      inputArea.style.display = 'block';
      document.getElementById('mem-user-display').textContent = '';
      this.bindNumpad();
    }, this.showTime);
  }

  bindNumpad() {
    const numpad = document.getElementById('mem-numpad');
    // 移除旧监听
    const newPad = numpad.cloneNode(true);
    numpad.parentNode.replaceChild(newPad, numpad);

    newPad.addEventListener('click', (e) => {
      const btn = e.target.closest('.num-pad__btn');
      if (!btn) return;
      const num = btn.dataset.num;

      if (num === 'del') {
        this.userInput = this.userInput.slice(0, -1);
      } else if (num === 'ok') {
        this.checkAnswer();
        return;
      } else {
        if (this.userInput.length < this.currentLength) {
          this.userInput += num;
        }
      }
      document.getElementById('mem-user-display').textContent = this.userInput.split('').join('  ');
    });
  }

  checkAnswer() {
    // 反向模式：用户需倒序输入（如显示 4 7 2 → 输入 2 7 4）
    const expected = this.reverse ? [...this.digits].reverse().join('') : this.digits.join('');
    const correct = this.userInput === expected;
    const display = document.getElementById('mem-display');
    const inputArea = document.getElementById('mem-input-area');

    if (correct) {
      // 正确
      display.style.display = 'block';
      inputArea.style.display = 'none';
      display.textContent = '✓';
      display.style.color = 'var(--success)';
      display.classList.remove('scale-in');
      void display.offsetWidth;
      display.classList.add('scale-in');

      this.currentLength++;

      setTimeout(() => {
        display.style.color = 'var(--primary)';
        this.nextRound();
      }, 800);
    } else {
      // 错误 - 游戏结束
      display.style.display = 'block';
      inputArea.style.display = 'none';
      display.innerHTML = `✗ <span style="font-size:20px;color:var(--danger);">正确: ${this.digits.join('  ')}</span>`;
      display.style.color = 'var(--danger)';

      setTimeout(() => {
        this.end();
      }, 1500);
    }
  }

  end() {
    const length = this.currentLength - 1; // 最后一轮失败，取上一轮的长度
    let score;
    if (length >= 7) score = 90 + Math.min(10, (length - 7) * 5);
    else if (length >= 5) score = 70 + (length - 5) * 10;
    else if (length >= 4) score = 50 + (length - 4) * 20;
    else score = Math.max(0, length * 16);

    score = Math.min(100, Math.max(0, Math.round(score)));

    this.onComplete({
      score,
      detail: `最长记忆 ${length} 位数字`,
      rawLength: length
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
