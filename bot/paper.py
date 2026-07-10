"""Paper-trading loop: run a strategy against live prices with simulated money.

No real orders are ever placed — this module only reads public market data
and simulates fills in a local Portfolio.
"""

from __future__ import annotations

import time

from .data import fetch_klines
from .portfolio import Portfolio
from .risk import RiskManager
from .strategies.base import Signal, Strategy


def run_paper(
    strategy: Strategy,
    symbol: str,
    interval: str = "1m",
    poll_seconds: int = 60,
    portfolio: Portfolio | None = None,
    risk: RiskManager | None = None,
    warmup: int = 200,
) -> None:
    """Poll live candles and trade on paper until interrupted (Ctrl-C)."""
    portfolio = portfolio if portfolio is not None else Portfolio()
    risk = risk if risk is not None else RiskManager()

    # Warm the strategy up on recent history so indicators are ready immediately.
    history = fetch_klines(symbol, interval, limit=warmup)
    for candle in history[:-1]:  # last candle is still forming; skip it
        strategy.on_candle(candle)
    last_seen = history[-2].timestamp if len(history) > 1 else 0
    print(f"Warmed up on {max(len(history) - 1, 0)} candles. Paper trading {symbol} "
          f"({interval}), polling every {poll_seconds}s. Ctrl-C to stop.")

    try:
        while True:
            candles = fetch_klines(symbol, interval, limit=3)
            # Only act on candles that have closed and that we haven't seen yet.
            for candle in candles[:-1]:
                if candle.timestamp <= last_seen:
                    continue
                last_seen = candle.timestamp
                price = candle.close

                if risk.should_stop_out(portfolio, price):
                    trade = portfolio.sell_all(price, candle.timestamp)
                    if trade:
                        print(f"[stop-loss] SELL {trade.units:.6f} @ {price:,.2f}")
                    continue

                signal = strategy.on_candle(candle)
                if signal is Signal.BUY:
                    trade = portfolio.buy(price, candle.timestamp, risk.position_fraction())
                    if trade:
                        print(f"[signal] BUY {trade.units:.6f} @ {price:,.2f}")
                elif signal is Signal.SELL:
                    trade = portfolio.sell_all(price, candle.timestamp)
                    if trade:
                        print(f"[signal] SELL {trade.units:.6f} @ {price:,.2f}")

            price = candles[-1].close
            print(f"price={price:,.2f}  cash={portfolio.cash:,.2f}  "
                  f"position={portfolio.position:.6f}  equity={portfolio.equity(price):,.2f}")
            time.sleep(poll_seconds)
    except KeyboardInterrupt:
        price = fetch_klines(symbol, interval, limit=1)[-1].close
        print(f"\nStopped. Final equity: {portfolio.equity(price):,.2f} "
              f"({len(portfolio.trades)} trades)")
