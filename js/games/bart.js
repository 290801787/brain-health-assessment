// 新游戏：气球冒险（风险决策）— 参考 m-Py/BART（经典 Balloon Analogue Risk Task）
// 玩法：每次给气球打气 +1 分，但气球随时可能爆炸；爆炸则本局归零。可选"见好就收"保分。
// 测风险偏好与决策冲动性
class BartGame {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准30局', params: { rounds: 12, maxPumps: 32 } },
    { id: 'quick', name: '快速18局', params: { rounds: 8, maxPumps: 20 } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (BartGame.variants.find(x => x.id === variantId) || BartGame.variants[0]).params;
    this.totalRounds = v.rounds || 12;
    this.maxPumps = v.maxPumps || 32;
    this.round = 0;
    this.pumps = 0;
    this.earned = 0;
    this.exploded = false;
    this.explodePoint = 0;
    this.pumpCounts = [];   // 每局打气次数
    this.explodedList = []; // 每局是否爆炸
    this.totalEarned = 0;
    this.roundActive = false;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🎈 气球冒险</div>
          <div class="game__info">
            <div class="game__stat">金币 <span class="game__stat-value" id="bart-coins">0</span></div>
          </div>
        </div>
        <div class="game__body" id="bart-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">给气球打气赚金币，但小心爆炸！</div>
          <div id="bart-round" style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">第 1/${this.totalRounds} 局</div>
          <div id="bart-balloon" style="width:100%;max-width:200px;height:200px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
            <svg id="bart-svg" width="160" height="160" viewBox="0 0 160 160">
              <ellipse id="bart-balloon-body" cx="80" cy="75" rx="40" ry="48" fill="#E6A23C" stroke="#d48923" stroke-width="3"/>
              <line x1="80" y1="123" x2="80" y2="150" stroke="#8B7355" stroke-width="3"/>
            </svg>
          </div>
          <div id="bart-pumps" style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:16px;">已打气 0 次</div>
          <div style="display:flex;gap:12px;width:100%;max-width:280px;">
            <button class="btn btn-primary" id="bart-pump" style="flex:1;">🎈 打气 +1</button>
            <button class="btn" id="bart-collect" style="flex:1;background:var(--success);color:#fff;">💰 收金币</button>
          </div>
          <div id="bart-message" style="font-size:14px;min-height:20px;margin-top:12px;"></div>
        </div>
      </div>
    `;

    document.getElementById('bart-pump').addEventListener('click', () => this.pump());
    document.getElementById('bart-collect').addEventListener('click', () => this.collect());
  }

  start() {
    this.startRound();
  }

  startRound() {
    this.round++;
    this.pumps = 0;
    this.exploded = false;
    // 爆炸点随机（在 maxPumps 的约 1/8 到 7/8 之间）
    this.explodePoint = Utils.randInt(Math.ceil(this.maxPumps / 8), Math.floor(this.maxPumps * 7 / 8));

    document.getElementById('bart-round').textContent = `第 ${this.round}/${this.totalRounds} 局`;
    document.getElementById('bart-pumps').textContent = '已打气 0 次';
    document.getElementById('bart-message').textContent = '';
    document.getElementById('bart-message').style.color = 'var(--text)';
    document.getElementById('bart-pump').disabled = false;
    document.getElementById('bart-collect').disabled = false;
    this.roundActive = true;
    this.renderBalloon(0);
  }

  pump() {
    if (!this.roundActive) return;
    this.pumps++;

    // 是否爆炸
    if (this.pumps >= this.explodePoint) {
      this.exploded = true;
      this.roundActive = false;
      this.pumpCounts.push(this.pumps);
      this.explodedList.push(true);

      document.getElementById('bart-pump').disabled = true;
      document.getElementById('bart-collect').disabled = true;
      const msg = document.getElementById('bart-message');
      msg.textContent = `💥 爆炸了！本局金币归零`;
      msg.style.color = 'var(--danger)';

      this.renderBalloon(this.pumps, true);

      setTimeout(() => {
        if (this.round >= this.totalRounds) this.end();
        else this.startRound();
      }, 1200);
      return;
    }

    this.earned = this.pumps * 1; // 每打一次气 +1 金币
    document.getElementById('bart-pumps').textContent = `已打气 ${this.pumps} 次，本局 +${this.earned}`;
    this.renderBalloon(this.pumps);
  }

  collect() {
    if (!this.roundActive) return;
    this.roundActive = false;
    this.pumpCounts.push(this.pumps);
    this.explodedList.push(false);
    this.totalEarned += this.earned;

    document.getElementById('bart-pump').disabled = true;
    document.getElementById('bart-collect').disabled = true;
    document.getElementById('bart-coins').textContent = this.totalEarned;
    const msg = document.getElementById('bart-message');
    msg.textContent = `💰 入账 ${this.earned} 金币！`;
    msg.style.color = 'var(--success)';

    setTimeout(() => {
      if (this.round >= this.totalRounds) this.end();
      else this.startRound();
    }, 900);
  }

  renderBalloon(pumps, isExploded) {
    const svg = document.getElementById('bart-svg');
    if (!svg) return;
    // 气球尺寸随打气次数变大
    const r = Math.min(60, 30 + pumps * 1.6);
    const body = document.getElementById('bart-balloon-body');
    body.setAttribute('rx', r);
    body.setAttribute('ry', r * 1.2);
    if (isExploded) {
      body.setAttribute('fill', 'rgba(245,108,108,0.3)');
      body.setAttribute('stroke', '#d33');
    } else {
      // 颜色从橙→红渐变，越危险越红
      const ratio = pumps / this.maxPumps;
      const hue = 30 - ratio * 20; // 30(橙) → 10(红)
      body.setAttribute('fill', `hsl(${hue}, 80%, 55%)`);
      body.setAttribute('stroke', `hsl(${hue}, 80%, 40%)`);
    }
  }

  end() {
    // 清理按钮（防止重复点击）
    document.getElementById('bart-pump').disabled = true;
    document.getElementById('bart-collect').disabled = true;

    // 平均打气次数（风险偏好指标）
    const avgPumps = this.pumpCounts.length
      ? this.pumpCounts.reduce((a, b) => a + b, 0) / this.pumpCounts.length
      : 0;
    const explodeCount = this.explodedList.filter(x => x).length;

    // 计分：已赚金币占比为主，兼顾安全打气次数
    // 金币越多越好（上限 = 每局 maxPumps 期望的一半 × 局数）
    const maxEarn = this.totalRounds * this.maxPumps / 2;
    let score = this.totalEarned / maxEarn * 100;
    score = Math.min(100, Math.max(0, Math.round(score)));

    this.onComplete({
      score,
      detail: `赚得 ${this.totalEarned} 金币，平均打气 ${avgPumps.toFixed(1)} 次/局，爆炸 ${explodeCount} 局`,
      earned: this.totalEarned,
      avgPumps: Math.round(avgPumps * 10) / 10,
      explodeCount
    });
  }

  destroy() {}
}
