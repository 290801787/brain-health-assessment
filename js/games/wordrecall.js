// 新游戏：词语列表回忆（言语记忆）— 参考 cf3901646/cognitive-assessment（ACE-III/MoCA 词语回忆范式）
// 玩法：展示 5 个词语记忆 → 做 3 道干扰题 → 回忆输入 → 延迟后再回忆一次（可配置）
// 词语用常见生活词，中老年用户友好
class WordRecallGame {
  // 测试台变体配置
  static variants = [
    { id: 'standard', name: '标准5词', params: { wordCount: 5, withDelay: true } },
    { id: 'hard', name: '强化7词', params: { wordCount: 7, withDelay: false } }
  ];

  // 常用生活词语池
  static WORD_POOL = [
    '苹果', '桌子', '医生', '火车', '花朵',
    '书包', '米饭', '太阳', '电视', '雨伞',
    '钥匙', '牛奶', '公园', '电话', '窗户',
    '老师', '篮球', '月亮', '毛巾', '椅子'
  ];

  constructor(container, onComplete, variantId) {
    this.container = container;
    this.onComplete = onComplete;
    const v = (WordRecallGame.variants.find(x => x.id === variantId) || WordRecallGame.variants[0]).params;
    this.wordCount = v.wordCount || 5;
    this.withDelay = v.withDelay !== false;
    this.words = [];
    this.phase = 'learn'; // learn | distractor | recall | delay | recall2
    this.distractorIndex = 0;
    this.distractorTotal = 3;
    this.distractorCorrect = 0;
    this.recallCount = 0;
    this.recall2Count = 0;
    this.timers = [];
    this.userRecall = [];
    this.distractorAnswer = 0;
  }

  init() {
    this.container.innerHTML = `
      <div class="game">
        <div class="game__header">
          <div class="game__title">📝 词语回忆</div>
          <div class="game__info">
            <div class="game__stat" id="wr-stage">记忆阶段</div>
          </div>
        </div>
        <div class="game__body" id="wr-body">
        </div>
      </div>
    `;
    this.pickWords();
  }

  pickWords() {
    // 随机选词
    this.words = Utils.pickN(WordRecallGame.WORD_POOL, this.wordCount);
  }

  start() {
    this.showLearn();
  }

