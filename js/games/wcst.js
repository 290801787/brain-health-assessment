// 新游戏：WCST 威斯康星卡片分类（认知灵活性/执行功能）— 参考 altunf/wcst
// 玩法：屏幕顶部有 4 张"目标卡片"，底部给 1 张"待分类卡片"。
//       用户需按某种规则（颜色/形状/数量）把待分类卡片归到 4 张目标卡片之一。
//       规则会暗中切换（如从"颜色"变到"数量"），只有通过反馈猜测，考验思维转换能力。
class WcstGame {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准（颜色→形状→数量）', params: { total: 15, ruleSwitch: true } },
    { id: 'simple', name: '简单（单规则不切换）', params: { total: 15, ruleSwitch: false } }
  ];

  // 卡片元素池：4 种颜色 × 4 种形状 × 4 种数量
  static COLORS = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'];
  static SHAPES = ['●', '▲', '■', '◆'];
  static COUNTS = [1, 2, 3, 4];
  static RULES = ['color', 'shape', 'count'];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (WcstGame.variants.find(x => x.id === variantId) || WcstGame.variants[0]).params;
    this.total = v.total || 15;
    this.ruleSwitch = v.ruleSwitch !== false;
    this.trialIndex = 0;
    this.correctCount = 0;
    this.ruleIndex = 0;           // 当前规则在 RULES 中的下标
    this.currentRule = null;      // 当前规则 key
    this.ruleHistory = [];        // 每个试次的实际规则
    this.correctPerRule = {};     // 每种规则下连续正确数（用于触发切换）
    this.answered = false;
    this.timers = [];
    this.running = false;
  }

  // 生成一张卡片 {color, shape, count}
  makeCard() {
    return {
      color: WcstGame.COLORS[Utils.randInt(0, WcstGame.COLORS.length - 1)],
      shape: WcstGame.SHAPES[Utils.randInt(0, WcstGame.SHAPES.length - 1)],
      count: WcstGame.COUNTS[Utils.randInt(0, WcstGame.COUNTS.length - 1)]
    };
  }

  // 目标卡片：固定覆盖 颜色/形状/数量 三种维度的代表值
  makeTargetCards() {
    return [
      { color: WcstGame.COLORS[0], shape: WcstGame.SHAPES[0], count: 1 }, // 红●1
      { color: WcstGame.COLORS[1], shape: WcstGame.SHAPES[1], count: 2 }, // 蓝▲2
      { color: WcstGame.COLORS[2], shape: WcstGame.SHAPES[2], count: 3 }, // 黄■3
      { color: WcstGame.COLORS[3], shape: WcstGame.SHAPES[3], count: 4 }  // 绿◆4
    ];
  }

  // 根据当前规则，判断待分类卡片应归入哪张目标卡片
  matchTarget(card, targets, rule) {
    let idx = -1;
    if (rule === 'color') idx = targets.findIndex(t => t.color === card.color);
    else if (rule === 'shape') idx = targets.findIndex(t => t.shape === card.shape);
    else idx = targets.findIndex(t => t.count === card.count);
    // 兜底：若目标卡片没有对应特征，随机给一个
    return idx >= 0 ? idx : Utils.randInt(0, targets.length - 1);
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">抽象力测试</div>
          <div class="game__info">
            <div class="game__stat">进度 <span class="game__stat-value" id="wc-progress">0</span>/${this.total}</div>
          </div>
        </div>
        <div class="game__body" id="wc-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;text-align:center;">
            把底部卡片归类到上面<b>最合适</b>的目标卡片<br>
            <span style="font-size:12px;">规则可能是颜色/形状/数量，会变化——通过"对/错"提示猜规则</span>
          </div>
          <!-- 目标卡片 -->
          <div id="wc-targets" style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;"></div>
          <!-- 待分类卡片 -->
          <div id="wc-question" style="display:flex;justify-content:center;margin-bottom:12px;"></div>
          <!-- 反馈 -->
          <div id="wc-feedback" style="font-size:14px;min-height:22px;text-align:center;margin-bottom:16px;"></div>
        </div>
      </div>
    `;
  }

  // 渲染一张卡片 SVG
  renderCard(card, size) {
    const s = size || 56;
    const shapes = [];
    for (let i = 0; i < card.count; i++) {
      const y = s / 2 - (card.count - 1) * 6 + i * 12;
      shapes.push(`<text x="50%" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${s * 0.3}" fill="${card.color}">${card.shape}</text>`);
    }
    return `
      <svg viewBox="0 0 ${s} ${s}" style="width:${s}px;height:${s}px;background:#fff;border:2px solid #ddd;border-radius:8px;">
        ${shapes.join('')}
      </svg>
    `;
  }

  start() {
    this.running = true;
    this.targets = this.makeTargetCards();
    this.renderTargets();

    // 规则切换：从颜色开始
    this.ruleIndex = 0;
    this.currentRule = WcstGame.RULES[0];
    this.correctPerRule = { color: 0, shape: 0, count: 0 };
    this.ruleHistory = [];

    this.showTrial();
  }

  renderTargets() {
    const box = document.getElementById('wc-targets');
    box.innerHTML = this.targets.map((t, i) => `
      <button class="wc-target" data-idx="${i}" style="padding:6px;background:#fff;border:2px solid #ddd;border-radius:10px;cursor:pointer;">
        ${this.renderCard(t, 52)}
      </button>
    `).join('');
  }

  showTrial() {
    if (!this.running || this.trialIndex >= this.total) {
      this.end();
      return;
    }
    this.answered = false;
    const feedback = document.getElementById('wc-feedback');
    feedback.textContent = '';
    feedback.style.color = '';

    // 生成待分类卡片：保证与当前规则的某个目标匹配，但其他维度尽量随机
    let card;
    do {
      card = this.makeCard();
    } while (this.matchTarget(card, this.targets, this.currentRule) < 0);

    this.currentCard = card;
    this.currentAnswer = this.matchTarget(card, this.targets, this.currentRule);
    this.ruleHistory.push(this.currentRule);

    // 记录规则切换点的累计正确数（用于计算切换后适应度）
    if (this.trialIndex === 0 || this.ruleHistory[this.trialIndex] !== this.ruleHistory[this.trialIndex - 1]) {
      this.correctCountBeforeSwitch = this.correctCount;
    }

    document.getElementById('wc-question').innerHTML = this.renderCard(card, 68);

    // 绑定目标卡片点击
    this._targetHandlers = this._targetHandlers || [];
    const targets = document.querySelectorAll('.wc-target');
    targets.forEach((btn, i) => {
      btn.onclick = () => this.handleAnswer(i);
    });
  }

  handleAnswer(idx) {
    if (this.answered || !this.running) return;
    this.answered = true;

    const feedback = document.getElementById('wc-feedback');
    const isCorrect = idx === this.currentAnswer;

    if (isCorrect) {
      this.correctCount++;
      this.correctPerRule[this.currentRule] = (this.correctPerRule[this.currentRule] || 0) + 1;
      feedback.textContent = '✓ 正确！';
      feedback.style.color = 'var(--success)';
    } else {
      this.correctPerRule[this.currentRule] = 0;
      feedback.textContent = '✗ 不对，再想想规则';
      feedback.style.color = 'var(--danger)';
    }

    // 规则切换逻辑：连续正确达到阈值（4次）且开了切换 → 切到下一个规则
    if (this.ruleSwitch && this.correctPerRule[this.currentRule] >= 4) {
      // 延迟到下一试次切换，避免刚反馈就切
      const nextIdx = (this.ruleIndex + 1) % WcstGame.RULES.length;
      this.ruleIndex = nextIdx;
      this.currentRule = WcstGame.RULES[nextIdx];
      this.correctPerRule[this.currentRule] = 0;
    }

    const t = setTimeout(() => this.advance(), 600);
    this.timers.push(t);
  }

  advance() {
    this.trialIndex++;
    document.getElementById('wc-progress').textContent = this.trialIndex;
    this.showTrial();
  }

  end() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    // 计分：正确率 60 分 + 规则切换适应度 40 分
    const acc = this.total > 0 ? this.correctCount / this.total : 0;
    // 切换后（第一个试次起）的正确率更能反映灵活性
    const switchIdx = this.ruleHistory.findIndex((r, i) => i > 0 && r !== this.ruleHistory[i - 1]);
    let flexScore = 40;
    if (switchIdx >= 0) {
      const postSwitch = this.ruleHistory.slice(switchIdx);
      const postCorrect = this.correctCount - this.correctCountBeforeSwitch;
      const postAcc = postSwitch.length > 0 ? postCorrect / postSwitch.length : 0;
      flexScore = Math.round(postAcc * 40);
    }
    let score = Math.round(acc * 60) + flexScore;
    score = Math.min(100, Math.max(0, score));

    const rulesUsed = [...new Set(this.ruleHistory)].join('→');

    this.onComplete({
      score,
      detail: `正确 ${this.correctCount}/${this.total}，规则序列 ${rulesUsed}`,
      correct: this.correctCount,
      total: this.total,
      rules: rulesUsed
    });
  }

  destroy() {
    this.running = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    const targets = document.querySelectorAll('.wc-target');
    targets.forEach(btn => { btn.onclick = null; });
  }
}
