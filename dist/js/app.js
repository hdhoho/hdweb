/* =========================================================
   Main Application Entrypoint & Control Deck Bindings
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.App = (function () {
  function enterBiosDirect() {
    BIOS.Post.clearTimers();
    const st = BIOS.State.get();
    st.powerOn = true;
    st.screen = 'bios';
    st.modal = null;
    BIOS.State.discardDraft(); // start from latest saved settings
    BIOS.UI.renderAll();
  }

  function requestEnterBios() {
    BIOS.Post.clearTimers();
    const st = BIOS.State.get();
    st.powerOn = true;
    if (st.savedSettings.adminPassword) {
      BIOS.UI.openPasswordVerify(() => enterBiosDirect());
    } else {
      enterBiosDirect();
    }
  }

  function openBootMenu() {
    BIOS.Post.clearTimers();
    const st = BIOS.State.get();
    st.powerOn = true;
    st.screen = 'bootmenu';
    st.bootMenuIndex = 0;
    st.modal = null;
    BIOS.UI.renderAll();
  }

  function bindDeckControls() {
    document.getElementById('btn-mode-legacy').addEventListener('click', () => {
      BIOS.State.setTheme('legacy');
      BIOS.UI.renderAll();
      BIOS.UI.showToast('已切換為 Legacy 藍底白字 BIOS');
    });

    document.getElementById('btn-mode-uefi').addEventListener('click', () => {
      BIOS.State.setTheme('uefi');
      BIOS.UI.renderAll();
      BIOS.UI.showToast('已切換為現代 UEFI 圖形化 BIOS');
    });

    document.getElementById('btn-enter-bios').addEventListener('click', () => {
      requestEnterBios();
    });

    document.getElementById('btn-boot-menu').addEventListener('click', () => {
      openBootMenu();
    });

    document.getElementById('btn-reboot').addEventListener('click', () => {
      BIOS.Post.startPost();
    });

    document.getElementById('btn-power').addEventListener('click', () => {
      if (BIOS.State.get().powerOn) {
        BIOS.Post.powerOff();
      } else {
        BIOS.Post.startPost();
      }
    });

    document.getElementById('btn-power-center').addEventListener('click', () => {
      BIOS.Post.startPost();
    });

    document.getElementById('btn-sound').addEventListener('click', () => {
      const enabled = BIOS.State.toggleSound();
      BIOS.UI.renderAll();
      BIOS.UI.showToast(enabled ? '已開啟開機音效' : '已靜音');
    });
  }

  function init() {
    bindDeckControls();
    BIOS.Keyboard.init();
    BIOS.Monitor.start(() => BIOS.UI.updateLiveFields());
    // Start with POST sequence on first load
    BIOS.Post.startPost();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    requestEnterBios,
    openBootMenu
  };
})();
