import fs from 'fs';

const CONFIG_FILE = new URL('./depositUpiConfig.json', import.meta.url);

const DEFAULT_CONFIG = {
  upis: ['8261047808@mbk', 'stakegame621@oksbi'],
  currentIndex: 0,
};

export const getDepositUpiConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
};

export const getCurrentDepositUpi = () => {
  const config = getDepositUpiConfig();
  return config.upis?.[config.currentIndex] || config.upis?.[0] || DEFAULT_CONFIG.upis[0];
};

export const getDepositUpis = () => {
  const config = getDepositUpiConfig();
  return config.upis || DEFAULT_CONFIG.upis;
};

export const rotateDepositUpi = () => {
  const config = getDepositUpiConfig();
  const upis = config.upis || DEFAULT_CONFIG.upis;
  config.currentIndex = (config.currentIndex + 1) % upis.length;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
};
