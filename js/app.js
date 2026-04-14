/**
 * 减脂助手 - 主应用逻辑
 */

const App = {
  currentPage: 'dashboard',
  profile: null,
  settings: null,
  today: Calculator.getToday(),
  weightChartPeriod: '7d',
  weightChart: null,

  // 常用食物数据库
  foodDatabase: {
    home: [
      { name: '燕麦粥', calories: 150 },
      { name: '煮鸡蛋', calories: 70 },
      { name: '全麦面包', calories: 80 },
      { name: '牛奶', calories: 150 },
      { name: '鸡胸肉', calories: 165 },
      { name: '米饭', calories: 200 },
      { name: '西兰花', calories: 55 },
      { name: '苹果', calories: 95 },
      { name: '香蕉', calories: 105 },
      { name: '酸奶', calories: 100 },
      { name: '牛肉', calories: 250 },
      { name: '沙拉', calories: 120 }
    ],
    takeout: [
      { name: '汉堡', calories: 450 },
      { name: '炸鸡', calories: 320 },
      { name: '披萨', calories: 266 },
      { name: '薯条', calories: 365 },
      { name: '三明治', calories: 400 },
      { name: '便当', calories: 600 },
      { name: '拉面', calories: 450 },
      { name: '盖浇饭', calories: 550 }
    ],
    drink: [
      { name: '美式咖啡', calories: 5 },
      { name: '拿铁', calories: 150 },
      { name: '卡布奇诺', calories: 140 },
      { name: '摩卡', calories: 290 },
      { name: '奶茶', calories: 300 },
      { name: '可乐', calories: 140 },
      { name: '果汁', calories: 120 },
      { name: '无糖茶', calories: 0 }
    ]
  },

  init() {
    this.loadData();
    this.bindEvents();
    this.renderAll();
    this.updateDateDisplay();
  },

  loadData() {
    this.profile = Storage.getProfile();
    this.settings = Storage.getSettings();

    // 填充设置表单
    if (this.profile) {
      document.getElementById('setting-nickname').value = this.profile.nickname || '';
      document.getElementById('setting-height').value = this.profile.height || '';
      document.getElementById('setting-age').value = this.profile.age || '';
      document.getElementById('setting-target-weight').value = this.profile.targetWeight || '';
      document.getElementById('setting-target-date').value = this.profile.targetDate || '';

      // 性别按钮
      document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === this.profile.gender);
      });

      // 活动水平
      document.getElementById('setting-activity').value = this.profile.activityLevel || '1.375';
    }

    // 缺口目标
    if (this.settings.targetGap) {
      document.querySelectorAll('.gap-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.gap) === this.settings.targetGap);
      });
      document.getElementById('setting-gap').value = this.settings.targetGap;
    }
  },

  bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchPage(item.dataset.page);
      });
    });

    // 图表周期切换
    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.weightChartPeriod = tab.dataset.period;
        this.renderWeightChart();
      });
    });

    // 设置输入监听（实时更新代谢显示）
    ['setting-height', 'setting-age', 'setting-activity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.updateMetabolismDisplay());
        el.addEventListener('input', () => this.updateMetabolismDisplay());
      }
    });

    // 目标体重和日期输入监听（实时更新目标摘要）
    ['setting-target-weight', 'setting-target-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.updateTargetSummary());
        el.addEventListener('input', () => this.updateTargetSummary());
      }
    });
  },

  switchPage(page) {
    this.currentPage = page;

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `${page}-page`);
    });

    window.scrollTo(0, 0);
    this.renderPage(page);
  },

  renderPage(page) {
    switch (page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'weight':
        this.renderWeightPage();
        break;
      case 'diet':
        this.renderDietPage();
        break;
      case 'exercise':
        this.renderExercisePage();
        break;
      case 'ranking':
        this.renderRankingPage();
        break;
      case 'settings':
        this.renderSettingsPage();
        break;
    }
  },

  renderAll() {
    this.renderDashboard();
    this.renderWeightPage();
    this.renderDietPage();
    this.renderSettingsPage();
  },

  // ==================== 仪表盘 ====================

  renderDashboard() {
    const latestWeight = Storage.getLatestWeight();
    const todayFoods = Storage.getFoodsByDate(this.today);
    const todayExercises = Storage.getExercisesByDate(this.today);

    // 计算代谢数据
    let bmr = 0, tdee = 0;
    if (this.profile && latestWeight) {
      bmr = Calculator.calculateBMR(latestWeight.weight, this.profile.height, this.profile.age, this.profile.gender);
      tdee = Calculator.calculateTDEE(bmr, this.profile.activityLevel);
    }

    const totalIntake = Storage.getTotalIntake(this.today);
    const totalBurn = Storage.getTotalBurn(this.today);

    // 目标缺口
    let targetGap = this.settings?.targetGap || 500;
    if (this.profile?.targetWeight && this.profile?.targetDate && latestWeight) {
      const rec = Calculator.calculateRecommendedGap(latestWeight.weight, this.profile.targetWeight, this.profile.targetDate);
      if (rec.isValid) targetGap = rec.gap;
    }

    // 当前缺口 = TDEE + 运动消耗 - 摄入
    const currentGap = Calculator.calculateGap(tdee, totalIntake, totalBurn);
    const gapPercentage = Calculator.calculateGapPercentage(currentGap, targetGap);

    // 更新UI
    document.getElementById('target-gap-display').textContent = targetGap;
    document.getElementById('gap-value').textContent = Math.round(currentGap);
    document.getElementById('tdee-display').textContent = tdee || '--';
    document.getElementById('stat-intake').textContent = totalIntake || '--';
    document.getElementById('stat-burn').textContent = totalBurn || '--';

    // 缺口状态
    const gapStatus = document.getElementById('gap-status');
    if (currentGap >= targetGap) {
      gapStatus.textContent = '已达标!';
      gapStatus.style.color = '#10b981';
    } else if (currentGap > 0) {
      gapStatus.textContent = `还差 ${targetGap - currentGap} kcal`;
      gapStatus.style.color = 'rgba(255,255,255,0.8)';
    } else {
      gapStatus.textContent = `已超 ${Math.abs(currentGap)} kcal`;
      gapStatus.style.color = '#fca5a5';
    }

    // 环形进度
    const gapRing = document.getElementById('gap-ring');
    const tdeeRing = document.getElementById('tdee-ring');
    if (gapRing) {
      const percentage = Math.min(Math.max(currentGap / targetGap, 0), 1);
      const circumference = 2 * Math.PI * 85;
      gapRing.style.strokeDasharray = circumference;
      gapRing.style.strokeDashoffset = circumference * (1 - percentage);
    }
    if (tdeeRing && tdee > 0) {
      const intakePercentage = Math.min(totalIntake / tdee, 1);
      const circumference = 2 * Math.PI * 65;
      tdeeRing.style.strokeDasharray = circumference;
      tdeeRing.style.strokeDashoffset = circumference * (1 - intakePercentage);
    }

    // 今日记录列表
    this.renderTodayRecords(todayFoods, todayExercises);

    // 建议
    const suggestion = Calculator.generateSuggestion(currentGap, targetGap, totalIntake, tdee);
    const suggestionEl = document.getElementById('suggestion-text');
    if (suggestionEl) {
      suggestionEl.textContent = suggestion.icon + ' ' + suggestion.text;
    }
  },

  renderTodayRecords(foods, exercises) {
    const container = document.getElementById('today-records');
    if (!container) return;

    const allRecords = [
      ...foods.map(f => ({ ...f, type: 'food' })),
      ...exercises.map(e => ({ ...e, type: 'exercise' }))
    ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (allRecords.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无记录</div>';
      return;
    }

    container.innerHTML = allRecords.map(item => `
      <div class="record-item">
        <div class="record-info">
          <span class="record-name">${item.type === 'food' ? '🍽️' : '🏃'} ${item.name}</span>
          <span class="record-meta">${item.time}</span>
        </div>
        <span class="record-calories ${item.type}">
          ${item.type === 'exercise' ? '-' : ''}${item.calories} kcal
        </span>
      </div>
    `).join('');
  },

  // ==================== 体重页 ====================

  renderWeightPage() {
    // 获取今日早晚体重
    const todayDual = Storage.getDualWeightByDate(this.today);
    const morningSpan = document.getElementById('morning-weight');
    const eveningSpan = document.getElementById('evening-weight');

    // 显示早晚体重
    if (todayDual?.morning) {
      morningSpan.textContent = todayDual.morning.weight;
      morningSpan.classList.add('has-value');
    } else {
      morningSpan.textContent = '--';
      morningSpan.classList.remove('has-value');
    }

    if (todayDual?.evening) {
      eveningSpan.textContent = todayDual.evening.weight;
      eveningSpan.classList.add('has-value');
    } else {
      eveningSpan.textContent = '--';
      eveningSpan.classList.remove('has-value');
    }

    // 使用早起体重作为每日体重
    const todayWeight = todayDual?.morning?.weight;

    // 当前体重显示（使用早起体重）
    if (todayWeight) {
      document.getElementById('current-weight').textContent = todayWeight;

      // 计算BMI和体脂
      if (this.profile?.height && this.profile?.age && this.profile?.gender) {
        const bmi = Calculator.calculateBMI(todayWeight, this.profile.height);
        const bodyFat = Calculator.calculateBodyFat(bmi, this.profile.age, this.profile.gender);
        document.getElementById('current-bmi').textContent = bmi;
        document.getElementById('current-fat').textContent = bodyFat + '%';

        // 更新存储的体重数据
        const weightData = Storage.getWeightByDate(this.today);
        if (weightData) {
          weightData.bmi = bmi;
          weightData.bodyFat = bodyFat;
          Storage.saveWeight(weightData);
        }
      }
    } else {
      document.getElementById('current-weight').textContent = '--';
      document.getElementById('current-bmi').textContent = '--';
      document.getElementById('current-fat').textContent = '--%';
    }

    // 目标体重
    if (this.profile?.targetWeight) {
      document.getElementById('target-weight-display').textContent = this.profile.targetWeight;
      if (todayWeight) {
        const diff = (todayWeight - this.profile.targetWeight).toFixed(1);
        document.getElementById('weight-progress').textContent = diff > 0 ? `还差 ${diff} kg` : '已达成!';
      }
    }

    // 代谢评估
    if (todayDual?.morning?.weight && todayDual?.evening?.weight) {
      const assessment = Calculator.assessMetabolism(todayDual.morning.weight, todayDual.evening.weight);
      if (assessment) {
        const assessmentEl = document.getElementById('metabolism-assessment');
        assessmentEl.style.display = 'block';

        const badgeEl = document.getElementById('metabolism-level');
        badgeEl.textContent = assessment.level;
        badgeEl.className = 'assessment-badge ' + assessment.badge;

        document.getElementById('weight-diff').textContent = `夜间消耗: ${assessment.diff} kg`;
        document.getElementById('assessment-tip').textContent = assessment.tip;
      }
    } else {
      document.getElementById('metabolism-assessment').style.display = 'none';
    }

    // 图表
    this.renderWeightChart();

    // 历史记录
    this.renderWeightHistory();
  },

  renderWeightChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;

    let weights = Storage.getWeights();

    // 根据周期筛选数据
    if (this.weightChartPeriod === '7d') {
      weights = weights.slice(0, 7);
    } else if (this.weightChartPeriod === '30d') {
      weights = weights.slice(0, 30);
    }

    // 如果没有数据，显示空图表
    if (weights.length === 0) {
      if (this.weightChart) {
        this.weightChart.destroy();
      }
      this.weightChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['暂无数据'],
          datasets: [{
            data: [0],
            borderColor: '#e5e7eb',
            backgroundColor: 'transparent',
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { display: false, min: 0, max: 100 },
            x: { display: false }
          }
        }
      });
      return;
    }

    // 只有1条数据时，创建一个点图表
    const sorted = [...weights].reverse();
    let labels, data;

    if (sorted.length === 1) {
      labels = [Calculator.getFriendlyDate(sorted[0].date), ''];
      data = [sorted[0].weight, sorted[0].weight];
    } else {
      labels = sorted.map(w => Calculator.getFriendlyDate(w.date));
      data = sorted.map(w => w.weight);
    }

    // 目标线
    const targetWeight = this.profile?.targetWeight;
    const targetData = targetWeight ? labels.map(() => targetWeight) : null;

    if (this.weightChart) {
      this.weightChart.destroy();
    }

    this.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '体重',
          data: data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: sorted.length === 1 ? 0 : 0.4,
          fill: true,
          pointRadius: sorted.length === 1 ? 6 : 4,
          pointBackgroundColor: '#6366f1'
        }, ...(targetData ? [{
          label: '目标',
          data: targetData,
          borderColor: '#10b981',
          borderDash: [5, 5],
          tension: 0,
          fill: false,
          pointRadius: 0
        }] : [])]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !!targetWeight,
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#f3f4f6' },
            ticks: { font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  },

  renderWeightHistory() {
    const history = Storage.getWeights().slice(0, 30);
    const container = document.getElementById('weight-history');

    if (history.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无记录</div>';
      return;
    }

    container.innerHTML = history.map(w => `
      <div class="history-item">
        <div class="history-left">
          <span class="history-weight">${w.weight} kg</span>
          <span class="history-meta">BMI ${w.bmi || '--'}</span>
        </div>
        <span class="history-date">${w.date}</span>
      </div>
    `).join('');
  },

  // ==================== 饮食页 ====================

  renderDietPage() {
    const foods = Storage.getFoodsByDate(this.today);
    const total = Storage.getTotalIntake(this.today);

    // 计算TDEE和BMR
    const latestWeight = Storage.getLatestWeight();
    let bmr = 0, tdee = 0;
    if (this.profile && latestWeight) {
      bmr = Calculator.calculateBMR(latestWeight.weight, this.profile.height, this.profile.age, this.profile.gender);
      tdee = Calculator.calculateTDEE(bmr, this.profile.activityLevel);
    }

    const targetIntake = tdee > 0 ? tdee - (this.settings?.targetGap || 500) : 0;
    const remaining = Math.max(0, targetIntake - total);
    const progressPercent = targetIntake > 0 ? Math.min((total / targetIntake) * 100, 100) : 0;

    document.getElementById('diet-total').textContent = total;
    document.getElementById('diet-target').textContent = targetIntake > 0 ? targetIntake : '--';
    document.getElementById('remaining-calories').textContent = targetIntake > 0 ? remaining : '--';

    // 进度条颜色
    const progressBar = document.getElementById('diet-progress-bar');
    progressBar.style.width = progressPercent + '%';
    progressBar.className = 'progress-bar';
    if (progressPercent > 90) progressBar.classList.add('danger');
    else if (progressPercent > 75) progressBar.classList.add('warning');

    // 食物列表
    const listContainer = document.getElementById('diet-list');
    if (foods.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">今天还没有记录饮食</div>';
    } else {
      listContainer.innerHTML = foods.map(f => `
        <div class="record-item">
          <div class="record-info">
            <span class="record-name">${f.name}</span>
            <span class="record-meta">${f.time}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="record-calories intake">${f.calories} kcal</span>
            <button class="delete-btn" onclick="App.deleteFood('${f.id}')">×</button>
          </div>
        </div>
      `).join('');
    }

    // 快捷食物
    this.renderQuickFoods();
  },

  renderQuickFoods() {
    const homeContainer = document.getElementById('quick-foods-home');
    const takeoutContainer = document.getElementById('quick-foods-takeout');
    const drinkContainer = document.getElementById('quick-foods-drink');

    if (homeContainer) {
      homeContainer.innerHTML = this.foodDatabase.home.map(f =>
        `<span class="food-tag" onclick="App.quickAddFood('${f.name}', ${f.calories})">${f.name}</span>`
      ).join('');
    }

    if (takeoutContainer) {
      takeoutContainer.innerHTML = this.foodDatabase.takeout.map(f =>
        `<span class="food-tag" onclick="App.quickAddFood('${f.name}', ${f.calories})">${f.name}</span>`
      ).join('');
    }

    if (drinkContainer) {
      drinkContainer.innerHTML = this.foodDatabase.drink.map(f =>
        `<span class="food-tag" onclick="App.quickAddFood('${f.name}', ${f.calories})">${f.name}</span>`
      ).join('');
    }
  },

  // ==================== 运动页 ====================

  renderExercisePage() {
    const exercises = Storage.getExercisesByDate(this.today);
    const total = Storage.getTotalBurn(this.today);

    document.getElementById('exercise-total').textContent = total;

    // 更新四类运动预览
    ['warmup', 'strength', 'core', 'cardio'].forEach(type => {
      const slider = document.getElementById(`ex-${type}`);
      const input = document.getElementById(`ex-${type}-input`);
      if (slider && input) {
        slider.value = 0;
        input.value = 0;
        document.getElementById(`${type}-cal`).textContent = '≈ 0 kcal';
      }
    });

    // 运动列表
    const listContainer = document.getElementById('exercise-list');
    if (exercises.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">今天还没有记录运动</div>';
    } else {
      listContainer.innerHTML = exercises.map(e => `
        <div class="record-item">
          <div class="record-info">
            <span class="record-name">🏃 ${e.name}</span>
            <span class="record-meta">${e.minutes}分钟 · ${e.time}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="record-calories burn">-${e.calories} kcal</span>
            <button class="delete-btn" onclick="App.deleteExercise('${e.id}')">×</button>
          </div>
        </div>
      `).join('');
    }
  },

  updateExerciseCalories(type) {
    const minutes = parseInt(document.getElementById(`ex-${type}-input`).value) || 0;
    const latestWeight = Storage.getLatestWeight()?.weight || 70;
    const calories = Calculator.calculateExerciseBurn(latestWeight, type, minutes);
    document.getElementById(`${type}-cal`).textContent = `≈ ${calories} kcal`;
  },

  saveExercises() {
    const types = [
      { id: 'warmup', name: '热身/快走' },
      { id: 'strength', name: '力量训练' },
      { id: 'core', name: '核心/瑜伽' },
      { id: 'cardio', name: '有氧跑步' }
    ];

    const latestWeight = Storage.getLatestWeight()?.weight || 70;
    let hasExercise = false;

    types.forEach(type => {
      const minutes = parseInt(document.getElementById(`ex-${type.id}-input`).value) || 0;
      if (minutes > 0) {
        hasExercise = true;
        const calories = Calculator.calculateExerciseBurn(latestWeight, type.id, minutes);
        Storage.saveExercise({
          date: this.today,
          name: type.name,
          type: type.id,
          minutes,
          calories
        });
      }
    });

    if (!hasExercise) {
      alert('请至少输入一项运动时长');
      return;
    }

    // 重置输入
    ['warmup', 'strength', 'core', 'cardio'].forEach(type => {
      const slider = document.getElementById(`ex-${type}`);
      const input = document.getElementById(`ex-${type}-input`);
      if (slider) slider.value = 0;
      if (input) input.value = 0;
      document.getElementById(`${type}-cal`).textContent = '≈ 0 kcal';
    });

    this.renderExercisePage();
    this.renderDashboard();
    alert('运动记录已保存！');
  },

  deleteExercise(id) {
    if (confirm('确定删除这条记录？')) {
      Storage.deleteExercise(id);
      this.renderExercisePage();
      this.renderDashboard();
    }
  },

  clearTodayExercise() {
    if (confirm('确定清空今日所有运动记录？')) {
      const exercises = Storage.getExercises();
      const filtered = exercises.filter(e => e.date !== this.today);
      Storage._set(Storage.KEYS.EXERCISES, filtered);
      this.renderExercisePage();
      this.renderDashboard();
    }
  },

  // ==================== 设置页 ====================

  renderSettingsPage() {
    this.updateMetabolismDisplay();
    this.updateTargetSummary();
  },

  // ==================== 排行榜页面 ====================

  renderRankingPage() {
    this.loadRankingData();
    this.updateMyRanking();
  },

  async loadRankingData() {
    const listContainer = document.getElementById('ranking-list');
    if (!listContainer) return;

    listContainer.innerHTML = `
      <div class="ranking-loading">
        <span class="loading-spinner"></span>
        <p>加载中...</p>
      </div>
    `;

    try {
      // 使用静态演示数据（实际部署时替换为真实API）
      const demoData = [
        { nickname: '减脂达人小王', progress: 85, weightLost: 8.5, avatar: '👤' },
        { nickname: '健康生活', progress: 72, weightLost: 6.2, avatar: '👤' },
        { nickname: '坚持就是胜利', progress: 65, weightLost: 5.8, avatar: '👤' },
        { nickname: ' fitnessgirl ', progress: 58, weightLost: 4.5, avatar: '👤' },
        { nickname: '运动健将', progress: 45, weightLost: 3.2, avatar: '👤' },
      ];

      // 计算我的排名
      const myProgress = this.calculateMyProgress();
      if (myProgress > 0) {
        demoData.push({
          nickname: this.profile?.nickname || '我',
          progress: myProgress,
          weightLost: this.calculateWeightLost(),
          avatar: '😊',
          isMe: true
        });
      }

      // 按进度排序
      demoData.sort((a, b) => b.progress - a.progress);

      // 渲染列表
      listContainer.innerHTML = demoData.map((item, index) => `
        <div class="ranking-item ${index < 3 ? 'top-' + (index + 1) : ''} ${item.isMe ? 'is-me' : ''}">
          <div class="rank-position">${index + 1}</div>
          <div class="rank-avatar">${item.avatar}</div>
          <div class="rank-info">
            <div class="rank-name">${item.nickname} ${item.isMe ? '(你)' : ''}</div>
            <div class="rank-progress">已减 ${item.weightLost} kg</div>
          </div>
          <div class="rank-value">
            <div class="rank-percent">${item.progress}%</div>
            <div class="rank-diff">目标完成</div>
          </div>
        </div>
      `).join('');

      // 更新我的排名显示
      const myIndex = demoData.findIndex(item => item.isMe);
      if (myIndex >= 0) {
        document.getElementById('my-rank').textContent = myIndex + 1;
      }

      // 更新时间
      document.getElementById('rank-update-time').textContent = '刚刚更新';

    } catch (error) {
      listContainer.innerHTML = `
        <div class="empty-state">
          加载失败，请稍后重试<br>
          <small>${error.message}</small>
        </div>
      `;
    }
  },

  updateMyRanking() {
    const progress = this.calculateMyProgress();
    const weightLost = this.calculateWeightLost();

    // 更新进度环
    const ring = document.getElementById('my-progress-ring');
    if (ring && progress > 0) {
      const circumference = 2 * Math.PI * 40;
      const offset = circumference * (1 - progress / 100);
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = offset;
    }

    document.getElementById('my-progress').textContent = progress + '%';
    document.getElementById('my-weight-diff').textContent =
      progress > 0 ? `已减 ${weightLost} kg` : '尚未设置目标';
  },

  calculateMyProgress() {
    if (!this.profile?.targetWeight) return 0;

    const weights = Storage.getWeights();
    if (weights.length < 2) return 0;

    // 找到开始记录的体重（最早的记录）
    const startWeight = weights[weights.length - 1].weight;
    const currentWeight = weights[0].weight;
    const targetWeight = this.profile.targetWeight;

    if (startWeight <= targetWeight) return 0;

    const totalToLose = startWeight - targetWeight;
    const lost = startWeight - currentWeight;

    return Math.min(Math.round((lost / totalToLose) * 100), 100);
  },

  calculateWeightLost() {
    const weights = Storage.getWeights();
    if (weights.length < 2) return 0;

    const startWeight = weights[weights.length - 1].weight;
    const currentWeight = weights[0].weight;

    return Math.max(0, (startWeight - currentWeight).toFixed(1));
  },

  async uploadRankingData() {
    const nickname = this.profile?.nickname;
    if (!nickname) {
      alert('请先设置昵称！\n\n前往「设置」页面填写昵称后再上传。');
      this.switchPage('settings');
      return;
    }

    const progress = this.calculateMyProgress();
    if (progress <= 0) {
      alert('暂无进度数据\n\n需要：\n1. 设置目标体重\n2. 记录至少2天的体重');
      return;
    }

    // 模拟上传
    const btn = document.querySelector('#upload-ranking-section button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> 上传中...';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<span>✅</span> 上传成功';
      this.loadRankingData();

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    }, 1500);

    // 实际部署时替换为真实API：
    // const data = {
    //   nickname: nickname,
    //   progress: progress,
    //   weightLost: this.calculateWeightLost(),
    //   timestamp: new Date().toISOString()
    // };
    // await fetch('YOUR_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
  },

  updateMetabolismDisplay() {
    const height = parseFloat(document.getElementById('setting-height')?.value);
    const age = parseInt(document.getElementById('setting-age')?.value);
    const gender = document.querySelector('.gender-btn.active')?.dataset.gender;
    const activityLevel = parseFloat(document.getElementById('setting-activity')?.value) || 1.375;

    const latestWeight = Storage.getLatestWeight();
    const weight = latestWeight?.weight || 70;

    if (height && age) {
      const bmr = Calculator.calculateBMR(weight, height, age, gender);
      const tdee = Calculator.calculateTDEE(bmr, activityLevel);

      document.getElementById('bmr-display').textContent = bmr + ' kcal';
      document.getElementById('tdee-display-setting').textContent = tdee + ' kcal';
    }
  },

  updateTargetSummary() {
    const targetWeight = parseFloat(document.getElementById('setting-target-weight')?.value);
    const targetDate = document.getElementById('setting-target-date')?.value;
    const latestWeight = Storage.getLatestWeight();

    const summary = document.getElementById('target-summary');

    if (targetWeight && targetDate && latestWeight) {
      const rec = Calculator.calculateRecommendedGap(latestWeight.weight, targetWeight, targetDate);
      if (rec.isValid) {
        document.getElementById('target-days').textContent = rec.daysRemaining;
        document.getElementById('weekly-loss').textContent = rec.weeklyLoss;
        summary.style.display = 'block';
      } else {
        summary.style.display = 'none';
      }
    } else {
      summary.style.display = 'none';
    }
  },

  // ==================== 操作 ====================

  saveWeight() {
    const weightInput = document.getElementById('weight-input').value;
    const weight = parseFloat(weightInput);
    const type = document.getElementById('weight-record-type').value;

    if (!weight || isNaN(weight)) {
      alert('请输入有效的体重数值');
      return;
    }

    // 保存早晚体重
    Storage.saveDualWeight(this.today, type, weight);

    closeModal('weight-modal');
    document.getElementById('weight-input').value = '';
    this.renderAll();
  },

  saveSettings() {
    const profile = {
      nickname: document.getElementById('setting-nickname').value.trim(),
      height: parseFloat(document.getElementById('setting-height').value),
      age: parseInt(document.getElementById('setting-age').value),
      gender: document.querySelector('.gender-btn.active')?.dataset.gender || 'male',
      activityLevel: parseFloat(document.getElementById('setting-activity').value),
      targetWeight: parseFloat(document.getElementById('setting-target-weight').value),
      targetDate: document.getElementById('setting-target-date').value
    };

    if (!profile.height || !profile.age) {
      alert('请填写身高和年龄');
      return;
    }

    Storage.saveProfile(profile);

    const settings = {
      targetGap: parseInt(document.getElementById('setting-gap').value) || 500
    };

    Storage.saveSettings(settings);

    this.profile = profile;
    this.settings = settings;

    alert('设置已保存！');
    this.switchPage('dashboard');
  },

  quickAddFood(name, calories) {
    Storage.saveFood({
      date: this.today,
      name,
      calories
    });
    this.renderDietPage();
    this.renderDashboard();
  },

  addManualCalories() {
    const name = document.getElementById('food-name').value.trim();
    const calories = parseInt(document.getElementById('food-calories').value);

    if (!name) {
      alert('请输入食物名称');
      return;
    }
    if (!calories || calories <= 0) {
      alert('请输入有效的卡路里数值');
      return;
    }

    Storage.saveFood({
      date: this.today,
      name,
      calories
    });

    document.getElementById('food-name').value = '';
    document.getElementById('food-calories').value = '';

    this.renderDietPage();
    this.renderDashboard();
  },

  deleteFood(id) {
    if (confirm('确定删除这条记录？')) {
      Storage.deleteFood(id);
      this.renderDietPage();
      this.renderDashboard();
    }
  },

  clearTodayDiet() {
    if (confirm('确定清空今日所有饮食记录？')) {
      Storage.clearTodayDiet(this.today);
      this.renderDietPage();
      this.renderDashboard();
    }
  },

  // ==================== 导入导出 ====================

  exportData() {
    const data = Storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `减脂助手备份-${this.today}.json`;
    a.click();
  },

  importData() {
    document.getElementById('import-file').click();
  },

  handleImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm('导入将覆盖现有数据，确定继续？')) {
          if (Storage.importData(data)) {
            this.loadData();
            this.renderAll();
            alert('导入成功！');
          }
        }
      } catch (err) {
        alert('文件格式错误');
      }
    };
    reader.readAsText(file);
    input.value = '';
  },

  clearAllData() {
    if (confirm('确定清空所有数据？此操作不可恢复！')) {
      Storage.clearAll();
      this.loadData();
      this.renderAll();
    }
  },

  // ==================== UI ====================

  updateDateDisplay() {
    const date = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    document.getElementById('current-date').textContent =
      `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  }
};

// ==================== 全局函数 ====================

function showQuickAdd() {
  document.getElementById('quick-add-modal').classList.add('active');
}

function showWeightModal(type = 'morning') {
  document.getElementById('weight-record-type').value = type;
  document.getElementById('weight-modal-title').textContent = type === 'morning' ? '记录早起体重' : '记录睡前体重';
  document.getElementById('weight-input').value = '';
  document.getElementById('weight-modal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function selectGender(gender) {
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gender === gender);
  });
  App.updateMetabolismDisplay();
}

function selectGap(gap) {
  document.querySelectorAll('.gap-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.gap) === gap);
  });
  document.getElementById('setting-gap').value = gap;
  App.updateTargetSummary();
}

function focusDiet() {
  App.switchPage('diet');
  setTimeout(() => {
    document.getElementById('food-name').focus();
  }, 300);
}

// 数字键盘输入 - 使用字符串拼接
function addNumber(num) {
  const input = document.getElementById('weight-input');
  if (!input) return;

  // 获取当前值，确保是字符串
  let currentValue = String(input.value || '');
  const inputNum = String(num);

  // 限制小数点只能输入一次
  if (inputNum === '.') {
    if (currentValue.includes('.')) return;
    if (currentValue === '' || currentValue === '0') {
      input.value = '0.';
      return;
    }
  }

  // 限制小数位数最多1位
  if (currentValue.includes('.') && inputNum !== '.') {
    const parts = currentValue.split('.');
    if (parts[1] && parts[1].length >= 1) return;
  }

  // 限制总长度
  if (currentValue.length >= 5) return;

  // 避免前导零（除非是小数）
  if (currentValue === '0' && inputNum !== '.') {
    input.value = inputNum;
    return;
  }

  input.value = currentValue + inputNum;
}

function deleteNumber() {
  const input = document.getElementById('weight-input');
  if (input) {
    input.value = input.value.slice(0, -1);
  }
}

// 运动输入联动
function updateExerciseInput(type, value) {
  const input = document.getElementById(`ex-${type}-input`);
  if (input) {
    input.value = value;
    App.updateExerciseCalories(type);
  }
}

function syncExerciseSlider(type, value) {
  const slider = document.getElementById(`ex-${type}`);
  if (slider) {
    slider.value = value;
    App.updateExerciseCalories(type);
  }
}

function saveWeight() {
  App.saveWeight();
}

function saveSettings() {
  App.saveSettings();
}

function saveExercises() {
  App.saveExercises();
}

function addManualCalories() {
  App.addManualCalories();
}

function clearTodayDiet() {
  App.clearTodayDiet();
}

function clearTodayExercise() {
  App.clearTodayExercise();
}

function exportData() {
  App.exportData();
}

function importData() {
  App.importData();
}

function handleImport(input) {
  App.handleImport(input);
}

function clearAllData() {
  App.clearAllData();
}

function uploadRankingData() {
  App.uploadRankingData();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
