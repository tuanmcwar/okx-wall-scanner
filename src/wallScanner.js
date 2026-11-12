import { config } from './config.js';

export function scanWalls(instrument, book) {
  // OKX linear USDT SWAP: sz is contracts; ctVal * ctMult is base units per contract.
  const contractBaseQty = Number(instrument.ctVal) * Number(instrument.ctMult || 1);
  const parse = (entries = []) => entries.map(([price, contracts]) => {
    const p = Number(price);
    const c = Number(contracts);
    return { price: p, priceText: price, contracts: c,
      qty: c * contractBaseQty, usdt: p * c * contractBaseQty };
  }).filter(x => x.price > 0 && x.contracts > 0 && Number.isFinite(x.usdt));

  const bids = parse(book.bids);
  const asks = parse(book.asks);
  if (!bids.length || !asks.length) return [];

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const midPrice = (bestBid + bestAsk) / 2;
  const lower = midPrice * (1 - config.rangePercent / 100);
  const upper = midPrice * (1 + config.rangePercent / 100);

  function detect(levels, side) {
    const nearby = levels.filter(x => x.price >= lower && x.price <= upper);
    if (nearby.length < config.minLevels) return [];
    const total = nearby.reduce((sum, x) => sum + x.usdt, 0);
    return nearby.flatMap(x => {
      if (x.usdt < config.minUSDT || nearby.length < 2) return [];
      const averageUSDT = (total - x.usdt) / (nearby.length - 1);
      const ratio = averageUSDT > 0 ? x.usdt / averageUSDT : Infinity;
      if (ratio < config.multiplier) return [];
      return [{
        symbol: instrument.instId, side, price: x.price, priceText: x.priceText,
        contracts: x.contracts, qty: x.qty, usdt: x.usdt, ratio, averageUSDT,
        distancePercent: (x.price / midPrice - 1) * 100,
        bestBid, bestAsk, midPrice, depth: config.depthLimit
      }];
    });
  }

  return [...detect(bids, 'BUY'), ...detect(asks, 'SELL')]
    .sort((a, b) => b.ratio - a.ratio);
}
