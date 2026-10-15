// 路由与页面管理
const App = {
  currentPage: null,
  currentGame: null,
  // ===== 最终评估游戏（产品经理选定）：数字记忆 / Corsi方块 / Simon效应 / 卡片分类 =====
  gameOrder: ['memory', 'corsi', 'simon', 'wcst'],
  // 测试台专用（?test=1 调试用，正式流程不出现）
  testGames: {
    old: ['memory', 'abstraction', 'executive', 'calculation', 'attention', 'perception'],
    v1: ['schulte', 'visualarray', 'nback', 'trail', 'digitsymbol', 'flanker', 'operationspan', 'matrix'],
    v2: ['corsi', 'gonogo', 'serial7', 'bart', 'wordrecall'],
    v3: ['simon', 'wcst']
  },
  gameResults: {},

  // ============ 测试台模式 ============
  // 默认关闭：走正常评估流程（首页 → 用户信息 → 引导 → 游戏 → 报告）。
  // 通过 URL 参数开启：index.html?test=1 时直达测试台，跳过首页/用户信息/引导/报告，
  // 底部悬浮切换器可自由切换 6 个游戏及其题型变体，游戏结束不弹结算弹窗
  testMode: false,

  // 游戏元信息
  gameMeta: {
    memory:      { name: '记忆力测试', icon: '🧠', desc: '记住数字序列，按顺序输入' },
    corsi:       { name: '视知觉测试', icon: '🟦', desc: '记住方块点亮顺序并按顺序输入' },
    simon:       { name: '执行力测试', icon: '🎛', desc: '看到红色块时按左，看到绿色块时按右，需快速点击' },
    wcst:        { name: '抽象力测试', icon: '🃏', desc: '按颜色/形状/数量规则分类，规则会切换' },
    // ===== 测试台专用（?test=1 调试，正式流程不出现）=====
    abstraction: { name: '图形类比', icon: '🔮', desc: '观察图形间的变化规律，选出符合类比的图形' },
    executive:   { name: '颜色干扰', icon: '🎨', desc: '选择文字显示的颜色，而非文字的含义' },
    calculation: { name: '速算挑战', icon: '🔢', desc: '在限时内完成尽可能多的算术题' },
    attention:   { name: '找不同',   icon: '🔍', desc: '在两张相似图片中找出所有差异' },
    perception:  { name: '空间旋转', icon: '🔄', desc: '判断旋转后的图形是否与原图一致' },
    schulte:      { name: '舒尔特方格', icon: '👀', desc: '按顺序点击数字，训练注意力' },
    visualarray:  { name: '视觉阵列',   icon: '🖼', desc: '记忆彩色方块，判断颜色变化' },
    nback:        { name: 'N-Back',     icon: '🧩', desc: '判断当前刺激是否与n步前相同' },
    trail:        { name: '连线测试',   icon: '🔗', desc: '按顺序点击数字/字母' },
    digitsymbol:  { name: '数字符号',   icon: '🔣', desc: '选出数字对应的符号' },
    flanker:      { name: '侧抑制',     icon: '🎯', desc: '忽略干扰箭头' },
    operationspan:{ name: '运算广度',   icon: '⚖️', desc: '判断算术+回忆字母' },
    matrix:       { name: '矩阵推理',   icon: '🧮', desc: '观察规律选出缺失图形' },
    gonogo:       { name: 'Go/No-Go',  icon: '🎯', desc: '看刺激快速反应/抑制' },
    serial7:      { name: '连续减7',    icon: '➖', desc: '从100连续减7（MoCA范式）' },
    bart:         { name: '气球冒险',   icon: '🎈', desc: '打气赚钱但小心爆炸（风险决策）' },
    wordrecall:   { name: '词语回忆',   icon: '📝', desc: '记忆词语+干扰+回忆（言语记忆）' }
  },

  init() {
    // 通过 URL 参数 ?test=1 启用测试台模式（调试用），否则走正常评估流程
    this.testMode = new URLSearchParams(location.search).get('test') === '1';
    this.bindEvents();
    if (this.testMode) {
      this.initTestBench();
    } else {
      this.showPage('home');
    }
  },

  // ============ 测试台 ============
  initTestBench() {
    // 隐藏所有页面，再显示游戏页面作为容器（测试台直接渲染游戏，跳过引导）
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const gamePage = document.getElementById('page-game');
    if (gamePage) {
      gamePage.classList.remove('hidden');
      gamePage.classList.add('fade-in');
    }
    // 渲染测试台切换器
    this.renderTestSwitcher();
    // 默认进入第一个游戏（记忆）
    this.launchGame('memory');
  },

  renderTestSwitcher() {
    // 标记测试模式，给游戏容器底部留空间
    document.body.classList.add('test-mode');

    const renderGroup = (title, games, cls) => {
      let html = `<div class="testbench__section-title ${cls}">${title}</div>`;
      html += '<div class="testbench__groups">';
      games.forEach(gid => {
        const meta = this.gameMeta[gid];
        if (!meta) return;
        html += `
          <div class="testbench__group" data-game="${gid}">
            <button class="testbench__game-btn" data-game="${gid}">${meta.icon} ${meta.name}</button>
            <div class="testbench__variants"></div>
          </div>
        `;
      });
      html += '</div>';
      return html;
    };

    let html = renderGroup('✅ 最终评估游戏（已选定）', this.gameOrder, 'section-final');
    html += renderGroup('🧪 原有游戏（部分有bug待修）', this.testGames.old, 'section-old');
    html += renderGroup('✨ 新游戏v1（GitHub调研，待筛选）', this.testGames.v1, 'section-new');
    html += renderGroup('🆕 新测试题v2（GitHub深度调研，待筛选）', this.testGames.v2, 'section-v2');
    html += renderGroup('🔧 新测试题v3（备选）', this.testGames.v3, 'section-v3');

    const container = document.createElement('div');
    container.id = 'testbench';
    container.className = 'testbench collapsed'; // 默认收起，不挡游戏交互
    container.innerHTML = `
      <button class="testbench__toggle" type="button">
        <span class="testbench__toggle-label">🧪 测试台 · 点击展开</span>
        <span class="testbench__toggle-arrow">▲</span>
      </button>
      <div class="testbench__body">${html}</div>
    `;
    document.body.appendChild(container);

    // 展开 / 收起切换
    container.querySelector('.testbench__toggle').addEventListener('click', () => {
      const isOpen = container.classList.toggle('open');
      container.classList.toggle('collapsed', !isOpen);
      document.body.classList.toggle('testbench-open', isOpen);
      const label = container.querySelector('.testbench__toggle-label');
      if (label) label.textContent = isOpen ? '🧪 测试台 · 点击收起' : '🧪 测试台 · 点击展开';
    });

    // 游戏按钮切换
    container.querySelectorAll('.testbench__game-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.game;
        this.launchGame(gid);
      });
    });

    // 渲染每个游戏的变体按钮
    [...this.gameOrder, ...this.testGames.old, ...this.testGames.v1, ...this.testGames.v2, ...this.testGames.v3].forEach(gid => {
      this.renderVariants(gid);
    });
  },

  // 启动游戏后自动收起测试台，避免遮挡游戏交互
  collapseTestBench() {
    const tb = document.getElementById('testbench');
    if (!tb) return;
    if (tb.classList.contains('open')) {
      tb.classList.remove('open');
      tb.classList.add('collapsed');
      document.body.classList.remove('testbench-open');
      const label = tb.querySelector('.testbench__toggle-label');
      if (label) label.textContent = '🧪 测试台 · 点击展开';
    }
  },

  // 每个游戏的变体配置（由各游戏类声明）
  getVariants(gameId) {
    const GameClass = this.getGameClass(gameId);
    return GameClass ? GameClass.variants : [];
  },

  renderVariants(gameId) {
    const group = document.querySelector(`.testbench__group[data-game="${gameId}"]`);
    if (!group) return;
    const variants = this.getVariants(gameId);
    const box = group.querySelector('.testbench__variants');
    if (!box || !variants.length) return;
    box.innerHTML = variants.map((v, i) =>
      `<button class="testbench__variant-btn" data-game="${gameId}" data-variant="${v.id}">${v.name}</button>`
    ).join('');
    box.querySelectorAll('.testbench__variant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.launchGame(gameId, btn.dataset.variant);
      });
    });
  },

  getGameClass(gameId) {
    const gameMap = {
      memory: MemoryGame,
      abstraction: AbstractionGame,
      executive: ExecutiveGame,
      calculation: CalculationGame,
      attention: AttentionGame,
      perception: PerceptionGame,
      // 新游戏
      schulte: SchulteGame,
      visualarray: VisualArrayGame,
      nback: NBackGame,
      trail: TrailGame,
      digitsymbol: DigitSymbolGame,
      flanker: FlankerGame,
      operationspan: OperationSpanGame,
      matrix: MatrixGame,
      // 新测试题 v2
      corsi: CorsiGame,
      gonogo: GoNoGoGame,
      serial7: Serial7Game,
      bart: BartGame,
      wordrecall: WordRecallGame,
      // 新测试题 v3
      simon: SimonGame,
      wcst: WcstGame
    };
    return gameMap[gameId] || null;
  },

  // 测试台启动游戏（跳过引导）
  launchGame(gameId, variantId) {
    // 启动游戏后自动收起测试台，避免遮挡交互
    this.collapseTestBench();

    // 清理上一个游戏
    if (this.currentGame) {
      this.currentGame.destroy();
    }
    this.currentGameId = gameId;
    this.currentVariant = variantId || null;

    const container = document.getElementById('game-container');
    container.innerHTML = '';

    const GameClass = this.getGameClass(gameId);
    if (GameClass) {
      const variant = variantId || (GameClass.variants && GameClass.variants[0] ? GameClass.variants[0].id : null);
      this.currentGame = new GameClass(container, (result) => {
        this.onTestGameEnd(result, gameId);
      }, variant);
      this.currentGame.init();
      this.currentGame.start();

      // 高亮当前游戏/变体按钮
      this.highlightSwitcher(gameId, variant);
    }
  },

  onTestGameEnd(result, gameId) {
    // 测试台模式：只显示得分浮条，不弹结算、不推进流程
    this.showTestScore(result, gameId);
  },

  showTestScore(result, gameId) {
    const level = Utils.getLevel(result.score);
    let float = document.getElementById('test-score-float');
    if (!float) {
      float = document.createElement('div');
      float.id = 'test-score-float';
      float.className = 'test-score-float';
      document.body.appendChild(float);
    }
    const meta = this.gameMeta[gameId];
    float.innerHTML = `
      <span>${meta.icon} ${meta.name} 得分</span>
      <strong style="color:${level.color}">${result.score}</strong>
      <span class="score-badge ${level.class}">${level.label}</span>
      <span style="color:var(--text-light);font-size:12px;">${result.detail || ''}</span>
    `;
    float.classList.remove('hidden');
    float.classList.add('show');
    setTimeout(() => float.classList.remove('show'), 4000);
  },

  highlightSwitcher(gameId, variantId) {
    document.querySelectorAll('.testbench__group').forEach(g => g.classList.remove('active'));
    const group = document.querySelector(`.testbench__group[data-game="${gameId}"]`);
    if (group) group.classList.add('active');
    document.querySelectorAll('.testbench__variant-btn').forEach(b => b.classList.remove('active'));
    if (variantId) {
      const btn = document.querySelector(`.testbench__variant-btn[data-game="${gameId}"][data-variant="${variantId}"]`);
      if (btn) btn.classList.add('active');
    }
  },

  bindEvents() {
    // 首页按钮：直接进入第一个游戏引导页
    document.getElementById('btn-start').addEventListener('click', () => {
      this.gameResults = {};
      this.showNextGame();
    });

    // 报告页：重新测试（清空结果重新开始）
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.gameResults = {};
      Store.clearResults();
      this.showNextGame();
    });

    // 报告页：返回首页
    document.getElementById('btn-back-home').addEventListener('click', () => {
      this.gameResults = {};
      Store.clearResults();
      this.showPage('home');
    });
  },

  showPage(name, data) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    const page = document.getElementById('page-' + name);
    if (page) {
      page.classList.remove('hidden');
      page.classList.add('fade-in');
      setTimeout(() => page.classList.remove('fade-in'), 300);
    }

    this.currentPage = name;

    // 页面初始化
    switch (name) {
      case 'home':
        break;
      case 'guide':
        this.initGuide(data);
        break;
      case 'game':
        this.initGame(data);
        break;
      case 'report':
        this.initReport();
        break;
    }
  },

  showNextGame() {
    const completed = Object.keys(this.gameResults);
    const next = this.gameOrder.find(g => !completed.includes(g));

    if (next) {
      this.showPage('guide', next);
    } else {
      // 所有游戏完成
      Store.saveResults(this.gameResults);
      this.showPage('report');
    }
  },

  initGame(gameId, variantId) {
    const container = document.getElementById('game-container');
    container.innerHTML = '';

    // 清理上一个游戏
    if (this.currentGame) {
      this.currentGame.destroy();
    }

    this.currentGameId = gameId;

    // 创建游戏实例（支持变体）
    const GameClass = this.getGameClass(gameId);
    if (GameClass) {
      this.currentGame = new GameClass(container, (result) => {
        this.gameResults[gameId] = result;
        this.showGameResult(result);
      }, variantId);
      this.currentGame.init();
      this.currentGame.start();
    }
  },

  showGameResult(result) {
    const level = Utils.getLevel(result.score);
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('game-overlay-content');

    // 是否为正式流程最后一个游戏
    const isLast = this.currentGameId === this.gameOrder[this.gameOrder.length - 1];
    const nextLabel = isLast ? '完成测试' : '下一项';

    content.innerHTML = `
      <div class="game__overlay-title">游戏结束</div>
      <div class="game__overlay-score" style="color:${level.color}">${result.score}</div>
      <div class="score-badge ${level.class}">${level.label}</div>
      <div class="game__overlay-detail mt-16">${result.detail}</div>
      <button class="btn btn-primary btn-block" id="btn-next-game">${nextLabel}</button>
      <button class="btn btn-ghost btn-block mt-8" id="btn-retry-game">再来一次</button>
    `;

    overlay.classList.remove('hidden');

    // 下一项 / 完成测试：推进流程
    document.getElementById('btn-next-game').addEventListener('click', () => {
      overlay.classList.add('hidden');
      this.showNextGame();
    });

    // 再来一次：重新启动当前游戏（成绩覆盖旧值，最终分数按最新一次计算）
    document.getElementById('btn-retry-game').addEventListener('click', () => {
      overlay.classList.add('hidden');
      const gameId = this.currentGameId;
      this.initGame(gameId);
    });
  },

  initGuide(gameId) {
    const meta = this.gameMeta[gameId];
    const index = this.gameOrder.indexOf(gameId);

    document.getElementById('guide-step').textContent = `第 ${index + 1}/${this.gameOrder.length} 项`;
    document.getElementById('guide-title').textContent = meta.name;
    document.getElementById('guide-desc').textContent = meta.desc;

    const intro = document.querySelector('.guide__intro');
    const ready = document.querySelector('.guide__ready');

    intro.classList.remove('hidden');
    ready.classList.remove('active');

    // 点击开始后倒计时
    document.getElementById('btn-guide-start').onclick = () => {
      intro.classList.add('hidden');
      ready.classList.add('active');

      let count = 3;
      const countdownEl = document.getElementById('guide-countdown');
      countdownEl.textContent = count;

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          countdownEl.textContent = count;
          countdownEl.classList.remove('scale-in');
          void countdownEl.offsetWidth;
          countdownEl.classList.add('scale-in');
        } else {
          clearInterval(timer);
          this.showPage('game', gameId);
        }
      }, 1000);
    };
  },

  initReport() {
    const results = Store.getResults();
    if (!results) return;

    const avg = results.averageScore;
    const avgLevel = Utils.getLevel(avg);

    // 综合评分
    document.getElementById('report-score').textContent = avg;
    document.getElementById('report-score').style.color = avgLevel.color;
    document.getElementById('report-level').textContent = avgLevel.label;
    document.getElementById('report-level').style.color = avgLevel.color;

    // 雷达图
    this.drawRadar(results);

    // 维度卡片
    const adviceMap = {
      memory:      '尝试每日记忆练习，如背诵电话号码、购物清单',
      corsi:       '多做视知觉与空间记忆训练，如拼图、记忆路线、棋类游戏',
      simon:       '练习专注与反应抑制，如冥想、正念呼吸、快速反应游戏',
      wcst:        '多做分类与规则转换练习，如打牌、整理物品、数独',
      abstraction: '多做逻辑推理练习，如下棋、数独',
      executive:   '练习专注力训练，如冥想、正念呼吸',
      calculation: '日常多做心算，如购物时计算总价',
      attention:   '减少多任务操作，专注单一任务训练',
      perception:  '多进行空间想象练习，如拼图、积木'
    };

    // 维度卡片显示名（二字，区别于引导页四字名）
    const dimLabel = {
      memory: '记忆力',
      corsi: '视知觉',
      simon: '执行力',
      wcst: '抽象力'
    };

    const dims = document.getElementById('report-dimensions');
    dims.innerHTML = '';

    this.gameOrder.forEach(key => {
      const r = results[key];
      if (!r) return;
      const level = Utils.getLevel(r.score);

      dims.innerHTML += `
        <div class="report__dim-card fade-in-up">
          <div class="report__dim-header">
            <span class="report__dim-name">${dimLabel[key] || ''}</span>
            <span class="report__dim-score" style="color:${level.color}">${r.score}</span>
          </div>
          <div class="report__dim-bar">
            <div class="report__dim-bar-fill ${level.class}" style="width:${r.score}%"></div>
          </div>
          <div class="report__dim-desc">${r.detail}</div>
          <div class="report__dim-advice">${r.score < 70 ? adviceMap[key] : '保持良好状态，继续坚持锻炼'}</div>
        </div>
      `;
    });
  },

  drawRadar(results) {
    const canvas = document.getElementById('radar-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = 100;
    const labels = this.gameOrder.map(k => this.gameMeta[k].name);
    const scores = this.gameOrder.map(k => results[k] ? results[k].score : 0);
    const n = Math.max(3, this.gameOrder.length);

    // 绘制网格
    for (let ring = 1; ring <= 4; ring++) {
      const r = maxR * ring / 4;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#E4E7ED';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 绘制轴线
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = '#E4E7ED';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 绘制数据区域
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const r = maxR * scores[idx] / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(74, 144, 217, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = maxR * scores[i] / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4A90D9';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 标签
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = maxR + 24;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.fillText(labels[i], x, y);
    }
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
