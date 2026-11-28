/* =========================================================
   BIOS Configuration Schema, Defaults, Boot Devices & i18n
   ========================================================= */
window.BIOS = window.BIOS || {};

BIOS.STORAGE_KEYS = {
  SETTINGS: 'bios_sim_settings_v1',
  UI: 'bios_sim_ui_v1'
};

BIOS.BOOT_DEVICES = {
  nvme: {
    id: 'nvme',
    name: 'NVMe0: Samsung 990 PRO (Windows 11)',
    shortName: 'NVMe SSD (Windows 11)',
    type: 'UEFI',
    icon: '🪟',
    osTitle: 'Windows 11 Pro',
    osDesc: '已從 NVMe0 Samsung 990 PRO 成功引導 UEFI Windows Boot Manager。'
  },
  usb: {
    id: 'usb',
    name: 'USB0: Generic Flash Disk 32GB (Live Installer)',
    shortName: 'USB Flash Drive',
    type: 'UEFI/Legacy',
    icon: '💾',
    osTitle: 'OS Recovery / Live USB Installer',
    osDesc: '已從外部 USB 隨身碟啟動系統安裝與修復環境。'
  },
  sata: {
    id: 'sata',
    name: 'SATA1: WD Blue 4TB (Ubuntu 24.04 LTS)',
    shortName: 'SATA HDD (Ubuntu)',
    type: 'UEFI/Legacy',
    icon: '🐧',
    osTitle: 'Ubuntu 24.04 LTS (GNU GRUB)',
    osDesc: '已從 SATA1 硬碟載入 Linux Kernel 6.8 與 systemd。'
  },
  pxe: {
    id: 'pxe',
    name: 'Network: Intel I225-V PXE IPv4 Boot',
    shortName: 'Network PXE Boot',
    type: 'Network',
    icon: '🌐',
    osTitle: 'PXE Network Boot (DHCP)',
    osDesc: '正在透過區域網路嘗試向 TFTP 伺服器請求開機映像檔 (PXE-E53: No boot filename received)。'
  }
};

BIOS.DEFAULTS = {
  language: '繁體中文',
  timeOffsetMs: 0,
  xmp: 'Enabled',
  vtx: 'Enabled',
  hyperThreading: 'Enabled',
  sataMode: 'AHCI',
  usbLegacy: 'Enabled',
  above4G: 'Enabled',
  fanMode: 'Auto',
  acPowerLoss: 'Power Off',
  bootMode: 'UEFI',
  fastBoot: 'Disabled',
  bootOrder: ['nvme', 'usb', 'sata', 'pxe'],
  adminPassword: '',
  secureBoot: 'Enabled',
  tpmState: 'Enabled'
};

BIOS.TABS = [
  { id: 'Main', label: { '繁體中文': 'Main (主選單)', 'English': 'Main' }, short: 'Main' },
  { id: 'Advanced', label: { '繁體中文': 'Advanced (進階)', 'English': 'Advanced' }, short: 'Advanced' },
  { id: 'Power', label: { '繁體中文': 'Power (電源/監控)', 'English': 'Power' }, short: 'Power' },
  { id: 'Boot', label: { '繁體中文': 'Boot (開機)', 'English': 'Boot' }, short: 'Boot' },
  { id: 'Security', label: { '繁體中文': 'Security (安全性)', 'English': 'Security' }, short: 'Security' },
  { id: 'Exit', label: { '繁體中文': 'Exit (離開)', 'English': 'Exit' }, short: 'Exit' }
];

