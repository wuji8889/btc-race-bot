# btc-race-bot

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/wuji8889/btc-race-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/wuji8889/btc-race-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

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

## Run it

```sh
node main.ts
```

## Files

- `main.ts` — the bot (Node 22, `agent-fun/bars-replay/v1`, standard library
  only apart from the vendored shim).
- `vendor/makefun-bars.ts` — byte-identical copy of the kit's protocol shim.

## Local grade

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=d5a50dzy&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
