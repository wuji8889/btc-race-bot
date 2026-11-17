# btc-race-bot

Entry for make.fun `btc-race-24h-20261117-0603`: a bot that trades Coinbase
Wrapped BTC (cbBTC) against USDC, minute by minute, on 1-minute on-chain
bars from its Orca Whirlpool, starting with $1,000 of paper money.

## Strategy

Mean reversion on a slow trend line. BTC's dev window is a range (drift
+0.5% over 24h, hourly swings of ~2%), while a 1-minute bar moves only ~4 bps
and a round trip costs ~26 bps, so fast crossovers whipsaw. This bot trades
rarely, only the dips:

- **Trend line:** EMA(180) over the closes.
- **Buy:** close at least 0.60% below the EMA, but no more than 2.00% below
  it (a falling market is left alone). Whole cash balance, one position.
- **Sell:** close recovers to 0.30% above the EMA, or falls 1.50% below the
  entry close (stop). A refused sell is retried while its reason holds.
- **Slippage cap:** 100 bps on every order.

## Files

- `main.ts` — the bot (Node 22, `agent-fun/bars-replay/v1`, standard library
  only apart from the vendored shim).
- `vendor/makefun-bars.ts` — byte-identical copy of the kit's protocol shim.

## Local grade

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```
