// 新游戏：Simon 效应（冲突监控/反应抑制）— 认知科学经典范式
// 玩法：屏幕左右两侧出现色块刺激。
//       规则：出现"红色"→按左键；出现"绿色"→按右键。
//       刺激位置与颜色可能一致（一致试次）也可能相反（冲突试次）。
//       冲突试次考验抑制位置干扰的能力，测冲突监控与执行控制。
class SimonGame {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准（30%冲突）', params: { total: 15, conflictRatio: 0.3, interval: 900 } },
    { id: 'challenge', name: '挑战（50%冲突）', params: { total: 15, conflictRatio: 0.5, interval: 750 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (SimonGame.variants.find(x => x.id === variantId) || SimonGame.variants[0]).params;
    this.total = v.total || 15;
    this.conflictRatio = v.conflictRatio || 0.3;
    this.interval = v.interval || 900;
    this.trialIndex = 0;
    this.correct = 0;       // 正确反应次数
    this.errors = 0;        // 错误反应次数
    this.conflictErrors = 0; // 冲突试次中的错误（重点指标）
    this.reactionTimes = [];
    this.timers = [];
    this.running = false;
    this.trials = [];
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">执行力测试</div>
          <div class="game__info">
            <div class="game__stat">进度 <span class="game__stat-value" id="sm-progress">0</span>/${this.total}</div>
          </div>
        </div>
        <div class="game__body" id="sm-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:16px;text-align:center;">
            看到 <b style="color:var(--danger);">红色</b> → 点 <b>左边</b><br>
            看到 <b style="color:var(--success);">绿色</b> → 点 <b>右边</b><br>
            <span style="font-size:12px;">注意：位置会变化，请按<b>颜色</b>决定左右</span>
          </div>
          <div id="sm-stage" style="position:relative;width:100%;max-width:300px;height:150px;margin:0 auto;display:flex;align-items:center;justify-content:center;">
            <!-- 刺激出现区域：左/右随机位置 -->
            <div id="sm-stimulus" style="display:none;width:80px;height:80px;border-radius:12px;"></div>
            <div id="sm-feedback" style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);font-size:14px;min-height:20px;"></div>
          </div>
          <div style="display:flex;gap:16px;max-width:300px;margin:48px auto 0;">
            <button class="option-btn" id="sm-left" style="flex:1;font-size:18px;">◀ 左</button>
            <button class="option-btn" id="sm-right" style="flex:1;font-size:18px;">右 ▶</button>
          </div>
        </div>
      </div>
    `;
  }

  start() {
    // 生成试次序列：congruent（一致）/ conflict（冲突）
    this.trials = [];
    const nConflict = Math.round(this.total * this.conflictRatio);
    for (let i = 0; i < this.total; i++) {
      this.trials.push(i < nConflict ? 'conflict' : 'congruent');
    }
    this.trials = Utils.shuffle(this.trials);

    // 每个试次的刺激类型（颜色）与位置
    // 颜色: red→左 / green→右
    // 一致: red在左、green在右；冲突: red在右、green在左
    this.stimuli = this.trials.map(t => {
      const color = Math.random() < 0.5 ? 'red' : 'green';
      const expected = color === 'red' ? 'left' : 'right';
      const position = t === 'conflict' ? (expected === 'left' ? 'right' : 'left') : expected;
      return { color, expected, position };
    });

    this.running = true;

    // 绑定左右按钮
    this._handlers = {
      smLeft: () => this.handleResponse('left'),
      smRight: () => this.handleResponse('right')
    };
    document.getElementById('sm-left').addEventListener('click', this._handlers.smLeft);
    document.getElementById('sm-right').addEventListener('click', this._handlers.smRight);

    this.showTrial();
  }

  showTrial() {
    if (!this.running || this.trialIndex >= this.total) {
      this.end();
      return;
    }

    const trial = this.stimuli[this.trialIndex];
    const stimulus = document.getElementById('sm-stimulus');
    const feedback = document.getElementById('sm-feedback');

    // 设置刺激颜色与位置
    stimulus.style.backgroundColor = trial.color === 'red' ? 'var(--danger)' : 'var(--success)';
    stimulus.style.position = 'absolute';
    if (trial.position === 'left') {
      stimulus.style.left = '8%';
      stimulus.style.right = 'auto';
    } else {
      stimulus.style.right = '8%';
      stimulus.style.left = 'auto';
    }
    stimulus.style.display = 'block';

    feedback.textContent = '';
    this.trialStart = Date.now();
    this.currentTrial = trial;
    this.responded = false;

    // 刺激显示 500ms 后消失，等待反应
    const t1 = setTimeout(() => {
      // 仅当本轮尚未响应时隐藏刺激（响应后 handleResponse 已隐藏）
      if (!this.responded) {
        stimulus.style.display = 'none';
      }
    }, 500);
    this.timers.push(t1);
    this._hideTimer = t1;

    // 超时未反应（用户点击后会被 handleResponse 清除，避免残留定时器加速节奏）
    const t2 = setTimeout(() => {
      if (!this.responded) {
        this.responded = true; // 锁死：超时后的迟来点击不再生效，防止 advance 叠加跳过试次
        this.errors++;
        feedback.textContent = '超时';
        feedback.style.color = 'var(--warning)';
        // 超时也按正常节奏进入下一轮（不是立即），避免"连续无间隔"的加速感
        this.advance();
      }
    }, 1400);
    this.timers.push(t2);
    this._timeoutTimer = t2;
  }

  handleResponse(side) {
    if (this.responded || !this.running) return;
    this.responded = true;

    // 用户已反应：清除超时/隐藏定时器，防止残留定时器在下一轮触发干扰
    if (this._timeoutTimer) {
      const t = this._timeoutTimer;
      clearTimeout(t);
      this._timeoutTimer = null;
      this.timers = this.timers.filter(x => x !== t);
    }
    if (this._hideTimer) {
      const t = this._hideTimer;
      clearTimeout(t);
      this._hideTimer = null;
      this.timers = this.timers.filter(x => x !== t);
    }

    const rt = Date.now() - this.trialStart;
    const stimulus = document.getElementById('sm-stimulus');
    const feedback = document.getElementById('sm-feedback');
    stimulus.style.display = 'none';

    const trial = this.currentTrial;
    const isCorrect = side === trial.expected;
    if (isCorrect) {
      this.correct++;
      this.reactionTimes.push(rt);
      feedback.textContent = '✓';
      feedback.style.color = 'var(--success)';
    } else {
      this.errors++;
      if (trial.position !== trial.expected) this.conflictErrors++;
      feedback.textContent = '✗';
      feedback.style.color = 'var(--danger)';
    }

    this.advance();
  }

  advance() {
    this.trialIndex++;
    document.getElementById('sm-progress').textContent = this.trialIndex;
    const t = setTimeout(() => this.showTrial(), this.interval);
    this.timers.push(t);
  }

  end() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    // 计分：正确率 80 分 + 冲突抑制表现 20 分
    const acc = this.total > 0 ? this.correct / this.total : 0;
    // 冲突试次错误率越低越好
    const nConflict = this.stimuli.filter(s => s.position !== s.expected).length;
    const conflictErrRate = nConflict > 0 ? this.conflictErrors / nConflict : 0;
    let score = acc * 80 + (1 - conflictErrRate) * 20;
    score = Math.min(100, Math.max(0, Math.round(score)));

    const avgRt = this.reactionTimes.length
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : 0;
    const conflictCorrect = nConflict - this.conflictErrors;

    this.onComplete({
      score,
      detail: `正确 ${this.correct}/${this.total}，冲突试次正确 ${conflictCorrect}/${nConflict}${avgRt ? `，平均反应 ${avgRt}ms` : ''}`,
      correct: this.correct,
      errors: this.errors,
      conflictCorrect,
      avgReaction: avgRt
    });
  }

  destroy() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    // 移除按钮事件
    ['sm-left', 'sm-right'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn && this._handlers && this._handlers[id]) {
        btn.removeEventListener('click', this._handlers[id]);
      }
    });
    this._handlers = null;
  }
}
