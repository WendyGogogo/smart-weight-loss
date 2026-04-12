/**
 * 减脂助手 - 计算工具
 * 使用 Mifflin-St Jeor 公式计算基础代谢
 */

const Calculator = {
  /**
   * 计算 BMI
   */
  calculateBMI(weight, height) {
    if (!weight || !height) return 0;
    const h = height / 100;
    return parseFloat((weight / (h * h)).toFixed(1));
  },

  /**
   * 计算 BMR (Mifflin-St Jeor 公式)
   * 男性: BMR = (10 × 体重kg) + (6.25 × 身高cm) - (5 × 年龄) + 5
   * 女性: BMR = (10 × 体重kg) + (6.25 × 身高cm) - (5 × 年龄) - 161
   */
  calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age) return 0;

    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return Math.round(gender === 'female' ? base - 161 : base + 5);
  },

  /**
   * 计算 TDEE (每日总能量消耗)
   * TDEE = BMR × 活动系数
   */
  calculateTDEE(bmr, activityLevel) {
    return Math.round(bmr * (activityLevel || 1.375));
  },

  /**
   * 计算体脂率 (Deurenberg 公式)
   */
  calculateBodyFat(bmi, age, gender) {
    if (!bmi || !age) return 0;

    let fat = (1.20 * bmi) + (0.23 * age);
    fat = gender === 'female' ? fat - 5.4 : fat - 16.2;
    return Math.max(0, parseFloat(fat.toFixed(1)));
  },

  /**
   * 计算热量缺口
   * 热量缺口 = TDEE + 运动消耗 - 摄入
   */
  calculateGap(tdee, intake, burn) {
    return (tdee || 0) + (burn || 0) - (intake || 0);
  },

  /**
   * 计算缺口完成百分比
   */
  calculateGapPercentage(currentGap, targetGap) {
    if (!targetGap || targetGap <= 0) return 0;
    const percentage = Math.round((currentGap / targetGap) * 100);
    return Math.min(Math.max(percentage, 0), 100);
  },

  /**
   * 计算运动消耗 (MET公式)
   * 消耗 = MET × 体重(kg) × 时间(小时)
   */
  calculateExerciseBurn(weight, type, minutes) {
    const MET_VALUES = {
      warmup: 3.5,      // 热身/快走
      strength: 5.5,    // 力量训练
      core: 4.5,        // 核心训练
      cardio: 8.5,      // 有氧跑步
      walking: 3.0,     // 散步
      cycling: 6.0,     // 骑行
      swimming: 7.0     // 游泳
    };

    const met = MET_VALUES[type] || 4;
    if (!weight || !minutes) return 0;

    return Math.round(met * weight * (minutes / 60));
  },

  /**
   * 计算建议每日缺口
   * 根据目标体重、当前体重和目标日期计算
   */
  calculateRecommendedGap(currentWeight, targetWeight, targetDate) {
    if (!currentWeight || !targetWeight || !targetDate) {
      return { gap: 500, isValid: false };
    }

    const daysRemaining = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return { gap: 500, isValid: false, message: '目标日期已过' };
    }

    const weightToLose = currentWeight - targetWeight;

    if (weightToLose <= 0) {
      return { gap: 300, isValid: false, message: '已达到目标' };
    }

    // 7700 kcal ≈ 1kg脂肪
    const dailyGap = Math.round((weightToLose * 7700) / daysRemaining);

    // 限制在安全范围 (300-1000)
    const safeGap = Math.min(Math.max(dailyGap, 300), 1000);

    // 计算每周减重
    const weeklyLoss = (safeGap * 7 / 7700).toFixed(2);

    return {
      gap: safeGap,
      isValid: true,
      daysRemaining,
      weightToLose: parseFloat(weightToLose.toFixed(1)),
      originalGap: dailyGap,
      weeklyLoss
    };
  },

  /**
   * 评估代谢等级
   * 根据早晚体重差评估代谢状态
   *
   * 正常范围: 0.5-1.0 kg (代谢正常)
   * 偏低: < 0.5 kg (代谢较慢)
   * 偏高: > 1.0 kg (可能水肿或测量误差)
   */
  assessMetabolism(morningWeight, eveningWeight) {
    if (!morningWeight || !eveningWeight) {
      return null;
    }

    const diff = eveningWeight - morningWeight;
    const diffFormatted = diff.toFixed(1);

    let level, badge, tip, type;

    if (diff < 0.3) {
      level = '代谢优秀';
      type = 'excellent';
      badge = 'good';
      tip = '你的代谢非常棒！建议保持规律作息和适量运动，可以适当增加蛋白质摄入。';
    } else if (diff < 0.5) {
      level = '代谢正常';
      type = 'normal';
      badge = 'good';
      tip = '代谢状态良好。建议晚餐控制在7点前，避免高盐食物，多喝水。';
    } else if (diff < 0.8) {
      level = '代谢偏慢';
      type = 'slow';
      badge = 'warning';
      tip = '代谢略有放缓。建议晚餐减少碳水摄入，增加蔬菜比例，睡前3小时不进食。';
    } else if (diff < 1.2) {
      level = '代谢较慢';
      type = 'slow';
      badge = 'warning';
      tip = '代谢偏慢，可能与晚餐过量或水肿有关。建议控制晚餐热量，减少钠摄入，适量运动。';
    } else {
      level = '需关注';
      type = 'concerning';
      badge = 'danger';
      tip = '体重波动较大，可能是饮食过量或水肿。建议记录饮食明细，控制晚餐，必要时咨询营养师。';
    }

    return {
      diff: diffFormatted,
      level,
      type,
      badge,
      tip
    };
  },

  /**
   * 生成每日建议
   */
  generateSuggestion(currentGap, targetGap, intake, tdee) {
    const percentage = targetGap ? (currentGap / targetGap) : 0;

    if (percentage >= 1) {
      return {
        type: 'success',
        text: '太棒了！今日热量缺口已达标，继续保持！',
        icon: '🎉'
      };
    } else if (percentage >= 0.8) {
      return {
        type: 'good',
        text: '进展不错！再坚持一下就能完成今日目标。',
        icon: '💪'
      };
    } else if (percentage >= 0.5) {
      return {
        type: 'warning',
        text: `当前缺口 ${Math.round(currentGap)} kcal，建议晚餐控制热量。`,
        icon: '⚠️'
      };
    } else if (currentGap > 0) {
      return {
        type: 'warning',
        text: `热量缺口较小，建议增加30分钟运动或减少晚餐摄入。`,
        icon: '🏃'
      };
    } else {
      const over = Math.abs(currentGap);
      return {
        type: 'danger',
        text: `今日已超标 ${over} kcal，建议去散步消耗一些热量！`,
        icon: '⚡'
      };
    }
  },

  /**
   * 获取建议摄入热量
   */
  getRecommendedIntake(tdee, targetGap) {
    return Math.max(1200, tdee - (targetGap || 500));
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /**
   * 获取今天日期
   */
  getToday() {
    return this.formatDate(new Date());
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    return this.formatTime(new Date());
  },

  /**
   * 获取星期几
   */
  getWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[new Date(date).getDay()];
  },

  /**
   * 获取友好日期显示
   */
  getFriendlyDate(date) {
    const today = this.getToday();
    const yesterday = this.formatDate(new Date(Date.now() - 86400000));

    if (date === today) return '今天';
    if (date === yesterday) return '昨天';
    return date.slice(5);
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Calculator;
}
