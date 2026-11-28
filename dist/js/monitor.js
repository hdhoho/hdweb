/* =========================================================
   Hardware Telemetry & Real-Time Clock (RTC) Simulation
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.Monitor = (function () {
  const data = {
    cpuTemp: 42.0,
    mbTemp: 33.5,
    cpuFan: 1180,
    chaFan: 860,
    vcore: 1.248,
    v12: 12.04,
    v5: 5.02,
    v33: 3.31
  };

  let timerId = null;
  let onTickCallback = null;

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function getNowDate() {
    const offset = BIOS.State.get().draftSettings.timeOffsetMs || 0;
    return new Date(Date.now() + offset);
  }

  function getFormattedTime() {
    const d = getNowDate();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function getFormattedDate() {
    const d = getNowDate();
    return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
  }

  function stepTelemetry() {
    const s = BIOS.State.get().draftSettings;
    const fanMode = s.fanMode || 'Auto';
    const xmpBoost = s.xmp === 'Enabled' ? 2.2 : 0;

    let targetTemp = 42 + xmpBoost;
    let targetFan = 1180;
    if (fanMode === 'Silent') {
      targetTemp = 51 + xmpBoost;
      targetFan = 760;
    } else if (fanMode === 'Turbo') {
      targetTemp = 34 + xmpBoost;
      targetFan = 2150;
    }

    const jitter = () => (Math.random() - 0.5);
    data.cpuTemp += (targetTemp - data.cpuTemp) * 0.25 + jitter() * 0.6;
    data.mbTemp += (33.5 - data.mbTemp) * 0.2 + jitter() * 0.3;
    data.cpuFan += (targetFan - data.cpuFan) * 0.3 + jitter() * 28;
    data.chaFan += (targetFan * 0.72 - data.chaFan) * 0.3 + jitter() * 20;
    data.vcore = 1.24 + (s.xmp === 'Enabled' ? 0.015 : 0) + jitter() * 0.008;
    data.v12 = 12.04 + jitter() * 0.04;
    data.v5 = 5.02 + jitter() * 0.02;
    data.v33 = 3.31 + jitter() * 0.015;

    if (onTickCallback) onTickCallback();
  }

  function start(callback) {
    onTickCallback = callback;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(stepTelemetry, 1000);
  }

  function stop() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  return {
    data,
    start,
    stop,
    getNowDate,
    getFormattedTime,
    getFormattedDate
  };
})();