BIOS.MENU_SCHEMA = {
  Main: [
    {
      key: 'systemTime',
      type: 'clock',
      label: { '繁體中文': '系統時間 (System Time)', 'English': 'System Time' },
      help: {
        '繁體中文': '顯示並設定即時時鐘 (RTC) 的時間。按 Enter 可調整時間偏移，按 +/- 可微調分鐘。',
        'English': 'Set the system Real-Time Clock (RTC). Press Enter to adjust or +/- to step minutes.'
      }
    },
    {
      key: 'systemDate',
      type: 'date',
      label: { '繁體中文': '系統日期 (System Date)', 'English': 'System Date' },
      help: {
        '繁體中文': '顯示並設定系統日期 (YYYY/MM/DD)。按 Enter 可手動指定日期。',
        'English': 'Set the system date (YYYY/MM/DD). Press Enter to edit.'
      }
    },
    {
      key: 'language',
      type: 'select',
      options: ['繁體中文', 'English'],
      label: { '繁體中文': '介面語言 (System Language)', 'English': 'System Language' },
      help: {
        '繁體中文': '即時切換 BIOS Setup 的顯示語言（繁體中文 / English）。',
        'English': 'Switch the BIOS Setup interface language immediately.'
      }
    },
    {
      key: 'biosVersion',
      type: 'readonly',
      value: () => 'v2.40 (Build 2026.11)',
      label: { '繁體中文': 'BIOS 版本 (BIOS Version)', 'English': 'BIOS Version' },
      help: {
        '繁體中文': '唯讀資訊：目前主機板模擬韌體版本編號。',
        'English': 'Read-only: Current simulated firmware revision.'
      }
    },
    {
      key: 'cpuType',
      type: 'readonly',
      value: () => 'Intel(R) Core(TM) i7-14700K @ 3.40GHz',
      label: { '繁體中文': '處理器型號 (Processor)', 'English': 'Processor Type' },
      help: {
        '繁體中文': '唯讀資訊：已偵測到的 20 核心處理器型號。',
        'English': 'Read-only: Detected 20-core processor model.'
      }
    },
    {
      key: 'memoryTotal',
      type: 'readonly',
      value: (s) => s.xmp === 'Enabled' ? '32768 MB (DDR5-6000 XMP)' : '32768 MB (DDR5-4800 JEDEC)',
      label: { '繁體中文': '記憶體容量 (Total Memory)', 'English': 'Total Memory' },
      help: {
        '繁體中文': '唯讀資訊：顯示已安裝記憶體總容量與目前運作頻率（受 X.M.P. 設定影響）。',
        'English': 'Read-only: Installed memory capacity and active speed (depends on X.M.P.).'
      }
    }
  ],

  Advanced: [
    {
      key: 'xmp',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': '記憶體超頻設定檔 (X.M.P.)', 'English': 'Extreme Memory Profile (X.M.P.)' },
      help: {
        '繁體中文': '啟用後記憶體將以 DDR5-6000 運作，停用則回復至標準 JEDEC DDR5-4800。',
        'English': 'Enable DDR5-6000 XMP profile or revert to standard JEDEC DDR5-4800.'
      }
    },
    {
      key: 'vtx',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': 'Intel 虛擬化技術 (VT-x)', 'English': 'Intel Virtualization Technology (VT-x)' },
      help: {
        '繁體中文': '啟用硬體輔助虛擬化，讓 VMware、Hyper-V、WSL2 等虛擬環境能全速運作。',
        'English': 'Enable hardware-assisted virtualization for VMware, Hyper-V, and WSL2.'
      }
    },
    {
      key: 'hyperThreading',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': '超執行緒 (Hyper-Threading)', 'English': 'Hyper-Threading Technology' },
      help: {
        '繁體中文': '啟用或停用處理器邏輯執行緒（同步多執行緒）。',
        'English': 'Enable or disable simultaneous multithreading on performance cores.'
      }
    },
    {
      key: 'sataMode',
      type: 'select',
      options: ['AHCI', 'RAID', 'IDE'],
      label: { '繁體中文': 'SATA 控制器模式 (SATA Mode)', 'English': 'SATA Mode Selection' },
      help: {
        '繁體中文': '決定 SATA 介面運作模式：AHCI（現代標準）、RAID（磁碟陣列）或 IDE（傳統相容）。',
        'English': 'Configure SATA controller mode: AHCI (recommended), RAID, or legacy IDE.'
      }
    },
    {
      key: 'usbLegacy',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': 'USB 傳統支援 (USB Legacy Support)', 'English': 'Legacy USB Support' },
      help: {
        '繁體中文': '允許在無作業系統驅動程式的環境（如 DOS 或開機前）使用 USB 鍵鼠與隨身碟。',
        'English': 'Enable USB keyboard, mouse, and storage support in pre-OS environments.'
      }
    },
    {
      key: 'above4G',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': '4G 以上解碼 (Above 4G Decoding)', 'English': 'Above 4G Decoding' },
      help: {
        '繁體中文': '允許 64 位元 PCIe 裝置（如高階顯示卡 Resizable BAR）映射超過 4GB 的位址空間。',
        'English': 'Allow 64-bit PCIe devices (e.g. Resizable BAR) to decode above 4GB address space.'
      }
    }
  ],

  Power: [
    {
      key: 'cpuTemp',
      type: 'readonly',
      value: () => `${BIOS.Monitor.data.cpuTemp.toFixed(1)} °C`,
      label: { '繁體中文': 'CPU 即時溫度 (CPU Temperature)', 'English': 'CPU Temperature' },
      help: {
        '繁體中文': '即時硬體感測器讀數。切換下方風扇轉速模式會動態影響 CPU 散熱溫度。',
        'English': 'Live CPU temperature sensor reading. Affected by Fan Control Mode.'
      }
    },
    {
      key: 'mbTemp',
      type: 'readonly',
      value: () => `${BIOS.Monitor.data.mbTemp.toFixed(1)} °C`,
      label: { '繁體中文': '主機板溫度 (Motherboard Temp)', 'English': 'Motherboard Temperature' },
      help: {
        '繁體中文': '即時主機板晶片組周邊溫度感測器。',
        'English': 'Live motherboard chipset sensor temperature.'
      }
    },
    {
      key: 'cpuFan',
      type: 'readonly',
      value: () => `${Math.round(BIOS.Monitor.data.cpuFan)} RPM`,
      label: { '繁體中文': 'CPU 風扇轉速 (CPU Fan Speed)', 'English': 'CPU Fan Speed' },
      help: {
        '繁體中文': '即時 CPU 散熱風扇每分鐘轉速 (RPM)。',
        'English': 'Live CPU cooling fan rotational speed in RPM.'
      }
    },
    {
      key: 'vcore',
      type: 'readonly',
      value: () => `${BIOS.Monitor.data.vcore.toFixed(3)} V`,
      label: { '繁體中文': 'CPU 核心電壓 (CPU Core Voltage)', 'English': 'CPU Core Voltage' },
      help: {
        '繁體中文': '即時處理器核心供電電壓讀數。',
        'English': 'Live processor core supply voltage.'
      }
    },
    {
      key: 'fanMode',
      type: 'select',
      options: ['Silent', 'Auto', 'Turbo'],
      label: { '繁體中文': '風扇控制曲線 (Fan Control Mode)', 'English': 'Fan Control Mode' },
      help: {
        '繁體中文': '調整散熱策略：Silent（低噪音高溫）、Auto（智慧平衡）、Turbo（全速低溫）。',
        'English': 'Select fan profile: Silent (quiet), Auto (balanced), or Turbo (max cooling).'
      }
    },
    {
      key: 'acPowerLoss',
      type: 'select',
      options: ['Power Off', 'Power On', 'Last State'],
      label: { '繁體中文': '斷電恢復行為 (Restore AC Power Loss)', 'English': 'Restore on AC Power Loss' },
      help: {
        '繁體中文': '指定外部電源中斷後再恢復供電時的系統開機狀態。',
        'English': 'Specify system power state after an unexpected AC power outage.'
      }
    }
  ],

  Boot: [
    {
      key: 'bootMode',
      type: 'select',
      options: ['UEFI', 'Legacy CSM'],
      label: { '繁體中文': '開機模式 (Boot Mode Select)', 'English': 'Boot Mode Select' },
      help: {
        '繁體中文': '選擇 UEFI 純原生開機模式，或 Legacy CSM 傳統相容開機模式。',
        'English': 'Choose between native UEFI boot or Legacy CSM compatibility mode.'
      }
    },
    {
      key: 'fastBoot',
      type: 'select',
      options: ['Disabled', 'Enabled'],
      label: { '繁體中文': '快速開機 (Fast Boot)', 'English': 'Fast Boot' },
      help: {
        '繁體中文': '啟用後會縮短 POST 記憶體與儲存裝置自檢等待時間，加速進入系統。',
        'English': 'Shorten POST hardware check delay to boot into the OS faster.'
      }
    },
    {
      key: 'boot0',
      type: 'boot-order',
      slotIndex: 0,
      label: { '繁體中文': '開機順序 #1 (Boot Option #1)', 'English': 'Boot Option #1' },
      help: {
        '繁體中文': '第一優先開機裝置。按 Enter 更換裝置，或按 +/- 調整順序（將實際決定重開機載入的 OS）。',
        'English': 'First boot device priority. Press Enter to pick or +/- to reorder.'
      }
    },
    {
      key: 'boot1',
      type: 'boot-order',
      slotIndex: 1,
      label: { '繁體中文': '開機順序 #2 (Boot Option #2)', 'English': 'Boot Option #2' },
      help: {
        '繁體中文': '第二優先開機裝置。按 Enter 更換或 +/- 移動順序。',
        'English': 'Second boot device priority. Press Enter to pick or +/- to reorder.'
      }
    },
    {
      key: 'boot2',
      type: 'boot-order',
      slotIndex: 2,
      label: { '繁體中文': '開機順序 #3 (Boot Option #3)', 'English': 'Boot Option #3' },
      help: {
        '繁體中文': '第三優先開機裝置。按 Enter 更換或 +/- 移動順序。',
        'English': 'Third boot device priority. Press Enter to pick or +/- to reorder.'
      }
    },
    {
      key: 'boot3',
      type: 'boot-order',
      slotIndex: 3,
      label: { '繁體中文': '開機順序 #4 (Boot Option #4)', 'English': 'Boot Option #4' },
      help: {
        '繁體中文': '第四優先開機裝置。按 Enter 更換或 +/- 移動順序。',
        'English': 'Fourth boot device priority. Press Enter to pick or +/- to reorder.'
      }
    }
  ],

  Security: [
    {
      key: 'adminPassword',
      type: 'password',
      label: { '繁體中文': '管理員密碼 (Administrator Password)', 'English': 'Administrator Password' },
      help: {
        '繁體中文': '設定進入 BIOS Setup 所需的管理員密碼。留空並按確認即可清除密碼。',
        'English': 'Set a password required to enter BIOS Setup. Submit empty to clear.'
      }
    },
    {
      key: 'secureBoot',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': '安全開機 (Secure Boot)', 'English': 'Secure Boot' },
      help: {
        '繁體中文': '驗證開機載入程式的數位簽章，僅於 UEFI 模式下生效。',
        'English': 'Verify bootloader cryptographic signatures. Active in UEFI mode.'
      }
    },
    {
      key: 'tpmState',
      type: 'select',
      options: ['Enabled', 'Disabled'],
      label: { '繁體中文': '信賴平台模組 (TPM 2.0 State)', 'English': 'TPM 2.0 Security Device' },
      help: {
        '繁體中文': '啟用或停用硬體安全加密模組 TPM 2.0（Windows 11 與 BitLocker 必備）。',
        'English': 'Enable or disable Trusted Platform Module 2.0 (required for Windows 11).'
      }
    }
  ],

  Exit: [
    {
      key: 'saveAndReset',
      type: 'action',
      action: 'saveAndReset',
      label: { '繁體中文': '儲存變更並重新開機 (Save Changes and Reset)', 'English': 'Save Changes and Reset' },
      help: {
        '繁體中文': '將目前所有設定寫入瀏覽器 localStorage 並重新執行 POST 開機流程（快捷鍵 F10）。',
        'English': 'Save all changes to localStorage and reboot through POST (Hotkey: F10).'
      }
    },
    {
      key: 'discardAndExit',
      type: 'action',
      action: 'discardAndExit',
      label: { '繁體中文': '捨棄變更並離開 (Discard Changes and Exit)', 'English': 'Discard Changes and Exit' },
      help: {
        '繁體中文': '放棄尚未儲存的修改，還原為上次儲存的設定並重開機（快捷鍵 ESC）。',
        'English': 'Discard unsaved edits and reboot using previously saved settings (Hotkey: ESC).'
      }
    },
    {
      key: 'loadDefaults',
      type: 'action',
      action: 'loadDefaults',
      label: { '繁體中文': '載入最佳化預設值 (Load Optimized Defaults)', 'English': 'Load Optimized Defaults' },
      help: {
        '繁體中文': '將所有 BIOS 設定還原為出廠建議預設值（快捷鍵 F9）。',
        'English': 'Restore all BIOS configuration values to factory defaults (Hotkey: F9).'
      }
    }
  ]
};
