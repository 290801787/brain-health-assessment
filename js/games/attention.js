// 游戏五：找不同（注意力）
class AttentionGame {
  // 测试台变体配置
  static variants = [
    { id: 'random', name: '随机抽象', params: { theme: 'random' } },
    { id: 'living', name: '客厅场景', params: { theme: 'living' } },
    { id: 'garden', name: '花园场景', params: { theme: 'garden' } },
    { id: 'sea', name: '海边场景', params: { theme: 'sea' } }
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (AttentionGame.variants.find(x => x.id === variantId) || AttentionGame.variants[0]).params;
    this.theme = v.theme || 'random';
    this.found = 0;
    this.totalDiffs = 5;
    this.wrongClicks = 0;
    this.duration = 60;
    this.timer = null;
    this.diffs = [];
    this.scene = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">🔍 找不同</div>
          <div class="game__info">
            <div class="game__stat">找到 <span class="game__stat-value" id="att-found">0</span>/${this.totalDiffs}</div>
            <div class="timer">
              <span class="timer__icon">⏱</span>
              <span class="timer__value" id="att-timer">${this.duration}</span>
            </div>
          </div>
        </div>
        <div class="game__body" id="att-body">
          <div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">点击右图中的差异位置</div>
          <div class="diff-container" id="att-panels"></div>
        </div>
      </div>
    `;
    this.generateScene();
  }

  // 主题场景定义（贴近生活的元素，中老年用户更易识别）
  getThemeElements() {
    const themes = {
      living: [
        { shape: 'rect', color: '#C08552', x: 15, y: 30, w: 30, h: 18, name: '沙发' },
        { shape: 'rect', color: '#E8D8C4', x: 52, y: 22, w: 14, h: 26, name: '柜子' },
        { shape: 'circle', color: '#F7D154', x: 70, y: 45, r: 7, name: '台灯' },
        { shape: 'rect', color: '#8B7E6F', x: 30, y: 62, w: 26, h: 8, name: '茶几' },
        { shape: 'heart', color: '#E74C3C', x: 45, y: 52, s: 6, name: '抱枕' },
        { shape: 'circle', color: '#3498DB', x: 60, y: 60, r: 5, name: '花瓶' },
        { shape: 'square', color: '#2ECC71', x: 22, y: 50, s: 5, name: '绿植' },
        { shape: 'circle', color: '#95A5A6', x: 82, y: 62, r: 4, name: '遥控器' }
      ],
      garden: [
        { shape: 'circle', color: '#E74C3C', x: 20, y: 75, r: 6, name: '花' },
        { shape: 'square', color: '#27AE60', x: 55, y: 70, s: 7, name: '灌木' },
        { shape: 'triangle', color: '#2ECC71', x: 30, y: 40, s: 12, name: '树' },
        { shape: 'circle', color: '#F39C12', x: 75, y: 78, r: 5, name: '果子' },
        { shape: 'rect', color: '#8B4513', x: 60, y: 30, w: 14, h: 8, name: '长椅' },
        { shape: 'circle', color: '#9B59B6', x: 45, y: 55, r: 4, name: '蝴蝶' },
        { shape: 'rect', color: '#AAB7B8', x: 12, y: 55, w: 10, h: 18, name: '栅栏' },
        { shape: 'circle', color: '#3498DB', x: 85, y: 45, r: 5, name: '喷水壶' }
      ],
      sea: [
        { shape: 'circle', color: '#F1C40F', x: 50, y: 18, r: 8, name: '太阳' },
        { shape: 'circle', color: '#3498DB', x: 20, y: 55, r: 6, name: '云' },
        { shape: 'triangle', color: '#2C3E50', x: 45, y: 75, s: 14, name: '帆船' },
        { shape: 'circle', color: '#E67E22', x: 75, y: 65, r: 5, name: '救生圈' },
        { shape: 'square', color: '#E74C3C', x: 28, y: 82, s: 6, name: '沙滩巾' },
        { shape: 'heart', color: '#FF6B6B', x: 65, y: 85, s: 5, name: '贝壳' },
        { shape: 'circle', color: '#1ABC9C', x: 85, y: 40, r: 4, name: '海鸥' },
        { shape: 'rect', color: '#D35400', x: 12, y: 70, w: 10, h: 12, name: '沙堡' }
      ]
    };
    return themes[this.theme] || null;
  }

  generateScene() {
    // 主题场景：用预定义元素 + 随机差异，避免坐标/形状退化
    const themed = this.getThemeElements();
    const elements = [];
    if (themed) {
      themed.forEach(el => elements.push({ ...el }));
    } else {
      // 随机抽象场景（原有逻辑）
      const colors = ['#F56C6C', '#4A90D9', '#67C23A', '#E6A23C', '#9B59B6', '#1ABC9C'];
      const shapes = ['circle', 'square', 'triangle', 'star', 'diamond', 'heart'];
      for (let i = 0; i < 8; i++) {
        elements.push({
          shape: shapes[i % shapes.length],
          color: colors[i % colors.length],
          x: 15 + (i % 4) * 22,
          y: 20 + Math.floor(i / 4) * 42,
          size: 12 + (i % 3) * 4
        });
      }
    }

    // 差异色板：主题和抽象场景通用
    const palette = ['#F56C6C', '#4A90D9', '#67C23A', '#E6A23C', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#8E44AD', '#16A085'];

    // 选择5个差异
    const diffIndices = Utils.pickN([0,1,2,3,4,5,6,7], 5);
    const diffTypes = ['color', 'color', 'missing', 'size', 'shape'];

    this.diffs = diffIndices.map((idx, i) => {
      const el = { ...elements[idx] };
      const type = diffTypes[i];
      let modified = { ...el };

      switch (type) {
        case 'color':
          // 从色板选一个与当前颜色不同的颜色
          let newColor = el.color;
          let guard = 0;
          while (newColor === el.color && guard < 20) {
            newColor = Utils.pick(palette);
            guard++;
          }
          modified.color = newColor;
          break;
        case 'missing':
          modified.hidden = true;
          break;
        case 'size':
          // 主题元素用自身尺寸属性放大，抽象元素用 size
          if (el.r) modified.r = el.r + 4;
          else if (el.w && el.h) { modified.w = el.w + 4; modified.h = el.h + 4; }
          else if (el.s) modified.s = el.s + 4;
          else modified.size = (el.size || 12) + 8;
          break;
        case 'shape':
          // 主题元素改为 circle/square/triangle 之间互转
          const altShapes = ['circle', 'square', 'triangle', 'diamond', 'star', 'heart'].filter(s => s !== el.shape);
          modified.shape = Utils.pick(altShapes);
          break;
      }

      return {
        index: idx,
        type,
        original: el,
        modified,
        x: el.x,
        y: el.y,
        found: false
      };
    });

    this.scene = { elements, diffIndices };
    this.renderScene();
  }

  renderScene() {
    const panels = document.getElementById('att-panels');

    // 左图（原图）
    const leftSvg = this.drawScene(false);
    // 右图（有差异）
    const rightSvg = this.drawScene(true);

    panels.innerHTML = `
      <div class="diff-panel" id="att-left">${leftSvg}</div>
      <div class="diff-panel" id="att-right">${rightSvg}</div>
    `;

    // 点击右图
    document.getElementById('att-right').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      this.handleClick(x, y, e.currentTarget);
    });
  }

  drawScene(isRight) {
    const els = this.scene.elements;
    // viewBox 与容器 3:4 宽高比一致，避免等比缩放留白导致坐标错位
    const VB_W = 100, VB_H = 133.3;
    let svg = `<svg viewBox="0 0 ${VB_W} ${VB_H}" width="100%" height="100%" style="background:#FAFBFC;" preserveAspectRatio="xMidYMid meet">`;

    // 背景装饰
    svg += `<rect x="0" y="0" width="${VB_W}" height="${VB_H}" fill="#FAFBFC" rx="4"/>`;
    svg += `<rect x="5" y="5" width="90" height="123.3" fill="none" stroke="#E4E7ED" stroke-width="0.5" rx="2"/>`;

    els.forEach((el, idx) => {
      const diff = isRight ? this.diffs.find(d => d.index === idx) : null;
      const current = diff ? diff.modified : el;

      if (current.hidden) return;

      svg += this.drawElement(current, idx);
    });

    svg += `</svg>`;
    return svg;
  }

  drawElement(el, idx) {
    // 兼容两种元素描述：
    // 抽象场景：{ shape, color, x, y, size }
    // 主题场景：{ shape, color, x, y, w/h/r/s 视 shape 而定 }
    const cx = el.x;
    const cy = el.y;
    const fill = el.color;
    const s = el.size || el.s || el.r * 2 || el.w || 10;

    switch (el.shape) {
      case 'rect':
        return `<rect x="${cx}" y="${cy}" width="${el.w || s}" height="${el.h || s}" fill="${fill}" rx="2"/>`;
      case 'circle':
        return `<circle cx="${cx}" cy="${cy}" r="${el.r || s/2}" fill="${fill}"/>`;
      case 'square':
        return `<rect x="${cx - s/2}" y="${cy - s/2}" width="${s}" height="${s}" fill="${fill}" rx="1"/>`;
      case 'triangle':
        return `<polygon points="${cx},${cy - s/2} ${cx - s/2},${cy + s/2} ${cx + s/2},${cy + s/2}" fill="${fill}"/>`;
      case 'star':
        return this.drawStar(cx, cy, s/2, fill);
      case 'diamond':
        return `<polygon points="${cx},${cy - s/2} ${cx + s/2},${cy} ${cx},${cy + s/2} ${cx - s/2},${cy}" fill="${fill}"/>`;
      case 'heart':
        return `<text x="${cx}" y="${cy + s/4}" text-anchor="middle" font-size="${s}" fill="${fill}">♥</text>`;
      default:
        return `<circle cx="${cx}" cy="${cy}" r="${s/2}" fill="${fill}"/>`;
    }
  }

  drawStar(cx, cy, r, fill) {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (Math.PI * 2 * i / 5) - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      points.push(`${cx + r * Math.cos(outerAngle)},${cy + r * Math.sin(outerAngle)}`);
      points.push(`${cx + r * 0.4 * Math.cos(innerAngle)},${cy + r * 0.4 * Math.sin(innerAngle)}`);
    }
    return `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
  }

