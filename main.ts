// BTC race bot: mean reversion on cbBTC 1-minute bars.
//
// The dev window is a range, not a trend: BTC drifted +0.5% over 24 hours with
// hourly swings of about 2%, while a 1-minute bar moves only ~4 bps on average
// and a full round trip costs ~26 bps in fees, slippage and impact. Fast
// crossovers whipsaw in that chop (a 1-minute MACD 19/39/9 loses ~$116 on the
// dev window), so this bot trades rarely, only the dips:
//
//   - Trend line: EMA(180) over the closes, seeded as the mean of its first
//     180 closes, then moving 2 / 181 of the way to each new close. It reads
//     every batch, warm-up bars included; while warming up it sends no order.
//   - Entry, on a bar's close (filled at the next open): the close is at
//     least 0.60% below the EMA (a dip into the range's lower half), but no
//     more than 2.00% below it (a market falling away, not ranging, is left
//     alone). One position only, the whole cash balance up to the weight cap.
//   - Exit, the whole position: the close recovers to 0.30% above the EMA,
//     or it falls 1.50% below the close the entry was decided on (the stop).
//     A sell the market refuses (no bar, or a price past the slippage cap at
//     the next open) is sent again on the next bar while its reason holds,
//     because the exit is re-decided from the position every batch.
//   - Every order caps its slippage at 100 bps, 1% past the close it was
//     decided on, so a buy or sell into a liquidity gap is refused (and
//     retried) rather than filled for almost nothing.
//
// The EMAs run in float64 on + - * / alone, each correctly rounded (IEEE 754),
// so the same bars give the same orders, run after run. No clock, no random,
// no files, no network: the only inputs are the bars the harness sends.

import { runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const EMA_SPAN = 180;
const BUY_BELOW_BPS = 60;
const SELL_ABOVE_BPS = 30;
const STOP_BPS = 150;
const KILL_BELOW_BPS = 200;
const MAX_SLIPPAGE_BPS = 100;

interface Ema {
  span: number;
  warm: number[];
  value: number | null;
}

const ema: Ema = { span: EMA_SPAN, warm: [], value: null };
let entryClose: number | null = null;

function step(close: number): void {
  if (ema.value !== null) {
    ema.value += (2 / (ema.span + 1)) * (close - ema.value);
    return;
  }
  ema.warm.push(close);
  if (ema.warm.length === ema.span) ema.value = ema.warm.reduce((a, x) => a + x, 0) / ema.span;
}

await runBars({
  onBatch(state: BarsState, batch: { bars: Bar[] }) {
    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar === undefined) return [];
    const close = Number(bar.c);
    step(close);
    if (state.warmingUp || ema.value === null) return [];
    const held = state.positions.get(SYMBOL);
    if (held === undefined) entryClose = null;
    const orders: (SellInput | BuyInput)[] = [];
    if (held !== undefined) {
      const stopped = entryClose !== null && close <= entryClose * (1 - STOP_BPS / 10000);
      const recovered = close >= ema.value * (1 + SELL_ABOVE_BPS / 10000);
      if (stopped || recovered) {
        orders.push({ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
      }
      return orders;
    }
    const dip = close <= ema.value * (1 - BUY_BELOW_BPS / 10000);
    const notTooDeep = close >= ema.value * (1 - KILL_BELOW_BPS / 10000);
    if (dip && notTooDeep) {
      const { fees } = state.hello;
      let size = state.cash;
      const room = state.weightRoom(SYMBOL);
      if (size > room) size = room;
      if (size >= BigInt(fees.min_notional_quote_units)) {
        orders.push({ side: 'buy', symbol: SYMBOL, notional_quote_units: size, max_slippage_bps: MAX_SLIPPAGE_BPS });
        entryClose = close;
      }
    }
    return orders;
  },
});
