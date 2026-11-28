/* =========================================================
   UI Renderer: Legacy BIOS, UEFI (EZ & Advanced), Modals, OS
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.UI = (function () {
  let toastTimer = null;
  let dragSrcIdx = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function getItemDisplayValue(item) {
    const s = BIOS.State.get().draftSettings;
    switch (item.type) {
      case 'readonly':
        return item.value(s);
      case 'clock':
        return `[${BIOS.Monitor.getFormattedTime()}]`;
      case 'date':
        return `[${BIOS.Monitor.getFormattedDate()}]`;
      case 'select':
        return `[${s[item.key]}]`;
      case 'boot-order': {
        const devId = s.bootOrder[item.slotIndex];
        const dev = BIOS.BOOT_DEVICES[devId];
        return `[${dev ? dev.shortName : devId}]`;
      }
      case 'password': {
        const lang = BIOS.State.getLang();
        if (s.adminPassword) {
          return lang === 'English' ? '[Installed]' : '[已設定]';
        }
        return lang === 'English' ? '[Not Installed]' : '[未設定]';
      }
      case 'action':
        return '→';
      default:
        return '';
    }
  }

  function updateControlDeck() {
    const st = BIOS.State.get();
    const led = document.getElementById('power-led');
    const badge = document.getElementById('status-badge');
    const btnLegacy = document.getElementById('btn-mode-legacy');
    const btnUefi = document.getElementById('btn-mode-uefi');
    const btnPower = document.getElementById('btn-power');
    const btnSound = document.getElementById('btn-sound');

    if (led) led.classList.toggle('on', st.powerOn);
    if (badge) {
      const labelMap = {
        off: 'POWER OFF',
        post: 'POSTING...',
        bootmenu: 'BOOT MENU',
        bios: st.theme === 'legacy' ? 'LEGACY BIOS' : `UEFI (${st.uefiSubMode.toUpperCase()})`,
        os: 'OS RUNNING'
      };
      badge.textContent = labelMap[st.screen] || 'READY';
    }

    if (btnLegacy && btnUefi) {
      btnLegacy.classList.toggle('active', st.theme === 'legacy');
      btnUefi.classList.toggle('active', st.theme === 'uefi');
    }

    if (btnPower) {
      btnPower.classList.toggle('is-off', !st.powerOn);
      btnPower.textContent = st.powerOn ? '關機' : '開機';
    }

    if (btnSound) {
      btnSound.textContent = st.soundEnabled ? '音效: 開' : '音效: 關';
    }
  }

  function renderAll() {
    const st = BIOS.State.get();
    updateControlDeck();

    const screens = ['off', 'post', 'bootmenu', 'bios', 'os'];
    screens.forEach((name) => {
      const el = document.getElementById(`screen-${name}`);
      if (el) el.classList.toggle('hidden', st.screen !== name);
    });

    if (st.screen === 'bootmenu') {
      renderBootMenu();
    } else if (st.screen === 'bios') {
      renderBiosScreen();
    } else if (st.screen === 'os') {
      renderOsScreen();
    }

    renderModal();
  }

  /* ---------- F12 Boot Menu ---------- */
  function renderBootMenu() {
    const st = BIOS.State.get();
    const listEl = document.getElementById('bootmenu-list');
    if (!listEl) return;

    const order = st.savedSettings.bootOrder;
    const entries = order.map((id) => ({
      id,
      label: BIOS.BOOT_DEVICES[id] ? BIOS.BOOT_DEVICES[id].name : id
    }));
    entries.push({ id: '__setup__', label: 'Enter BIOS Setup Utility' });

    if (st.bootMenuIndex >= entries.length) st.bootMenuIndex = 0;

    listEl.innerHTML = entries.map((entry, idx) => {
      const sel = idx === st.bootMenuIndex ? 'selected' : '';
      return `<div class="bootmenu-item ${sel}" data-idx="${idx}" data-id="${entry.id}">
        <span>${escapeHtml(entry.label)}</span>
        <span>${sel ? '◀' : ''}</span>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.bootmenu-item').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        st.bootMenuIndex = Number(row.dataset.idx);
        if (id === '__setup__') {
          BIOS.App.requestEnterBios();
        } else {
          BIOS.Post.bootDevice(id);
        }
      });
    });
  }

  /* ---------- Simulated OS Screen ---------- */
  function renderOsScreen() {
    const st = BIOS.State.get();
    const el = document.getElementById('os-content');
    if (!el) return;

    const s = st.savedSettings;
    const dev = BIOS.BOOT_DEVICES[st.lastBootDeviceId] || BIOS.BOOT_DEVICES.nvme;
    const isPxe = dev.id === 'pxe';
    const secureWarn = dev.id === 'usb' && s.secureBoot === 'Enabled' && s.bootMode === 'UEFI';

    el.innerHTML = `
      <div class="os-logo">${dev.icon}</div>
      <div class="os-title">${escapeHtml(dev.osTitle)}</div>
      ${isPxe ? '' : '<div class="os-spinner"></div>'}
      <p class="os-sub">${escapeHtml(dev.osDesc)}</p>
      ${secureWarn ? '<p class="os-sub" style="color:#fbbf24;">[提示] Secure Boot 已啟用，此 USB 映像已通過模擬 UEFI 憑證驗證。</p>' : ''}
      <div class="os-meta-grid">
        <div>Boot Device: ${escapeHtml(dev.shortName)}</div>
        <div>Boot Mode: ${escapeHtml(s.bootMode)}</div>
        <div>Secure Boot: ${escapeHtml(s.secureBoot)}</div>
        <div>TPM 2.0: ${escapeHtml(s.tpmState)}</div>
        <div>Memory: ${s.xmp === 'Enabled' ? 'DDR5-6000 (XMP)' : 'DDR5-4800'}</div>
        <div>VT-x / Fan: ${escapeHtml(s.vtx)} / ${escapeHtml(s.fanMode)}</div>
      </div>
      <div class="os-actions">
        <button class="os-btn" id="os-btn-bios">重新進入 BIOS Setup</button>
        <button class="os-btn secondary" id="os-btn-reboot">重新開機 (POST)</button>
      </div>
    `;

    document.getElementById('os-btn-bios').addEventListener('click', () => BIOS.App.requestEnterBios());
    document.getElementById('os-btn-reboot').addEventListener('click', () => BIOS.Post.startPost());
  }

  /* ---------- BIOS Setup Screen (Dispatcher) ---------- */
  function renderBiosScreen() {
    const st = BIOS.State.get();
    const container = document.getElementById('screen-bios');
    if (!container) return;

    if (st.theme === 'legacy') {
      renderLegacyBios(container);
    } else {
      renderUefiBios(container);
    }
  }

  /* ---------- Theme A: Classic Legacy BIOS ---------- */
  function renderLegacyBios(container) {
    const st = BIOS.State.get();
    const items = BIOS.MENU_SCHEMA[st.activeTab] || [];
    if (st.selectedIndex >= items.length) st.selectedIndex = 0;
    const selectedItem = items[st.selectedIndex];
    const dirtyText = BIOS.State.isDirty() ? '[*未儲存變更]' : '';

    const tabsHtml = BIOS.TABS.map((tab) => {
      const active = tab.id === st.activeTab ? 'active' : '';
      return `<button class="legacy-tab ${active}" data-tab="${tab.id}">${escapeHtml(tab.short)}</button>`;
    }).join('');

    const rowsHtml = items.map((item, idx) => {
      const sel = idx === st.selectedIndex ? 'selected' : '';
      const ro = item.type === 'readonly' ? 'readonly' : '';
      const val = getItemDisplayValue(item);
      return `<div class="legacy-row ${sel} ${ro}" data-idx="${idx}">
        <span class="row-key">${escapeHtml(BIOS.State.t(item.label))}</span>
        <span class="row-val" data-live-key="${item.key}">${escapeHtml(val)}</span>
      </div>`;
    }).join('');

    const helpText = selectedItem ? BIOS.State.t(selectedItem.help) : '';

    container.innerHTML = `
      <div class="bios-legacy">
        <div class="legacy-titlebar">
          <span>Aptio / PhoenixBIOS Setup Utility - Copyright (C) 2026</span>
          <span class="legacy-dirty-flag">${dirtyText}</span>
        </div>
        <div class="legacy-tabs">${tabsHtml}</div>
        <div class="legacy-body">
          <div class="legacy-main">
            <div class="legacy-section-title">${escapeHtml(st.activeTab)} Configuration</div>
            ${rowsHtml}
          </div>
          <aside class="legacy-help">
            <div>
              <div class="legacy-help-title">Item Specific Help</div>
              <div class="legacy-help-text">${escapeHtml(helpText)}</div>
            </div>
            <div class="legacy-help-keys">
              <div>← → : 切換主分類</div>
              <div>↑ ↓ : 移動選項游標</div>
              <div>Enter : 開啟設定 / 執行</div>
              <div>+ / - : 快速切換數值</div>
              <div>F9 : 載入預設值</div>
              <div>F10 : 儲存並重開機</div>
              <div>ESC : 離開 BIOS</div>
            </div>
          </aside>
        </div>
        <div class="legacy-footer">
          <span><b>←→</b> Select Screen</span>
          <span><b>↑↓</b> Select Item</span>
          <span><b>Enter</b> Select</span>
          <span><b>+/-</b> Change Opt.</span>
          <span><b>F9</b> Defaults</span>
          <span><b>F10</b> Save &amp; Exit</span>
          <span><b>ESC</b> Exit</span>
        </div>
      </div>
    `;

    container.querySelectorAll('.legacy-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        st.activeTab = btn.dataset.tab;
        st.selectedIndex = 0;
        renderBiosScreen();
      });
    });

    container.querySelectorAll('.legacy-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = Number(row.dataset.idx);
        if (st.selectedIndex === idx) {
          activateCurrentItem();
        } else {
          st.selectedIndex = idx;
          renderBiosScreen();
        }
      });
      row.addEventListener('dblclick', () => {
        st.selectedIndex = Number(row.dataset.idx);
        activateCurrentItem();
      });
    });
  }

  /* ---------- Theme B: Modern UEFI BIOS ---------- */
  function renderUefiBios(container) {
    const st = BIOS.State.get();
    const isEz = st.uefiSubMode === 'ez';
    const dirtyBadge = BIOS.State.isDirty()
      ? '<span class="uefi-pill dirty">未儲存變更</span>'
      : '<span class="uefi-pill">已同步</span>';

    const headerHtml = `
      <div class="uefi-header">
        <div class="uefi-brand">
          <span class="uefi-brand-title">UEFI BIOS UTILITY</span>
          <span class="uefi-pill">${isEz ? 'EZ Mode' : 'Advanced Mode'}</span>
          ${dirtyBadge}
        </div>
        <div class="uefi-header-right">
          <span id="uefi-live-clock">${BIOS.Monitor.getFormattedDate()} ${BIOS.Monitor.getFormattedTime()}</span>
          <button class="uefi-btn uefi-btn-primary" id="uefi-toggle-submode">
            ${isEz ? 'F7 進階模式 (Advanced)' : 'F7 簡易儀表板 (EZ Mode)'}
          </button>
        </div>
      </div>
    `;

    const bodyHtml = isEz ? buildUefiEzHtml() : buildUefiAdvancedHtml();

    const footerHtml = `
      <div class="uefi-footer">
        <span>支援滑鼠操作、拖曳排序與鍵盤快捷鍵（←→↑↓ / Enter / F7 / F9 / F10 / ESC）</span>
        <div class="uefi-footer-actions">
          <button class="uefi-btn" id="uefi-btn-lang">語言: ${escapeHtml(st.draftSettings.language)}</button>
          <button class="uefi-btn" id="uefi-btn-defaults">F9 載入預設</button>
          <button class="uefi-btn" id="uefi-btn-discard">ESC 放棄離開</button>
          <button class="uefi-btn uefi-btn-success" id="uefi-btn-save">F10 儲存並重開機</button>
        </div>
      </div>
    `;

    container.innerHTML = `<div class="bios-uefi">${headerHtml}${bodyHtml}${footerHtml}</div>`;

    document.getElementById('uefi-toggle-submode').addEventListener('click', () => {
      BIOS.State.setUefiSubMode(isEz ? 'advanced' : 'ez');
      renderAll();
    });
    document.getElementById('uefi-btn-lang').addEventListener('click', () => {
      BIOS.State.cycleOption('language', ['繁體中文', 'English'], 1);
      renderBiosScreen();
    });
    document.getElementById('uefi-btn-defaults').addEventListener('click', () => openConfirm('loadDefaults'));
    document.getElementById('uefi-btn-discard').addEventListener('click', () => openConfirm('discardAndExit'));
    document.getElementById('uefi-btn-save').addEventListener('click', () => openConfirm('saveAndReset'));

    if (isEz) {
      bindUefiEzEvents(container);
    } else {
      bindUefiAdvancedEvents(container);
    }
  }

  function buildUefiEzHtml() {
    const s = BIOS.State.get().draftSettings;
    const m = BIOS.Monitor.data;
    const tempPct = Math.min(100, Math.max(10, (m.cpuTemp / 95) * 100));
    const fanPct = Math.min(100, Math.max(10, (m.cpuFan / 2800) * 100));
    const vcorePct = Math.min(100, Math.max(15, ((m.vcore - 0.8) / 0.8) * 100));

    const bootCardsHtml = s.bootOrder.map((devId, idx) => {
      const dev = BIOS.BOOT_DEVICES[devId];
      return `
        <div class="boot-card" draggable="true" data-boot-idx="${idx}">
          <div class="boot-card-left">
            <span class="boot-rank">${idx + 1}</span>
            <span class="boot-name">${dev ? dev.icon : ''} ${escapeHtml(dev ? dev.shortName : devId)}</span>
          </div>
          <div class="boot-move-btns">
            <button class="boot-mini-btn" data-move-up="${idx}" title="上移">↑</button>
            <button class="boot-mini-btn" data-move-down="${idx}" title="下移">↓</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="uefi-ez-grid">
        <!-- Panel 1: System & Telemetry -->
        <div class="uefi-card">
          <div class="uefi-card-title">
            <span>系統資訊與硬體監控</span>
            <span style="font-size:11px; color:#64748b;">LIVE</span>
          </div>
          <div class="uefi-kv-list">
            <div class="uefi-kv"><span>BIOS 版本</span><span>v2.40 (2026)</span></div>
            <div class="uefi-kv"><span>處理器</span><span>Intel Core i7-14700K</span></div>
            <div class="uefi-kv"><span>記憶體</span><span>${s.xmp === 'Enabled' ? '32GB DDR5-6000' : '32GB DDR5-4800'}</span></div>
            <div class="uefi-kv"><span>主機板溫度</span><span id="ez-mb-temp">${m.mbTemp.toFixed(1)} °C</span></div>
          </div>
          <div class="meter-group">
            <div class="meter-row">
              <div class="meter-label"><span>CPU 溫度</span><span class="meter-val" id="ez-cpu-temp" style="color:#34d399;">${m.cpuTemp.toFixed(1)} °C</span></div>
              <div class="meter-track"><div class="meter-fill" id="ez-cpu-temp-bar" style="width:${tempPct}%; background:#34d399;"></div></div>
            </div>
            <div class="meter-row">
              <div class="meter-label"><span>CPU 風扇轉速</span><span class="meter-val" id="ez-cpu-fan" style="color:#38bdf8;">${Math.round(m.cpuFan)} RPM</span></div>
              <div class="meter-track"><div class="meter-fill" id="ez-cpu-fan-bar" style="width:${fanPct}%; background:#38bdf8;"></div></div>
            </div>
            <div class="meter-row">
              <div class="meter-label"><span>核心電壓 (Vcore)</span><span class="meter-val" id="ez-vcore" style="color:#fbbf24;">${m.vcore.toFixed(3)} V</span></div>
              <div class="meter-track"><div class="meter-fill" id="ez-vcore-bar" style="width:${vcorePct}%; background:#fbbf24;"></div></div>
            </div>
          </div>
        </div>

        <!-- Panel 2: Quick Toggles -->
        <div class="uefi-card">
          <div class="uefi-card-title">
            <span>常用快速設定</span>
            <span style="font-size:11px; color:#64748b;">點擊切換</span>
          </div>
          <div class="quick-toggle-list">
            <div class="quick-toggle-item" data-quick-key="xmp" data-quick-opts="Enabled,Disabled">
              <div>
                <div class="quick-toggle-name">X.M.P. 記憶體超頻</div>
                <div class="quick-toggle-sub">DDR5-6000 Profile</div>
              </div>
              <span class="pill-state ${s.xmp === 'Enabled' ? 'on' : ''}">${s.xmp}</span>
            </div>

            <div class="quick-toggle-item" data-quick-key="fanMode" data-quick-opts="Silent,Auto,Turbo">
              <div>
                <div class="quick-toggle-name">風扇轉速曲線</div>
                <div class="quick-toggle-sub">影響 CPU 散熱與 RPM</div>
              </div>
              <span class="pill-state info">${s.fanMode}</span>
            </div>

            <div class="quick-toggle-item" data-quick-key="secureBoot" data-quick-opts="Enabled,Disabled">
              <div>
                <div class="quick-toggle-name">Secure Boot</div>
                <div class="quick-toggle-sub">安全開機簽章驗證</div>
              </div>
              <span class="pill-state ${s.secureBoot === 'Enabled' ? 'on' : ''}">${s.secureBoot}</span>
            </div>

            <div class="quick-toggle-item" data-quick-key="fastBoot" data-quick-opts="Disabled,Enabled">
              <div>
                <div class="quick-toggle-name">Fast Boot</div>
                <div class="quick-toggle-sub">縮短 POST 自檢等待</div>
              </div>
              <span class="pill-state ${s.fastBoot === 'Enabled' ? 'on' : ''}">${s.fastBoot}</span>
            </div>

            <div class="quick-toggle-item" data-quick-key="vtx" data-quick-opts="Enabled,Disabled">
              <div>
                <div class="quick-toggle-name">Intel VT-x 虛擬化</div>
                <div class="quick-toggle-sub">虛擬機硬體加速</div>
              </div>
              <span class="pill-state ${s.vtx === 'Enabled' ? 'on' : ''}">${s.vtx}</span>
            </div>
          </div>
        </div>

        <!-- Panel 3: Boot Priority -->
        <div class="uefi-card">
          <div class="uefi-card-title">
            <span>開機優先順序 (Boot Priority)</span>
            <span style="font-size:11px; color:#64748b;">可拖曳排序</span>
          </div>
          <div class="boot-card-list" id="ez-boot-list">
            ${bootCardsHtml}
          </div>
          <div style="font-size:11px; color:#64748b; line-height:1.5; margin-top:auto;">
            排列第 1 順位的裝置將在儲存重開機 (F10) 後優先啟動模擬作業系統。
          </div>
        </div>
      </div>
    `;
  }

  function bindUefiEzEvents(container) {
    container.querySelectorAll('.quick-toggle-item').forEach((item) => {
      item.addEventListener('click', () => {
        const key = item.dataset.quickKey;
        const opts = item.dataset.quickOpts.split(',');
        BIOS.State.cycleOption(key, opts, 1);
        BIOS.Post.beep(1100, 35, 'sine');
        renderBiosScreen();
      });
    });

    container.querySelectorAll('[data-move-up]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.moveUp);
        BIOS.State.moveBootSlot(idx, idx - 1);
        renderBiosScreen();
      });
    });

    container.querySelectorAll('[data-move-down]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.moveDown);
        BIOS.State.moveBootSlot(idx, idx + 1);
        renderBiosScreen();
      });
    });

    container.querySelectorAll('.boot-card').forEach((card) => {
      card.addEventListener('dragstart', () => {
        dragSrcIdx = Number(card.dataset.bootIdx);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        container.querySelectorAll('.boot-card').forEach((c) => c.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIdx = Number(card.dataset.bootIdx);
        if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
          BIOS.State.moveBootSlot(dragSrcIdx, targetIdx);
          renderBiosScreen();
        }
        dragSrcIdx = null;
      });
    });
  }

  function buildUefiAdvancedHtml() {
    const st = BIOS.State.get();
    const items = BIOS.MENU_SCHEMA[st.activeTab] || [];
    if (st.selectedIndex >= items.length) st.selectedIndex = 0;
    const selectedItem = items[st.selectedIndex];

    const tabsHtml = BIOS.TABS.map((tab) => {
      const active = tab.id === st.activeTab ? 'active' : '';
      return `<button class="uefi-adv-tab ${active}" data-tab="${tab.id}">${escapeHtml(BIOS.State.t(tab.label))}</button>`;
    }).join('');

    const rowsHtml = items.map((item, idx) => {
      const sel = idx === st.selectedIndex ? 'selected' : '';
      const ro = item.type === 'readonly' ? 'readonly' : '';
      const val = getItemDisplayValue(item);
      return `<div class="uefi-adv-row ${sel} ${ro}" data-idx="${idx}">
        <span>${escapeHtml(BIOS.State.t(item.label))}</span>
        <span class="uefi-adv-val" data-live-key="${item.key}">${escapeHtml(val)}</span>
      </div>`;
    }).join('');

    return `
      <div class="uefi-adv-tabs">${tabsHtml}</div>
      <div class="uefi-adv-body">
        <div class="uefi-adv-list">${rowsHtml}</div>
        <aside class="uefi-adv-side">
          <div>
            <div class="uefi-help-heading">設定說明 (Help)</div>
            <div class="uefi-help-copy">${escapeHtml(selectedItem ? BIOS.State.t(selectedItem.help) : '')}</div>
          </div>
          <div style="font-size:12px; color:#64748b; border-top:1px solid #1e293b; padding-top:10px; line-height:1.6;">
            點擊項目兩次或按 Enter 開啟選單；也可直接使用鍵盤 +/- 快速切換數值。
          </div>
        </aside>
      </div>
    `;
  }

  function bindUefiAdvancedEvents(container) {
    const st = BIOS.State.get();
    container.querySelectorAll('.uefi-adv-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        st.activeTab = btn.dataset.tab;
        st.selectedIndex = 0;
        renderBiosScreen();
      });
    });

    container.querySelectorAll('.uefi-adv-row').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = Number(row.dataset.idx);
        if (st.selectedIndex === idx) {
          activateCurrentItem();
        } else {
          st.selectedIndex = idx;
          renderBiosScreen();
        }
      });
      row.addEventListener('dblclick', () => {
        st.selectedIndex = Number(row.dataset.idx);
        activateCurrentItem();
      });
    });
  }

  /* ---------- Live Telemetry Partial Update ---------- */
  function updateLiveFields() {
    const st = BIOS.State.get();
    if (st.screen !== 'bios') return;

    const clockEl = document.getElementById('uefi-live-clock');
    if (clockEl) {
      clockEl.textContent = `${BIOS.Monitor.getFormattedDate()} ${BIOS.Monitor.getFormattedTime()}`;
    }

    const m = BIOS.Monitor.data;
    const ezTemp = document.getElementById('ez-cpu-temp');
    if (ezTemp) {
      ezTemp.textContent = `${m.cpuTemp.toFixed(1)} °C`;
      document.getElementById('ez-mb-temp').textContent = `${m.mbTemp.toFixed(1)} °C`;
      document.getElementById('ez-cpu-fan').textContent = `${Math.round(m.cpuFan)} RPM`;
      document.getElementById('ez-vcore').textContent = `${m.vcore.toFixed(3)} V`;
      document.getElementById('ez-cpu-temp-bar').style.width = `${Math.min(100, Math.max(10, (m.cpuTemp / 95) * 100))}%`;
      document.getElementById('ez-cpu-fan-bar').style.width = `${Math.min(100, Math.max(10, (m.cpuFan / 2800) * 100))}%`;
      document.getElementById('ez-vcore-bar').style.width = `${Math.min(100, Math.max(15, ((m.vcore - 0.8) / 0.8) * 100))}%`;
    }

    const liveMap = {
      systemTime: `[${BIOS.Monitor.getFormattedTime()}]`,
      systemDate: `[${BIOS.Monitor.getFormattedDate()}]`,
      cpuTemp: `${m.cpuTemp.toFixed(1)} °C`,
      mbTemp: `${m.mbTemp.toFixed(1)} °C`,
      cpuFan: `${Math.round(m.cpuFan)} RPM`,
      vcore: `${m.vcore.toFixed(3)} V`
    };
    Object.keys(liveMap).forEach((k) => {
      const node = document.querySelector(`[data-live-key="${k}"]`);
      if (node) node.textContent = liveMap[k];
    });
  }

  /* ---------- Item Activation & Modals ---------- */
  function activateCurrentItem() {
    const st = BIOS.State.get();
    const items = BIOS.MENU_SCHEMA[st.activeTab] || [];
    const item = items[st.selectedIndex];
    if (!item || item.type === 'readonly') return;

    if (item.type === 'select') {
      const curIdx = Math.max(0, item.options.indexOf(st.draftSettings[item.key]));
      st.modal = {
        type: 'option',
        title: BIOS.State.t(item.label),
        options: item.options.map((opt) => ({ value: opt, label: opt })),
        selectedIdx: curIdx,
        onSelect: (val) => {
          BIOS.State.setSetting(item.key, val);
          st.modal = null;
          renderAll();
        }
      };
      renderModal();
    } else if (item.type === 'boot-order') {
      const devIds = Object.keys(BIOS.BOOT_DEVICES);
      const curDev = st.draftSettings.bootOrder[item.slotIndex];
      st.modal = {
        type: 'option',
        title: BIOS.State.t(item.label),
        options: devIds.map((id) => ({ value: id, label: BIOS.BOOT_DEVICES[id].name })),
        selectedIdx: Math.max(0, devIds.indexOf(curDev)),
        onSelect: (val) => {
          BIOS.State.setBootSlot(item.slotIndex, val);
          st.modal = null;
          renderAll();
        }
      };
      renderModal();
    } else if (item.type === 'password') {
      st.modal = {
        type: 'password-set',
        title: '設定管理員密碼 (Administrator Password)',
        error: ''
      };
      renderModal();
    } else if (item.type === 'clock') {
      st.modal = {
        type: 'time-edit',
        title: '設定系統時間 (HH:MM:SS)',
        value: BIOS.Monitor.getFormattedTime(),
        error: ''
      };
      renderModal();
    } else if (item.type === 'date') {
      st.modal = {
        type: 'date-edit',
        title: '設定系統日期 (YYYY/MM/DD)',
        value: BIOS.Monitor.getFormattedDate(),
        error: ''
      };
      renderModal();
    } else if (item.type === 'action') {
      openConfirm(item.action);
    }
  }

  function stepCurrentItem(dir) {
    const st = BIOS.State.get();
    const items = BIOS.MENU_SCHEMA[st.activeTab] || [];
    const item = items[st.selectedIndex];
    if (!item) return;

    if (item.type === 'select') {
      BIOS.State.cycleOption(item.key, item.options, dir);
      renderBiosScreen();
    } else if (item.type === 'boot-order') {
      BIOS.State.moveBootSlot(item.slotIndex, item.slotIndex - dir);
      renderBiosScreen();
    } else if (item.type === 'clock') {
      st.draftSettings.timeOffsetMs = (st.draftSettings.timeOffsetMs || 0) + dir * 60000;
      renderBiosScreen();
    }
  }

  function openConfirm(action) {
    const st = BIOS.State.get();
    const copy = {
      saveAndReset: {
        title: '儲存設定並重新開機 (F10)',
        message: '確定要儲存目前的 BIOS 設定變更並重新啟動系統嗎？',
        okText: '儲存並重開 (Yes)'
      },
      discardAndExit: {
        title: '捨棄變更並離開 (ESC)',
        message: BIOS.State.isDirty()
          ? '你有尚未儲存的變更，確定要放棄修改並離開 BIOS 嗎？'
          : '確定要離開 BIOS Setup 並重新啟動系統嗎？',
        okText: '離開 (Yes)'
      },
      loadDefaults: {
        title: '載入最佳化預設值 (F9)',
        message: '確定要將所有 BIOS 選項還原為出廠最佳化預設值嗎？',
        okText: '還原預設 (Yes)'
      }
    }[action];

    st.modal = {
      type: 'confirm',
      title: copy.title,
      message: copy.message,
      okText: copy.okText,
      onConfirm: () => {
        st.modal = null;
        if (action === 'saveAndReset') {
          BIOS.State.saveDraft();
          showToast('已儲存 BIOS 設定至 localStorage，正在重開機...');
          BIOS.Post.startPost();
        } else if (action === 'discardAndExit') {
          BIOS.State.discardDraft();
          showToast('已捨棄未儲存變更，正在重開機...');
          BIOS.Post.startPost();
        } else if (action === 'loadDefaults') {
          BIOS.State.loadDefaults();
          showToast('已載入最佳化預設值（按 F10 儲存生效）');
          renderAll();
        }
      }
    };
    renderModal();
  }

  function openPasswordVerify(onSuccess) {
    const st = BIOS.State.get();
    st.modal = {
      type: 'password-verify',
      title: '請輸入 BIOS 管理員密碼',
      error: '',
      onSuccess
    };
    renderModal();
  }

  function renderModal() {
    const st = BIOS.State.get();
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    if (!overlay || !box) return;

    if (!st.modal) {
      overlay.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    overlay.classList.remove('hidden');
    const m = st.modal;
    const themeClass = st.theme === 'legacy' ? 'modal-legacy' : 'modal-uefi';
    box.className = `modal-box ${themeClass}`;

    if (m.type === 'option') {
      const optsHtml = m.options.map((opt, idx) => {
        const sel = idx === m.selectedIdx ? 'selected' : '';
        return `<div class="modal-option ${sel}" data-opt-idx="${idx}">
          <span>${escapeHtml(opt.label)}</span>
          <span>${sel ? '●' : ''}</span>
        </div>`;
      }).join('');

      box.innerHTML = `
        <div class="modal-header">${escapeHtml(m.title)}</div>
        <div class="modal-body">${optsHtml}</div>
        <div class="modal-footer">
          <button class="modal-btn" id="modal-cancel">取消 (ESC)</button>
          <button class="modal-btn primary" id="modal-ok">確定 (Enter)</button>
        </div>
      `;

      box.querySelectorAll('.modal-option').forEach((el) => {
        el.addEventListener('click', () => {
          m.selectedIdx = Number(el.dataset.optIdx);
          m.onSelect(m.options[m.selectedIdx].value);
        });
      });
      document.getElementById('modal-cancel').addEventListener('click', () => {
        st.modal = null;
        renderModal();
      });
      document.getElementById('modal-ok').addEventListener('click', () => {
        m.onSelect(m.options[m.selectedIdx].value);
      });
    } else if (m.type === 'confirm') {
      box.innerHTML = `
        <div class="modal-header">${escapeHtml(m.title)}</div>
        <div class="modal-body">${escapeHtml(m.message)}</div>
        <div class="modal-footer">
          <button class="modal-btn" id="modal-cancel">取消 (No)</button>
          <button class="modal-btn primary" id="modal-ok">${escapeHtml(m.okText)}</button>
        </div>
      `;
      document.getElementById('modal-cancel').addEventListener('click', () => {
        st.modal = null;
        renderModal();
      });
      document.getElementById('modal-ok').addEventListener('click', () => m.onConfirm());
    } else if (m.type === 'password-set' || m.type === 'password-verify') {
      const isSet = m.type === 'password-set';
      box.innerHTML = `
        <div class="modal-header">${escapeHtml(m.title)}</div>
        <div class="modal-body">
          <div>${isSet ? '輸入新密碼（留空按確定可移除密碼）：' : '此 BIOS 已受密碼保護，請輸入管理員密碼：'}</div>
          <input type="password" id="modal-pwd-input" class="modal-input" autocomplete="off" placeholder="輸入密碼..." />
          ${m.error ? `<div class="modal-error">${escapeHtml(m.error)}</div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="modal-btn" id="modal-cancel">取消 (ESC)</button>
          <button class="modal-btn primary" id="modal-ok">確認 (Enter)</button>
        </div>
      `;
      const input = document.getElementById('modal-pwd-input');
      setTimeout(() => input && input.focus(), 20);

      const submit = () => {
        const val = input.value.trim();
        if (isSet) {
          BIOS.State.setSetting('adminPassword', val);
          st.modal = null;
          showToast(val ? '已更新管理員密碼（按 F10 儲存生效）' : '已清除管理員密碼（按 F10 儲存生效）');
          renderAll();
        } else {
          if (val === st.savedSettings.adminPassword) {
            const cb = m.onSuccess;
            st.modal = null;
            renderModal();
            if (cb) cb();
          } else {
            BIOS.Post.errorBeep();
            m.error = '密碼錯誤，請重新輸入！';
            renderModal();
          }
        }
      };

      document.getElementById('modal-cancel').addEventListener('click', () => {
        st.modal = null;
        renderModal();
      });
      document.getElementById('modal-ok').addEventListener('click', submit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    } else if (m.type === 'time-edit' || m.type === 'date-edit') {
      const isTime = m.type === 'time-edit';
      box.innerHTML = `
        <div class="modal-header">${escapeHtml(m.title)}</div>
        <div class="modal-body">
          <div>${isTime ? '請輸入格式 HH:MM:SS（例如 14:30:00）：' : '請輸入格式 YYYY/MM/DD（例如 2026/11/28）：'}</div>
          <input type="text" id="modal-text-input" class="modal-input" value="${escapeHtml(m.value)}" />
          ${m.error ? `<div class="modal-error">${escapeHtml(m.error)}</div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="modal-btn" id="modal-cancel">取消</button>
          <button class="modal-btn primary" id="modal-ok">套用</button>
        </div>
      `;
      const input = document.getElementById('modal-text-input');
      setTimeout(() => { if (input) { input.focus(); input.select(); } }, 20);

      const submit = () => {
        const raw = input.value.trim();
        const cur = BIOS.Monitor.getNowDate();
        let target = new Date(cur.getTime());
        if (isTime) {
          const match = raw.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
          if (!match) {
            m.error = '時間格式不正確，請使用 HH:MM:SS';
            renderModal();
            return;
          }
          target.setHours(Number(match[1]), Number(match[2]), Number(match[3] || 0));
        } else {
          const match = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
          if (!match) {
            m.error = '日期格式不正確，請使用 YYYY/MM/DD';
            renderModal();
            return;
          }
          target.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }
        st.draftSettings.timeOffsetMs = target.getTime() - Date.now();
        st.modal = null;
        renderAll();
      };

      document.getElementById('modal-cancel').addEventListener('click', () => {
        st.modal = null;
        renderModal();
      });
      document.getElementById('modal-ok').addEventListener('click', submit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    }
  }

  return {
    renderAll,
    renderBiosScreen,
    renderModal,
    updateLiveFields,
    activateCurrentItem,
    stepCurrentItem,
    openConfirm,
    openPasswordVerify,
    showToast
  };
})();
