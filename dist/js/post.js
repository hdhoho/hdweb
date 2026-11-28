/* =========================================================
   POST Sequence, Web Audio Beep & Simulated OS Boot
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.Post = (function () {
  let timers = [];
  let audioCtx = null;

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  }

  function beep(freq = 920, durationMs = 110, type = 'square') {
    if (!BIOS.State.get().soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      /* Browser may block audio before first user gesture */
    }
  }

  function errorBeep() {
    beep(420, 120);
    setTimeout(() => beep(320, 180), 160);
  }

  function startPost() {
    clearTimers();
    const st = BIOS.State.get();
    st.powerOn = true;
    st.screen = 'post';
    st.modal = null;

    BIOS.UI.renderAll();

    const logEl = document.getElementById('post-log');
    const countdownEl = document.getElementById('post-countdown');
    if (!logEl) return;

    logEl.innerHTML = '';
    countdownEl.textContent = '';

    const s = st.savedSettings;
    const isFast = s.fastBoot === 'Enabled';
    const stepMs = isFast ? 140 : 340;
    const memSpeed = s.xmp === 'Enabled' ? 'DDR5-6000 XMP' : 'DDR5-4800 JEDEC';

    beep(940, 120);

    const lines = [
      `CPU : Intel(R) Core(TM) i7-14700K @ 3.40GHz (20 Cores, VT-x: ${s.vtx})`,
      `Memory Testing : <span class="post-line-ok">32768 MB OK</span> (${memSpeed} Dual Channel)`,
      `<span class="post-line-muted">Detecting Storage &amp; Boot Devices (SATA Mode: ${s.sataMode})...</span>`,
      `  NVMe0 : Samsung 990 PRO 2TB [UEFI Bootable]`,
      `  SATA1 : WD Blue 4TB HDD [Ubuntu 24.04]`,
      `  USB0  : Generic Flash Disk 32GB [${s.usbLegacy === 'Enabled' ? 'Legacy USB Ready' : 'USB Legacy Disabled'}]`,
      `Security : TPM 2.0 <span class="${s.tpmState === 'Enabled' ? 'post-line-ok' : 'post-line-warn'}">${s.tpmState}</span> | Secure Boot <span class="${s.secureBoot === 'Enabled' ? 'post-line-ok' : 'post-line-warn'}">${s.secureBoot}</span> | Mode: ${s.bootMode}`
    ];

    lines.forEach((html, idx) => {
      timers.push(setTimeout(() => {
        if (BIOS.State.get().screen !== 'post') return;
        const div = document.createElement('div');
        div.innerHTML = html;
        logEl.appendChild(div);
      }, idx * stepMs));
    });

    const totalWaitSec = isFast ? 2 : 4;
    const afterLinesMs = lines.length * stepMs + 150;

    for (let sec = totalWaitSec; sec >= 1; sec--) {
      timers.push(setTimeout(() => {
        if (BIOS.State.get().screen !== 'post') return;
        countdownEl.textContent = `Booting primary device in ${sec}s...`;
      }, afterLinesMs + (totalWaitSec - sec) * 1000));
    }

    timers.push(setTimeout(() => {
      if (BIOS.State.get().screen !== 'post') return;
      const primaryId = st.savedSettings.bootOrder[0] || 'nvme';
      bootDevice(primaryId);
    }, afterLinesMs + totalWaitSec * 1000));
  }

  function bootDevice(deviceId) {
    clearTimers();
    const st = BIOS.State.get();
    st.screen = 'os';
    st.lastBootDeviceId = deviceId;
    st.modal = null;
    BIOS.UI.renderAll();
  }

  function powerOff() {
    clearTimers();
    const st = BIOS.State.get();
    st.powerOn = false;
    st.screen = 'off';
    st.modal = null;
    BIOS.UI.renderAll();
  }

  return {
    clearTimers,
    beep,
    errorBeep,
    startPost,
    bootDevice,
    powerOff
  };
})();
