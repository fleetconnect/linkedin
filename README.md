# Trading Bot

A simple, extensible crypto trading bot in pure Python (no third-party
dependencies). It supports **backtesting** on historical candles and
**paper trading** against live prices from Binance's public API.

> ⚠️ **Educational use only. This bot never places real orders** — it only
> reads public market data and simulates trades with virtual money. Past
> backtest performance does not predict future results.

## Requirements

- Python 3.10+
- No packages to install — standard library only

## Quick start

```bash
# Backtest an SMA crossover on the last 500 hourly BTC candles
python main.py backtest --symbol BTCUSDT --interval 1h --limit 500 --strategy sma --fast 10 --slow 30

# Backtest RSI mean-reversion on ETH
python main.py backtest --symbol ETHUSDT --interval 4h --strategy rsi --period 14

# Download candles to CSV for offline/repeatable backtests
python main.py fetch --symbol BTCUSDT --interval 1h --limit 1000 --out btc.csv
python main.py backtest --csv btc.csv --strategy sma

# Paper-trade live 1-minute candles (Ctrl-C to stop)
python main.py paper --symbol BTCUSDT --interval 1m --poll 60 --strategy sma
```

## Strategies

| Name  | Idea | Key flags |
|-------|------|-----------|
| `sma` | Buy when the fast SMA crosses above the slow SMA; sell on the cross down | `--fast`, `--slow` |
| `rsi` | Buy when RSI < oversold; sell when RSI > overbought (Wilder's smoothing) | `--period`, `--oversold`, `--overbought` |

Add your own by subclassing `bot.strategies.base.Strategy` (implement
`on_candle(candle) -> Signal`) and registering it in
`bot/strategies/__init__.py`'s `STRATEGIES` dict.

## Risk controls

Every run applies a `RiskManager`:

- `--max-position` — fraction of cash deployed per entry (default 0.95)
- `--stop-loss` — hard exit if price falls this fraction below entry (default 0.05 = 5%)
- `--fee` — simulated fee per trade (default 0.001 = 0.1%, ~Binance spot taker)

## Project layout

```
main.py                  CLI (backtest / paper / fetch)
bot/
  data.py                Binance public-API candle fetching + CSV load/save
  portfolio.py           paper portfolio: cash, position, trades, fees
  risk.py                position sizing + stop-loss
  backtest.py            backtest engine + metrics (return, drawdown, win rate)
  paper.py               live paper-trading loop
  strategies/            Strategy base class, SMA crossover, RSI
tests/                   unit tests (synthetic data, no network needed)
```

## Tests

```bash
python -m unittest -v
```
