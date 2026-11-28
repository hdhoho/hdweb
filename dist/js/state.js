/* =========================================================
   State Management & localStorage Persistence
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.State = (function () {
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadSavedSettings() {
    try {
      const raw = localStorage.getItem(BIOS.STORAGE_KEYS.SETTINGS);
      if (!raw) return clone(BIOS.DEFAULTS);
      const parsed = JSON.parse(raw);
      return Object.assign(clone(BIOS.DEFAULTS), parsed);
    } catch (e) {
      return clone(BIOS.DEFAULTS);
    }
  }

  function loadUiPrefs() {
    try {
      const raw = localStorage.getItem(BIOS.STORAGE_KEYS.UI);
      if (!raw) return { theme: 'legacy', uefiSubMode: 'ez', soundEnabled: true };
      return Object.assign({ theme: 'legacy', uefiSubMode: 'ez', soundEnabled: true }, JSON.parse(raw));
    } catch (e) {
      return { theme: 'legacy', uefiSubMode: 'ez', soundEnabled: true };
    }
  }

  const saved = loadSavedSettings();
  const uiPrefs = loadUiPrefs();

  const state = {
    powerOn: false,
    screen: 'off', // 'off' | 'post' | 'bootmenu' | 'bios' | 'os'
    theme: uiPrefs.theme, // 'legacy' | 'uefi'
    uefiSubMode: uiPrefs.uefiSubMode, // 'ez' | 'advanced'
    soundEnabled: uiPrefs.soundEnabled,

    savedSettings: clone(saved),
    draftSettings: clone(saved),

    activeTab: 'Main',
    selectedIndex: 0,
    bootMenuIndex: 0,
    lastBootDeviceId: null,
    modal: null
  };

  function persistUi() {
    try {
      localStorage.setItem(BIOS.STORAGE_KEYS.UI, JSON.stringify({
        theme: state.theme,
        uefiSubMode: state.uefiSubMode,
        soundEnabled: state.soundEnabled
      }));
    } catch (e) { /* ignore quota */ }
  }

  function persistSettings() {
    try {
      localStorage.setItem(BIOS.STORAGE_KEYS.SETTINGS, JSON.stringify(state.savedSettings));
    } catch (e) { /* ignore quota */ }
  }

  function isDirty() {
    return JSON.stringify(state.savedSettings) !== JSON.stringify(state.draftSettings);
  }

  function getLang() {
    return state.draftSettings.language || '繁體中文';
  }

  function t(obj) {
    if (typeof obj === 'string') return obj;
    const lang = getLang();
    return obj[lang] || obj['繁體中文'] || obj['English'] || '';
  }

  function setSetting(key, value) {
    state.draftSettings[key] = value;
  }

  function cycleOption(key, options, dir) {
    const cur = state.draftSettings[key];
    const idx = options.indexOf(cur);
    const next = (idx + dir + options.length) % options.length;
    state.draftSettings[key] = options[next];
  }

  function setBootSlot(slotIndex, deviceId) {
    const order = state.draftSettings.bootOrder.slice();
    const existingIdx = order.indexOf(deviceId);
    if (existingIdx !== -1) {
      const prev = order[slotIndex];
      order[slotIndex] = deviceId;
      order[existingIdx] = prev;
    } else {
      order[slotIndex] = deviceId;
    }
    state.draftSettings.bootOrder = order;
  }

  function moveBootSlot(fromIdx, toIdx) {
    const order = state.draftSettings.bootOrder.slice();
    if (toIdx < 0 || toIdx >= order.length || fromIdx === toIdx) return;
    const [moved] = order.splice(fromIdx, 1);
    order.splice(toIdx, 0, moved);
    state.draftSettings.bootOrder = order;
  }

  function saveDraft() {
    state.savedSettings = clone(state.draftSettings);
    persistSettings();
  }

  function discardDraft() {
    state.draftSettings = clone(state.savedSettings);
  }

  function loadDefaults() {
    const keepLang = state.draftSettings.language;
    state.draftSettings = clone(BIOS.DEFAULTS);
    state.draftSettings.language = keepLang;
  }

  function setTheme(theme) {
    state.theme = theme;
    persistUi();
  }

  function setUefiSubMode(sub) {
    state.uefiSubMode = sub;
    persistUi();
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    persistUi();
    return state.soundEnabled;
  }

  return {
    get: () => state,
    isDirty,
    getLang,
    t,
    setSetting,
    cycleOption,
    setBootSlot,
    moveBootSlot,
    saveDraft,
    discardDraft,
    loadDefaults,
    setTheme,
    setUefiSubMode,
    toggleSound
  };
})();
