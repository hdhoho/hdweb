/* =========================================================
   Global Keyboard Navigation Controller
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.Keyboard = (function () {
  function handleKeyDown(e) {
    const st = BIOS.State.get();
    const key = e.key;

    // Allow typing inside modal inputs except Escape
    if (st.modal && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      if (key === 'Escape') {
        e.preventDefault();
        st.modal = null;
        BIOS.UI.renderModal();
      }
      return;
    }

    // Modal keyboard handling
    if (st.modal) {
      const m = st.modal;
      if (key === 'Escape') {
        e.preventDefault();
        st.modal = null;
        BIOS.UI.renderModal();
      } else if (m.type === 'option') {
        if (key === 'ArrowUp') {
          e.preventDefault();
          m.selectedIdx = (m.selectedIdx - 1 + m.options.length) % m.options.length;
          BIOS.UI.renderModal();
        } else if (key === 'ArrowDown') {
          e.preventDefault();
          m.selectedIdx = (m.selectedIdx + 1) % m.options.length;
          BIOS.UI.renderModal();
        } else if (key === 'Enter') {
          e.preventDefault();
          m.onSelect(m.options[m.selectedIdx].value);
        }
      } else if (m.type === 'confirm' && key === 'Enter') {
        e.preventDefault();
        m.onConfirm();
      }
      return;
    }

    // Screen: POST
    if (st.screen === 'post') {
      if (key === 'Delete' || key === 'F2') {
        e.preventDefault();
        BIOS.App.requestEnterBios();
      } else if (key === 'F12') {
        e.preventDefault();
        BIOS.App.openBootMenu();
      }
      return;
    }

    // Screen: Boot Menu (F12)
    if (st.screen === 'bootmenu') {
      const total = st.savedSettings.bootOrder.length + 1;
      if (key === 'ArrowUp') {
        e.preventDefault();
        st.bootMenuIndex = (st.bootMenuIndex - 1 + total) % total;
        BIOS.UI.renderAll();
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        st.bootMenuIndex = (st.bootMenuIndex + 1) % total;
        BIOS.UI.renderAll();
      } else if (key === 'Enter') {
        e.preventDefault();
        if (st.bootMenuIndex === total - 1) {
          BIOS.App.requestEnterBios();
        } else {
          BIOS.Post.bootDevice(st.savedSettings.bootOrder[st.bootMenuIndex]);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        BIOS.Post.startPost();
      }
      return;
    }

    // Screen: BIOS Setup
    if (st.screen === 'bios') {
      if (key === 'F7' && st.theme === 'uefi') {
        e.preventDefault();
        BIOS.State.setUefiSubMode(st.uefiSubMode === 'ez' ? 'advanced' : 'ez');
        BIOS.UI.renderAll();
        return;
      }
      if (key === 'F9') {
        e.preventDefault();
        BIOS.UI.openConfirm('loadDefaults');
        return;
      }
      if (key === 'F10') {
        e.preventDefault();
        BIOS.UI.openConfirm('saveAndReset');
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        BIOS.UI.openConfirm('discardAndExit');
        return;
      }

      // Navigation applies in Legacy mode and UEFI Advanced mode
      const isListMode = st.theme === 'legacy' || st.uefiSubMode === 'advanced';
      if (!isListMode) return;

      const items = BIOS.MENU_SCHEMA[st.activeTab] || [];
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
        const curIdx = BIOS.TABS.findIndex((t) => t.id === st.activeTab);
        const dir = key === 'ArrowRight' ? 1 : -1;
        const nextIdx = (curIdx + dir + BIOS.TABS.length) % BIOS.TABS.length;
        st.activeTab = BIOS.TABS[nextIdx].id;
        st.selectedIndex = 0;
        BIOS.UI.renderBiosScreen();
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        if (items.length === 0) return;
        const dir = key === 'ArrowDown' ? 1 : -1;
        st.selectedIndex = (st.selectedIndex + dir + items.length) % items.length;
        BIOS.UI.renderBiosScreen();
      } else if (key === 'Enter') {
        e.preventDefault();
        BIOS.UI.activateCurrentItem();
      } else if (key === '+' || key === '=') {
        e.preventDefault();
        BIOS.UI.stepCurrentItem(1);
      } else if (key === '-') {
        e.preventDefault();
        BIOS.UI.stepCurrentItem(-1);
      }
    }
  }

  function init() {
    window.addEventListener('keydown', handleKeyDown);
  }

  return { init };
})();
