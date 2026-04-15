/**
 * 减脂助手 - 数据存储管理
 */

const Storage = {
  // 存储键名
  KEYS: {
    PROFILE: 'wlp_profile',
    SETTINGS: 'wlp_settings',
    WEIGHTS: 'wlp_weights',
    DUAL_WEIGHTS: 'wlp_dual_weights',
    FOODS: 'wlp_foods',
    EXERCISES: 'wlp_exercises',
    MILK_TEA: 'wlp_milk_tea'
  },

  // ==================== 用户信息 ====================

  getProfile() {
    return this._get(this.KEYS.PROFILE) || {};
  },

  saveProfile(profile) {
    this._set(this.KEYS.PROFILE, profile);
  },

  // ==================== 设置 ====================

  getSettings() {
    const defaults = {
      targetGap: 500,
      reminderMorning: false,
      reminderEvening: false
    };
    return { ...defaults, ...this._get(this.KEYS.SETTINGS) };
  },

  saveSettings(settings) {
    this._set(this.KEYS.SETTINGS, settings);
  },

  // ==================== 体重记录 ====================

  getWeights() {
    return this._get(this.KEYS.WEIGHTS) || [];
  },

  saveWeight(data) {
    const weights = this.getWeights();
    const existingIndex = weights.findIndex(w => w.date === data.date);

    if (existingIndex >= 0) {
      weights[existingIndex] = { ...weights[existingIndex], ...data };
    } else {
      weights.unshift(data);
    }

    weights.sort((a, b) => new Date(b.date) - new Date(a.date));
    this._set(this.KEYS.WEIGHTS, weights);
  },

  getLatestWeight() {
    const weights = this.getWeights();
    return weights.length > 0 ? weights[0] : null;
  },

  getWeightByDate(date) {
    const weights = this.getWeights();
    return weights.find(w => w.date === date) || null;
  },

  // ==================== 早晚体重记录 ====================

  getDualWeights() {
    return this._get(this.KEYS.DUAL_WEIGHTS) || {};
  },

  saveDualWeight(date, type, weight) {
    const dualWeights = this.getDualWeights();

    if (!dualWeights[date]) {
      dualWeights[date] = {};
    }

    dualWeights[date][type] = {
      weight: parseFloat(weight),
      time: Calculator.getCurrentTime()
    };

    this._set(this.KEYS.DUAL_WEIGHTS, dualWeights);

    const morning = dualWeights[date].morning?.weight;
    const evening = dualWeights[date].evening?.weight;

    // 以早起体重为准，如果没有早起体重则使用当前输入的体重
    const dailyWeight = morning || parseFloat(weight);

    this.saveWeight({
      date,
      weight: dailyWeight,
      bmi: 0,
      bodyFat: 0,
      source: morning && evening ? 'morning' : 'single'
    });
  },

  getDualWeightByDate(date) {
    const dualWeights = this.getDualWeights();
    return dualWeights[date] || null;
  },

  // ==================== 饮食记录 ====================

  getFoods() {
    return this._get(this.KEYS.FOODS) || [];
  },

  getFoodsByDate(date) {
    const foods = this.getFoods();
    return foods.filter(f => f.date === date);
  },

  saveFood(food) {
    const foods = this.getFoods();
    foods.push({
      id: Date.now().toString(),
      date: food.date || Calculator.getToday(),
      time: food.time || Calculator.getCurrentTime(),
      name: food.name,
      calories: parseInt(food.calories) || 0
    });
    this._set(this.KEYS.FOODS, foods);
  },

  deleteFood(id) {
    let foods = this.getFoods();
    foods = foods.filter(f => f.id !== id);
    this._set(this.KEYS.FOODS, foods);
  },

  clearTodayDiet(date) {
    const foods = this.getFoods();
    const filtered = foods.filter(f => f.date !== date);
    this._set(this.KEYS.FOODS, filtered);
  },

  getTotalIntake(date) {
    const foods = this.getFoodsByDate(date);
    return foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  },

  // ==================== 运动记录 ====================

  getExercises() {
    return this._get(this.KEYS.EXERCISES) || [];
  },

  getExercisesByDate(date) {
    const exercises = this.getExercises();
    return exercises.filter(e => e.date === date);
  },

  saveExercise(exercise) {
    const exercises = this.getExercises();
    exercises.push({
      id: Date.now().toString(),
      date: exercise.date || Calculator.getToday(),
      time: exercise.time || Calculator.getCurrentTime(),
      name: exercise.name,
      type: exercise.type,
      minutes: parseInt(exercise.minutes) || 0,
      calories: parseInt(exercise.calories) || 0
    });
    this._set(this.KEYS.EXERCISES, exercises);
  },

  saveExercises(exercises) {
    exercises.forEach(e => this.saveExercise(e));
  },

  deleteExercise(id) {
    let exercises = this.getExercises();
    exercises = exercises.filter(e => e.id !== id);
    this._set(this.KEYS.EXERCISES, exercises);
  },

  getTotalBurn(date) {
    const exercises = this.getExercisesByDate(date);
    return exercises.reduce((sum, e) => sum + (e.calories || 0), 0);
  },

  clearTodayExercise(date) {
    const exercises = this.getExercises();
    const filtered = exercises.filter(e => e.date !== date);
    this._set(this.KEYS.EXERCISES, filtered);
  },

  // ==================== 奶茶记录 ====================

  getMilkTeaRecords() {
    return this._get(this.KEYS.MILK_TEA) || [];
  },

  getMilkTeaByDate(date) {
    const records = this.getMilkTeaRecords();
    const record = records.find(r => r.date === date);
    return record ? record.hadMilkTea : false;
  },

  saveMilkTeaRecord(record) {
    const records = this.getMilkTeaRecords();
    const existingIndex = records.findIndex(r => r.date === record.date);

    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...record };
    } else {
      records.push({
        id: Date.now().toString(),
        date: record.date || Calculator.getToday(),
        hadMilkTea: record.hadMilkTea
      });
    }

    this._set(this.KEYS.MILK_TEA, records);
  },

  // ==================== 数据导入导出 ====================

  exportData() {
    return {
      version: '2.0',
      exportDate: new Date().toISOString(),
      profile: this.getProfile(),
      settings: this.getSettings(),
      weights: this.getWeights(),
      dualWeights: this.getDualWeights(),
      foods: this.getFoods(),
      exercises: this.getExercises(),
      milkTea: this.getMilkTeaRecords()
    };
  },

  importData(data) {
    try {
      if (data.profile) this._set(this.KEYS.PROFILE, data.profile);
      if (data.settings) this._set(this.KEYS.SETTINGS, data.settings);
      if (data.weights) this._set(this.KEYS.WEIGHTS, data.weights);
      if (data.dualWeights) this._set(this.KEYS.DUAL_WEIGHTS, data.dualWeights);
      if (data.foods) this._set(this.KEYS.FOODS, data.foods);
      if (data.exercises) this._set(this.KEYS.EXERCISES, data.exercises);
      if (data.milkTea) this._set(this.KEYS.MILK_TEA, data.milkTea);
      return true;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // ==================== 私有方法 ====================

  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('保存失败:', e);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
