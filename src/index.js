import { config } from './config.js';
import { getInstruments, getDepth } from './okx.js';
import { scanWalls } from './wallScanner.js';
import { sendToTelegram } from './telegram.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const lastAlert = new Map();
const repeatHistory = new Map();
const time = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

async function scanAll() {
  const instruments = await getInstruments();
  console.log(`[${time()}] Bắt đầu quét ${instruments.length} hợp đồng OKX USDT SWAP`);
  let found = 0;

  for (let i = 0; i < instruments.length; i++) {
    const instrument = instruments[i];
    try {
      const book = await getDepth(instrument.instId);
      const walls = scanWalls(instrument, book);
      for (const wall of walls) {
        const key = `${wall.symbol}:${wall.side}:${wall.priceText}`;
        const now = Date.now();
        if (now - (lastAlert.get(key) || 0) < config.cooldown) continue;
        const repeatCount = (repeatHistory.get(key) || 0) + 1;
        await sendToTelegram({ ...wall, repeatCount });
        repeatHistory.set(key, repeatCount);
        lastAlert.set(key, Date.now());
        found++;
        console.log(`[${time()}] ${wall.symbol} ${wall.side} ${wall.priceText} ${wall.ratio.toFixed(1)}x`);
      }
    } catch (error) {
      const status = error.response?.status;
      console.error(`[${time()}] ${instrument.instId}: ${status || ''} ${error.message}`);
      if (status === 451) throw error;
      if (status === 429 || status === 418) {
        const retry = Number(error.response?.headers?.['retry-after']);
        await sleep(Number.isFinite(retry) && retry > 0 ? retry * 1000 : 65000);
      }
    }
    if (i < instruments.length - 1) await sleep(config.requestDelay);
  }
  console.log(`[${time()}] Hoàn tất, đã gửi ${found} cảnh báo. Nghỉ ${config.scanInterval / 60000} phút.`);
}

console.log(`[${time()}] 🚀 OKX WALL SCANNER V1 STARTED`);
console.log(`Depth=${config.depthLimit}, Ratio>=${config.multiplier}x, Min=${config.minUSDT} USDT`);
while (true) {
  try { await scanAll(); }
  catch (error) {
    console.error(`[${time()}] Lỗi vòng quét: ${error.message}`);
    if (error.response?.status === 451) process.exit(1);
  }
  await sleep(config.scanInterval);
}
