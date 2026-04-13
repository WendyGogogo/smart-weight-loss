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
   * 原理说明：
   * 正常情况下，人体经过一夜代谢（8-10小时禁食），体重会下降。
   * - 差值小（<0.5kg）：说明身体代谢效率高，夜间消耗充足
   * - 差值大（>1.0kg）：说明水分/食物滞留较多，代谢压力较大
   *
   * 影响因素：
   * - 晚餐时间和份量
   * - 钠/盐分摄入量（影响水分滞留）
   * - 睡眠质量
   * - 个体基础代谢率差异
   *
   * 注意：此评估仅供参考，连续观察一周以上更有参考价值
   */
  assessMetabolism(morningWeight, eveningWeight) {
    if (!morningWeight || !eveningWeight) {
      return null;
    }

    const diff = eveningWeight - morningWeight;
    const diffFormatted = diff.toFixed(1);

    let level, badge, tip, type;

    // 差值 < 0.3kg：代谢优秀
    // 说明夜间代谢效率高，食物/水分已充分消耗
    if (diff < 0.3) {
      level = '代谢优秀';
      type = 'excellent';
      badge = 'good';
      tip = '夜间代谢效率很高！说明晚餐消化良好，睡眠质量佳。继续保持规律作息。';
    }
    // 差值 0.3-0.5kg：代谢正常
    // 正常健康人群的早晚体重波动范围
    else if (diff < 0.5) {
      level = '代谢正常';
      type = 'normal';
      badge = 'good';
      tip = '代谢状态健康。建议晚餐控制在7点前，避免过咸食物，保持充足睡眠。';
    }
    // 差值 0.5-0.8kg：代谢偏慢
    // 可能存在轻微水肿或晚餐消化较慢
    else if (diff < 0.8) {
      level = '代谢偏慢';
      type = 'slow';
      badge = 'warning';
      tip = '体重滞留略多。建议晚餐减少精制碳水，增加蔬菜，睡前3小时不进食，控制盐分。';
    }
    // 差值 0.8-1.2kg：代谢较慢
    // 晚餐过量或水肿较明显
    else if (diff < 1.2) {
      level = '代谢较慢';
      type = 'slow';
      badge = 'warning';
      tip = '体重波动较大。建议严格控制晚餐热量（不超过全天30%），减少钠摄入，餐后适当散步。';
    }
    // 差值 > 1.2kg：需关注
    // 可能晚餐严重过量或明显水肿
    else {
      level = '需关注';
      type = 'concerning';
      badge = 'danger';
      tip = '体重滞留过多。建议详细记录晚餐内容，控制食量和盐分，如持续多日请咨询营养师。';
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