  handleClick(x, y, container) {
    let foundDiff = false;

    for (const diff of this.diffs) {
      if (diff.found) continue;
      const dist = Math.sqrt((x - diff.x) ** 2 + (y - diff.y) ** 2);
      // 命中半径调大：180px 容器宽对应 100 单位，30px 屏幕距离 ≈ 16.7 单位
      if (dist < 16) {
        // 找到了
        diff.found = true;
        this.found++;
        foundDiff = true;

        document.getElementById('att-found').textContent = this.found;

        // 添加标记
        const marker = document.createElement('div');
        marker.className = 'diff-marker';
        marker.style.left = diff.x + '%';
        marker.style.top = diff.y + '%';
        container.appendChild(marker);

        if (this.found >= this.totalDiffs) {
          setTimeout(() => this.end(), 500);
        }
        break;
      }
    }

    if (!foundDiff) {
      this.wrongClicks++;
      // 错误标记
      const marker = document.createElement('div');
      marker.className = 'diff-marker wrong';
      marker.style.left = x + '%';
      marker.style.top = y + '%';
      container.appendChild(marker);
      setTimeout(() => marker.remove(), 600);
    }
  }

  start() {
    this.timer = Utils.createTimer(this.duration, (remaining) => {
      const timerEl = document.getElementById('att-timer');
      timerEl.textContent = remaining;
      if (remaining <= 10) timerEl.classList.add('warning');
    }, () => {
      this.end();
    });
  }

  end() {
    if (this.timer) this.timer.stop();

    let score = this.found * 20 - this.wrongClicks * 2;
    score = Math.max(0, Math.min(100, score));

    this.onComplete({
      score,
      detail: `找到 ${this.found}/${this.totalDiffs} 处差异`,
      found: this.found,
      wrongClicks: this.wrongClicks
    });
  }

  destroy() {
    if (this.timer) this.timer.stop();
  }
}
