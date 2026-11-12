import 'dotenv/config';

const num = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${name}`);
  return value;
};

export const config = {
  rest: process.env.OKX_REST || 'https://www.okx.com',
  depthLimit: num('DEPTH_LIMIT', 400),
  multiplier: num('WALL_MULTIPLIER', 50),
  minUSDT: num('MIN_WALL_USDT', 500000),
  rangePercent: num('PRICE_RANGE_PERCENT', 5),
  minLevels: num('MIN_LEVELS', 20),
  scanInterval: num('SCAN_INTERVAL_MS', 3600000),
  requestDelay: num('REQUEST_DELAY_MS', 400),
  cooldown: num('ALERT_COOLDOWN_MS', 300000),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || ''
};
