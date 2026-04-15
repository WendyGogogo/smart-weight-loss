/**
 * 减脂助手 - 主应用逻辑
 */

const App = {
  // 排行榜 API 配置
  API_BASE: 'https://your-worker-url.workers.dev',
  enableRealRanking: false,

  currentPage: 'dashboard',
  profile: null,
  settings: null,
  today: Calculator.getToday(),
  weightChartPeriod: '7d',
  weightChart: null,

  // 日历当前显示月份
  dashboardCalendarMonth: new Date(),
  weightCalendarMonth: new Date(),
  exerciseCalendarMonth: new Date(),

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
      document.getElementById('setting-start-weight').value = this.profile.startWeight || '';
      document.getElementById('setting-target-weight').value = this.profile.targetWeight || '';
      document.getElementById('setting-target-date').value = this.profile.targetDate || '';

      // 性别按钮
      document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === this.profile.gender);
      });

      // 运动水平
      document.getElementById('setting-activity').value = this.profile.activityLevel || '1.375';
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

    // 设置输入监听（实时更新计划）
    ['setting-start-weight', 'setting-target-weight', 'setting-target-date', 'setting-activity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updatePlan());
      }
    });

    // 身体数据变化时更新代谢显示
    ['setting-height', 'setting-age', 'setting-activity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.updateMetabolismDisplay());
        el.addEventListener('input', () => this.updateMetabolismDisplay());
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
    this.renderExercisePage();
    this.renderSettingsPage();
  },

  // ==================== 今日页面 ====================

  renderDashboard() {
    this.renderMyEffort();
    this.renderDashboardCalendar();
    this.renderDashboardStats();
  },

  renderMyEffort() {
    const targetWeight = this.profile?.targetWeight;
    const startWeight = this.profile?.startWeight;
    const latestWeight = Storage.getLatestWeight();

    let kgToTarget = '--';
    let progressPercent = '--%';
    let myRank = '--';

    if (targetWeight && latestWeight) {
      const diff = latestWeight.weight - targetWeight;
      kgToTarget = diff > 0 ? diff.toFixed(1) : '0';

      if (startWeight && startWeight > targetWeight) {
        const totalToLose = startWeight - targetWeight;
        const lost = startWeight - latestWeight.weight;
        const percent = Math.min(Math.round((lost / totalToLose) * 100), 100);
        progressPercent = percent + '%';

        // 更新环形进度
        const ring = document.getElementById('progress-ring');
        if (ring) {
          const circumference = 2 * Math.PI * 50;
          ring.style.strokeDasharray = circumference;
          ring.style.strokeDashoffset = circumference * (1 - percent / 100);
        }
      }
    }

    // 计算排名（基于锻炼天数）
    const exerciseDays = this.calculateExerciseDays();
    myRank = exerciseDays > 0 ? '计算中...' : '--';

    document.getElementById('target-kg').textContent = kgToTarget;
    document.getElementById('progress-percent').textContent = progressPercent;
    document.getElementById('my-rank-display').querySelector('.rank-num').textContent = myRank;
  },

  renderDashboardCalendar() {
    const container = document.getElementById('dashboard-calendar');
    const monthLabel = document.getElementById('calendar-month');

    const year = this.dashboardCalendarMonth.getFullYear();
    const month = this.dashboardCalendarMonth.getMonth();

    monthLabel.textContent = `${year}年${month + 1}月`;

    // 获取该月数据
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    let html = '';

    // 星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    // 空白日期
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // 日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = Calculator.formatDate(new Date(year, month, day));
      const isToday = dateStr === this.today;

      // 获取当日数据
      const weight = Storage.getWeightByDate(dateStr);
      const exercises = Storage.getExercisesByDate(dateStr);
      const hasMilkTea = Storage.getMilkTeaByDate(dateStr);

      let circle = '';
      let icons = '';

      if (weight) {
        circle = `<div class="calendar-circle weight">${weight.weight.toFixed(1)}</div>`;
      }

      if (exercises.length > 0) {
        icons += `<span>🏃</span>`;
      }

      if (hasMilkTea) {
        icons += `<span>🧋</span>`;
      }

      const todayClass = isToday ? 'today' : '';

      html += `
        <div class="calendar-day ${todayClass}" onclick="showDateDetail('${dateStr}')">
          <span class="calendar-day-number">${day}</span>
          <div class="calendar-day-content">
            ${circle}
            ${icons ? `<div class="calendar-icons">${icons}</div>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  renderDashboardStats() {
    const exerciseDays = this.calculateExerciseDays();
    const milkTeaDays = this.calculateMilkTeaDays();

    document.getElementById('exercise-days').textContent = exerciseDays;
    document.getElementById('milktea-days').textContent = milkTeaDays;
  },

  calculateExerciseDays() {
    const exercises = Storage.getExercises();
    const uniqueDates = new Set(exercises.map(e => e.date));
    return uniqueDates.size;
  },

  calculateMilkTeaDays() {
    const records = Storage.getMilkTeaRecords ? Storage.getMilkTeaRecords() : [];
    return records.filter(r => r.hadMilkTea).length;
  },

  changeMonth(offset) {
    this.dashboardCalendarMonth.setMonth(this.dashboardCalendarMonth.getMonth() + offset);
    this.renderDashboardCalendar();
  },

  // ==================== 体重页面 ====================

  renderWeightPage() {
    // 获取今日早晚体重
    const todayDual = Storage.getDualWeightByDate(this.today);
    const morningSpan = document.getElementById('morning-weight');
    const eveningSpan = document.getElementById('evening-weight');

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

    if (todayWeight) {
      document.getElementById('current-weight').textContent = todayWeight;

      if (this.profile?.height && this.profile?.age && this.profile?.gender) {
        const bmi = Calculator.calculateBMI(todayWeight, this.profile.height);
        const bodyFat = Calculator.calculateBodyFat(bmi, this.profile.age, this.profile.gender);
        document.getElementById('current-bmi').textContent = bmi;
        document.getElementById('current-fat').textContent = bodyFat + '%';
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
        document.getElementById('metabolism-assessment').style.display = 'block';
        document.getElementById('metabolism-level').textContent = assessment.level;
        document.getElementById('metabolism-level').className = 'assessment-badge ' + assessment.badge;
        document.getElementById('weight-diff').textContent = `夜间消耗: ${assessment.diff} kg`;
        document.getElementById('assessment-tip').textContent = assessment.tip;
      }
    } else {
      document.getElementById('metabolism-assessment').style.display = 'none';
    }

    // 渲染日历
    this.renderWeightCalendar();

    // 图表
    this.renderWeightChart();

    // 历史记录
    this.renderWeightHistory();
  },

  renderWeightCalendar() {
    const container = document.getElementById('weight-calendar');
    const monthLabel = document.getElementById('weight-calendar-month');

    const year = this.weightCalendarMonth.getFullYear();
    const month = this.weightCalendarMonth.getMonth();

    monthLabel.textContent = `${year}年${month + 1}月`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    let html = '';

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = Calculator.formatDate(new Date(year, month, day));
      const isToday = dateStr === this.today;

      const dualWeight = Storage.getDualWeightByDate(dateStr);
      let circle = '';
      let circleClass = '';

      if (dualWeight?.morning?.weight && dualWeight?.evening?.weight) {
        const diff = dualWeight.evening.weight - dualWeight.morning.weight;
        circle = diff.toFixed(1);

        if (diff > 1.0) circleClass = 'excellent';
        else if (diff > 0.7) circleClass = 'good';
        else if (diff > 0.5) circleClass = 'normal';
        else circleClass = 'slow';
      }

      const todayClass = isToday ? 'today' : '';
      const circleHtml = circle ? `<div class="calendar-circle ${circleClass}">${circle}</div>` : '';

      html += `
        <div class="calendar-day ${todayClass}">
          <span class="calendar-day-number">${day}</span>
          <div class="calendar-day-content">
            ${circleHtml}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  changeWeightMonth(offset) {
    this.weightCalendarMonth.setMonth(this.weightCalendarMonth.getMonth() + offset);
    this.renderWeightCalendar();
  },

  renderWeightChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;

    let weights = Storage.getWeights();

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

  // ==================== 运动页面 ====================

  renderExercisePage() {
    const exercises = Storage.getExercisesByDate(this.today);
    const total = Storage.getTotalBurn(this.today);

    document.getElementById('exercise-total').textContent = total;

    this.renderExerciseCalendar();

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

  renderExerciseCalendar() {
    const container = document.getElementById('exercise-calendar');
    const monthLabel = document.getElementById('exercise-calendar-month');

    const year = this.exerciseCalendarMonth.getFullYear();
    const month = this.exerciseCalendarMonth.getMonth();

    monthLabel.textContent = `${year}年${month + 1}月`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    let html = '';

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = Calculator.formatDate(new Date(year, month, day));
      const isToday = dateStr === this.today;

      const exercises = Storage.getExercisesByDate(dateStr);
      const totalCalories = exercises.reduce((sum, e) => sum + e.calories, 0);

      let circle = '';
      if (totalCalories > 0) {
        circle = `<div class="calendar-circle">${totalCalories}</div>`;
      }

      const todayClass = isToday ? 'today' : '';

      html += `
        <div class="calendar-day ${todayClass}">
          <span class="calendar-day-number">${day}</span>
          <div class="calendar-day-content">
            ${circle}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  changeExerciseMonth(offset) {
    this.exerciseCalendarMonth.setMonth(this.exerciseCalendarMonth.getMonth() + offset);
    this.renderExerciseCalendar();
  },

  updateQuickExercise(type, minutes) {
    const latestWeight = Storage.getLatestWeight()?.weight || 70;
    const calories = Calculator.calculateExerciseBurn(latestWeight, type, parseInt(minutes));

    // 更新显示
    document.getElementById(`${type}-minutes`).textContent = `${minutes}分钟`;
    document.getElementById(`${type}-cal-preview`).textContent = `≈ ${calories} kcal`;
  },

  saveQuickExercises() {
    const types = [
      { id: 'warmup', name: '热身/快走' },
      { id: 'strength', name: '力量训练' },
      { id: 'core', name: '核心/瑜伽' },
      { id: 'cardio', name: '有氧跑步' }
    ];

    const latestWeight = Storage.getLatestWeight()?.weight || 70;
    let hasExercise = false;

    types.forEach(type => {
      const minutes = parseInt(document.getElementById(`${type.id}-slider`).value) || 0;
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
      alert('请至少选择一项运动时长');
      return;
    }

    // 重置滑块
    types.forEach(type => {
      document.getElementById(`${type.id}-slider`).value = 0;
      document.getElementById(`${type.id}-minutes`).textContent = '0分钟';
      document.getElementById(`${type.id}-cal-preview`).textContent = '≈ 0 kcal';
    });

    this.renderExercisePage();
    this.renderDashboard();
    alert('运动记录已保存！');
  },

  saveCustomExercise() {
    const type = document.getElementById('custom-ex-type').value;
    const minutes = parseInt(document.getElementById('custom-ex-minutes').value);

    if (!minutes || minutes <= 0) {
      alert('请输入有效的时长');
      return;
    }

    this.quickAddExercise(type, minutes);
    closeModal('exercise-modal');
    document.getElementById('custom-ex-minutes').value = '';
  },

  deleteExercise(id) {
    if (confirm('确定删除这条记录？')) {
      Storage.deleteExercise(id);
      this.renderExercisePage();
    }
  },

  clearTodayExercise() {
    if (confirm('确定清空今日所有运动记录？')) {
      Storage.clearTodayExercise(this.today);
      this.renderExercisePage();
    }
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
      let rankings = [];

      // 从服务器获取数据
      if (this.enableRealRanking && this.API_BASE) {
        try {
          const response = await fetch(`${this.API_BASE}/api/ranking`);
          if (response.ok) {
            const data = await response.json();
            rankings = data.map(item => ({
              nickname: item.nickname,
              exerciseDays: item.exerciseDays || 0,
              avatar: item.avatar || '👤'
            }));
          }
        } catch (e) {
          console.log('排行榜加载失败，使用本地数据');
        }
      }

      // 如果没有服务器数据，使用本地演示数据
      if (rankings.length === 0) {
        // 空榜单，等待用户上传数据
        rankings = [];
      }

      // 添加当前用户
      const myExerciseDays = this.calculateExerciseDays();
      if (myExerciseDays > 0) {
        rankings.push({
          nickname: this.profile?.nickname || '我',
          exerciseDays: myExerciseDays,
          avatar: '😊',
          isMe: true
        });
      }

      // 按锻炼天数排序
      rankings.sort((a, b) => b.exerciseDays - a.exerciseDays);

      // 渲染列表
      if (rankings.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            暂无数据<br>
            <small>点击上传按钮添加你的打卡记录</small>
          </div>
        `;
      } else {
        listContainer.innerHTML = rankings.map((item, index) => `
          <div class="ranking-item ${index < 3 ? 'top-' + (index + 1) : ''} ${item.isMe ? 'is-me' : ''}">
            <div class="rank-position">${index + 1}</div>
            <div class="rank-avatar">${item.avatar}</div>
            <div class="rank-info">
              <div class="rank-name">${item.nickname} ${item.isMe ? '(你)' : ''}</div>
            </div>
            <div class="rank-value">
              <div class="rank-percent">${item.exerciseDays}天</div>
              <div class="rank-diff">锻炼天数</div>
            </div>
          </div>
        `).join('');
      }

      // 更新我的排名
      const myIndex = rankings.findIndex(item => item.isMe);
      if (myIndex >= 0) {
        document.getElementById('my-rank').textContent = myIndex + 1;
      }

      document.getElementById('rank-update-time').textContent = '刚刚更新';

    } catch (error) {
      listContainer.innerHTML = `
        <div class="empty-state">
          加载失败<br>
          <small>${error.message}</small>
        </div>
      `;
    }
  },

  updateMyRanking() {
    const exerciseDays = this.calculateExerciseDays();
    document.getElementById('my-exercise-days').textContent = exerciseDays;
  },

  async uploadRankingData() {
    const nickname = this.profile?.nickname;
    if (!nickname) {
      alert('请先设置昵称！\n\n前往「我的」页面填写昵称后再上传。');
      this.switchPage('settings');
      return;
    }

    const exerciseDays = this.calculateExerciseDays();
    if (exerciseDays === 0) {
      alert('暂无运动数据\n\n请先记录运动后再上传。');
      return;
    }

    const btn = document.querySelector('#upload-ranking-section button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> 上传中...';
    btn.disabled = true;

    if (this.enableRealRanking && this.API_BASE) {
      try {
        const response = await fetch(`${this.API_BASE}/api/ranking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: nickname,
            exerciseDays: exerciseDays,
            avatar: '😊'
          })
        });

        if (response.ok) {
          btn.innerHTML = '<span>✅</span> 上传成功';
          this.loadRankingData();
        } else {
          btn.innerHTML = '<span>❌</span> 上传失败';
        }
      } catch (e) {
        btn.innerHTML = '<span>❌</span> 网络错误';
      }

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    } else {
      // 本地演示模式
      setTimeout(() => {
        btn.innerHTML = '<span>✅</span> 上传成功（本地）';
        this.loadRankingData();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 2000);
      }, 1500);
    }
  },

  // ==================== 设置页面 ====================

  renderSettingsPage() {
    this.updateMetabolismDisplay();
    this.updatePlan();
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

  updatePlan() {
    const startWeight = parseFloat(document.getElementById('setting-start-weight')?.value);
    const targetWeight = parseFloat(document.getElementById('setting-target-weight')?.value);
    const targetDate = document.getElementById('setting-target-date')?.value;

    const planResult = document.getElementById('plan-result');

    if (startWeight && targetWeight && targetDate && startWeight > targetWeight) {
      const daysRemaining = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0) {
        const weightToLose = startWeight - targetWeight;
        const dailyLoss = (weightToLose / daysRemaining).toFixed(3);
        const weeklyLoss = (weightToLose / daysRemaining * 7).toFixed(2);

        document.getElementById('plan-days').textContent = daysRemaining;
        document.getElementById('plan-daily').textContent = dailyLoss;
        document.getElementById('plan-weekly').textContent = weeklyLoss;

        planResult.style.display = 'block';
      } else {
        planResult.style.display = 'none';
      }
    } else {
      planResult.style.display = 'none';
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
      startWeight: parseFloat(document.getElementById('setting-start-weight').value),
      targetWeight: parseFloat(document.getElementById('setting-target-weight').value),
      targetDate: document.getElementById('setting-target-date').value,
      activityLevel: parseFloat(document.getElementById('setting-activity').value)
    };

    if (!profile.height || !profile.age) {
      alert('请填写身高和年龄');
      return;
    }

    Storage.saveProfile(profile);

    this.profile = profile;

    alert('设置已保存！');
    this.switchPage('dashboard');
  },

  recordMilkTea(hadMilkTea) {
    Storage.saveMilkTeaRecord({
      date: this.today,
      hadMilkTea: hadMilkTea
    });

    closeModal('milktea-modal');
    this.renderDashboard();
    alert(hadMilkTea ? '已记录喝奶茶~' : '真棒！今天没喝奶茶');
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

function showCustomExerciseModal() {
  document.getElementById('exercise-modal').classList.add('active');
}

function showMilkTeaModal() {
  document.getElementById('milktea-modal').classList.add('active');
}

let selectedDate = null;

function showDateDetail(date) {
  selectedDate = date;
  const dateObj = new Date(date);
  const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  document.getElementById('date-action-title').textContent = dateStr;
  document.getElementById('date-action-modal').classList.add('active');
}

function handleDateAction(action) {
  if (!selectedDate) return;

  if (action === 'exercise') {
    // 切换到运动页面并设置日期
    App.switchPage('exercise');
  } else if (action === 'milktea') {
    // 显示奶茶弹窗
    showMilkTeaModal();
  }

  closeModal('date-action-modal');
}

// 数字键盘输入
function addNumber(num) {
  const input = document.getElementById('weight-input');
  if (!input) return;

  let currentValue = String(input.value || '');
  const inputNum = String(num);

  if (inputNum === '.') {
    if (currentValue.includes('.')) return;
    if (currentValue === '' || currentValue === '0') {
      input.value = '0.';
      return;
    }
  }

  if (currentValue.includes('.') && inputNum !== '.') {
    const parts = currentValue.split('.');
    if (parts[1] && parts[1].length >= 1) return;
  }

  if (currentValue.length >= 5) return;

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

// 日历月份切换
function changeMonth(offset) {
  App.changeMonth(offset);
}

function changeWeightMonth(offset) {
  App.changeWeightMonth(offset);
}

function changeExerciseMonth(offset) {
  App.changeExerciseMonth(offset);
}

// 快捷操作
function updateQuickExercise(type, minutes) {
  App.updateQuickExercise(type, minutes);
}

function saveQuickExercises() {
  App.saveQuickExercises();
}

function saveCustomExercise() {
  App.saveCustomExercise();
}

function recordMilkTea(hadMilkTea) {
  App.recordMilkTea(hadMilkTea);
}

// 数据操作
function saveWeight() {
  App.saveWeight();
}

function saveSettings() {
  App.saveSettings();
}

function deleteExercise(id) {
  App.deleteExercise(id);
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