  showLearn() {
    this.phase = 'learn';
    document.getElementById('wr-stage').textContent = '记忆阶段';
    const body = document.getElementById('wr-body');

    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:16px;">请记住下面 ${this.wordCount} 个词语（限时 ${this.withDelay ? 10 : 8} 秒）</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:24px;">
        ${this.words.map(w => `<div class="wr-word-chip">${w}</div>`).join('')}
      </div>
      <div id="wr-learn-timer" style="font-size:20px;font-weight:700;color:var(--primary);"></div>
    `;

    // 倒计时
    let left = this.withDelay ? 10 : 8;
    const timerEl = document.getElementById('wr-learn-timer');
    timerEl.textContent = left;
    const t = setInterval(() => {
      left--;
      timerEl.textContent = left;
      if (left <= 3) timerEl.style.color = 'var(--danger)';
      if (left <= 0) {
        clearInterval(t);
        this.showDistractor();
      }
    }, 1000);
    this.timers.push(t);
  }

  showDistractor() {
    this.phase = 'distractor';
    document.getElementById('wr-stage').textContent = '干扰任务';
    const body = document.getElementById('wr-body');

    // 简单算术干扰题
    const a = Utils.randInt(10, 40);
    const b = Utils.randInt(5, 20);
    const isPlus = Math.random() > 0.5;
    const answer = isPlus ? a + b : a - b;
    this.distractorAnswer = answer;

    // 干扰选项
    const wrongs = new Set();
    let guard = 0;
    while (wrongs.size < 3 && guard < 30) {
      const w = answer + Utils.randInt(-5, 5);
      if (w !== answer && w > 0) wrongs.add(w);
      guard++;
    }
    while (wrongs.size < 3) wrongs.add(answer + wrongs.size + 3);
    const options = Utils.shuffle([answer, ...wrongs]);

    body.innerHTML = `
      <div style="font-size:13px;color:var(--text-light);margin-bottom:16px;">先做几道小题（干扰任务），题目：</div>
      <div style="font-size:32px;font-weight:700;color:var(--text);margin-bottom:20px;">${a} ${isPlus ? '+' : '−'} ${b} = ?</div>
      <div class="options-grid" id="wr-distractor-options">
        ${options.map((opt, i) => `<button class="option-btn" data-idx="${i}" data-val="${opt}">${opt}</button>`).join('')}
      </div>
    `;

    document.getElementById('wr-distractor-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || this.phase !== 'distractor') return;
      this.phase = 'distractor-answered';
      const val = parseInt(btn.dataset.val);
      if (val === this.distractorAnswer) this.distractorCorrect++;
      btn.classList.add(val === this.distractorAnswer ? 'correct' : 'wrong');
      // 显示正确答案（答错时高亮正确选项）
      if (val !== this.distractorAnswer) {
        const correctBtn = document.querySelector(`#wr-distractor-options .option-btn[data-val="${this.distractorAnswer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      setTimeout(() => this.nextDistractor(), 500);
    });
  }

  nextDistractor() {
    this.distractorIndex++;
    if (this.distractorIndex < this.distractorTotal) {
      this.showDistractor();
    } else {
      this.showRecall();
    }
  }

  showRecall() {
    this.phase = 'recall';
    document.getElementById('wr-stage').textContent = '回忆阶段';
    const body = document.getElementById('wr-body');

    // 词语候选区：打乱所有词 + 干扰词，用户点击已记住的
    const distractors = Utils.pickN(WordRecallGame.WORD_POOL.filter(w => !this.words.includes(w)), this.wordCount);
    const allWords = Utils.shuffle([...this.words, ...distractors]);

    body.innerHTML = `
      <div style="font-size:14px;color:var(--text);margin-bottom:16px;">请点击你记住的词语（可多选，选完点确认）</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;">
        ${allWords.map((w, i) => `<button class="wr-recall-chip" data-word="${w}">${w}</button>`).join('')}
      </div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">已选：<span id="wr-selected"></span></div>
      <button class="btn btn-primary btn-block" id="wr-confirm" style="max-width:280px;">确认回忆</button>
    `;

    this.userRecall = [];
    const chips = document.querySelectorAll('.wr-recall-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.phase !== 'recall') return;
        const word = chip.dataset.word;
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          this.userRecall = this.userRecall.filter(w => w !== word);
        } else {
          chip.classList.add('selected');
          this.userRecall.push(word);
        }
        document.getElementById('wr-selected').textContent = this.userRecall.join('、');
      });
    });

    document.getElementById('wr-confirm').addEventListener('click', () => {
      if (this.phase !== 'recall') return;
      // 计分
      this.recallCount = this.userRecall.filter(w => this.words.includes(w)).length;
      this.showRecallFeedback();
    });
  }

  showRecallFeedback() {
    this.phase = 'recall-feedback';
    const body = document.getElementById('wr-body');
    const missed = this.words.filter(w => !this.userRecall.includes(w));

    body.innerHTML = `
      <div style="font-size:20px;font-weight:700;color:${this.recallCount >= this.wordCount ? 'var(--success)' : 'var(--warning)'};margin-bottom:12px;">
        回忆起 ${this.recallCount}/${this.wordCount} 个
      </div>
      ${missed.length ? `<div style="font-size:14px;color:var(--text-light);margin-bottom:20px;">漏掉的：${missed.join('、')}</div>` : ''}
      <button class="btn btn-primary btn-block" id="wr-next" style="max-width:280px;">${this.withDelay ? '继续' : '查看结果'}</button>
    `;

    document.getElementById('wr-next').addEventListener('click', () => {
      if (this.withDelay) {
        this.showDelay();
      } else {
        this.end();
      }
    });
  }

  showDelay() {
    // 延迟阶段：显示一段时间"请稍候"（模拟延迟回忆间隔），期间可做个小任务
    this.phase = 'delay';
    document.getElementById('wr-stage').textContent = '延迟阶段';
    const body = document.getElementById('wr-body');

    body.innerHTML = `
      <div style="font-size:16px;color:var(--text);margin-bottom:12px;">请稍候…</div>
      <div style="font-size:32px;font-weight:700;color:var(--primary);margin-bottom:8px;" id="wr-delay-count">5</div>
      <div style="font-size:13px;color:var(--text-light);">倒计时后请再次回忆词语</div>
    `;

    let left = 5;
    const timerEl = document.getElementById('wr-delay-count');
    const t = setInterval(() => {
      left--;
      timerEl.textContent = left;
      if (left <= 0) {
        clearInterval(t);
        this.showRecall2();
      }
    }, 1000);
    this.timers.push(t);
  }

  showRecall2() {
    this.phase = 'recall2';
    document.getElementById('wr-stage').textContent = '延迟回忆';
    const body = document.getElementById('wr-body');

    const distractors = Utils.pickN(WordRecallGame.WORD_POOL.filter(w => !this.words.includes(w)), this.wordCount);
    const allWords = Utils.shuffle([...this.words, ...distractors]);

    body.innerHTML = `
      <div style="font-size:14px;color:var(--text);margin-bottom:16px;">再次回忆刚才的词语（可多选）</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;">
        ${allWords.map((w, i) => `<button class="wr-recall-chip" data-word="${w}">${w}</button>`).join('')}
      </div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">已选：<span id="wr-selected2"></span></div>
      <button class="btn btn-primary btn-block" id="wr-confirm2" style="max-width:280px;">确认</button>
    `;

    this.userRecall = [];
    document.querySelectorAll('.wr-recall-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.phase !== 'recall2') return;
        const word = chip.dataset.word;
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          this.userRecall = this.userRecall.filter(w => w !== word);
        } else {
          chip.classList.add('selected');
          this.userRecall.push(word);
        }
        document.getElementById('wr-selected2').textContent = this.userRecall.join('、');
      });
    });

    document.getElementById('wr-confirm2').addEventListener('click', () => {
      this.recall2Count = this.userRecall.filter(w => this.words.includes(w)).length;
      this.end();
    });
  }

  end() {
    // 计分：即刻回忆 70% + 延迟回忆 30%（无延迟模式则即刻回忆100%）
    const immediateScore = this.recallCount / this.wordCount;
    let score;
    if (this.withDelay) {
      const delayScore = this.recall2Count / this.wordCount;
      score = (immediateScore * 0.7 + delayScore * 0.3) * 100;
    } else {
      score = immediateScore * 100;
    }
    score = Math.min(100, Math.max(0, Math.round(score)));

    const detail = this.withDelay
      ? `即刻回忆 ${this.recallCount}/${this.wordCount}，延迟回忆 ${this.recall2Count}/${this.wordCount}`
      : `回忆起 ${this.recallCount}/${this.wordCount} 个词语`;

    this.onComplete({
      score,
      detail,
      immediate: this.recallCount,
      delayed: this.recall2Count
    });
  }

  destroy() {
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  }
}
