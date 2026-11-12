import axios from 'axios';
import { config } from './config.js';

const fmt = (value, digits = 2) => Number(value).toLocaleString('en-US', {
  maximumFractionDigits: digits
});

export async function sendToTelegram(wall) {
  const repeat = Number(wall.repeatCount) || 1;
  const status = repeat > 1 ? `🔁 REPEAT ×${repeat}` : '🆕 NEW WALL';
  const side = wall.side === 'BUY' ? '🟢 BUY WALL' : '🔴 SELL WALL';
  const coin = wall.symbol.replace('-USDT-SWAP', 'USDT');
  const chart = `https://www.coinglass.com/tv/vi/Binance_${coin}`;
  const message = [
    '🚨 OKX FUTURES WALL ALERT', '',
    `🪙 Coin: ${wall.symbol}`, side, status, '',
    '💰 WALL INFORMATION',
    `💰 Giá Wall: ${wall.priceText}`,
    `💵 Giá trị: ${fmt(wall.usdt)} USDT`,
    `📊 Gấp trung bình: ${fmt(wall.ratio)} lần`,
    `📉 Trung bình/mức: ${fmt(wall.averageUSDT)} USDT`, '',
    '📍 PRICE POSITION',
    `📍 Khoảng cách giá: ${wall.distancePercent >= 0 ? '+' : ''}${fmt(wall.distancePercent)}%`,
    '⚠️ Snapshot lệnh chờ, không phải giao dịch đã khớp.'
  ].join('\n');

  if (!config.telegramToken || !config.telegramChatId) {
    console.log(message);
    return;
  }


const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;

const { data } = await axios.post(url, {
  chat_id: config.telegramChatId,
  text: message,
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📋 Copy giá Wall', copy_text: { text: String(wall.priceText) } },
        { text: '📈 Xem biểu đồ CoinGlass', url: chart }
      ]
    ]
  }
}, { timeout: 15000 });

  if (!data.ok) throw new Error(data.description || 'Telegram send failed');
}
