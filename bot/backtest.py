"""Backtesting engine: replay historical candles through a strategy."""

from __future__ import annotations

from dataclasses import dataclass, field

from .data import Candle
from .portfolio import Portfolio
from .risk import RiskManager
from .strategies.base import Signal, Strategy


@dataclass
class BacktestResult:
    initial_equity: float
    final_equity: float
    total_return_pct: float
    max_drawdown_pct: float
    num_trades: int
    win_rate_pct: float | None  # None if there were no round trips
    equity_curve: list[float] = field(default_factory=list)

    def summary(self) -> str:
        win_rate = f"{self.win_rate_pct:.1f}%" if self.win_rate_pct is not None else "n/a"
        return (
            f"Initial equity:  {self.initial_equity:,.2f}\n"
            f"Final equity:    {self.final_equity:,.2f}\n"
            f"Total return:    {self.total_return_pct:+.2f}%\n"
            f"Max drawdown:    {self.max_drawdown_pct:.2f}%\n"
            f"Trades:          {self.num_trades}\n"
            f"Win rate:        {win_rate}"
        )


def run_backtest(
    strategy: Strategy,
    candles: list[Candle],
    portfolio: Portfolio | None = None,
    risk: RiskManager | None = None,
) -> BacktestResult:
    """Feed candles through the strategy, executing signals at the candle close."""
    portfolio = portfolio if portfolio is not None else Portfolio()
    risk = risk if risk is not None else RiskManager()
    initial_equity = portfolio.equity(candles[0].close) if candles else portfolio.cash

    equity_curve: list[float] = []
    round_trips: list[float] = []  # profit per buy->sell round trip
    entry_cost = 0.0

    for candle in candles:
        price = candle.close

        if risk.should_stop_out(portfolio, price):
            trade = portfolio.sell_all(price, candle.timestamp)
            if trade:
                round_trips.append(trade.units * trade.price - trade.fee - entry_cost)
        else:
            signal = strategy.on_candle(candle)
            if signal is Signal.BUY:
                trade = portfolio.buy(price, candle.timestamp, risk.position_fraction())
                if trade:
                    entry_cost = trade.units * trade.price + trade.fee
            elif signal is Signal.SELL:
                trade = portfolio.sell_all(price, candle.timestamp)
                if trade:
                    round_trips.append(trade.units * trade.price - trade.fee - entry_cost)

        equity_curve.append(portfolio.equity(price))

    final_equity = equity_curve[-1] if equity_curve else initial_equity

    max_drawdown = 0.0
    peak = float("-inf")
    for eq in equity_curve:
        peak = max(peak, eq)
        if peak > 0:
            max_drawdown = max(max_drawdown, (peak - eq) / peak)

    wins = sum(1 for p in round_trips if p > 0)
    win_rate = (wins / len(round_trips) * 100.0) if round_trips else None

    return BacktestResult(
        initial_equity=initial_equity,
        final_equity=final_equity,
        total_return_pct=(final_equity / initial_equity - 1.0) * 100.0 if initial_equity else 0.0,
        max_drawdown_pct=max_drawdown * 100.0,
        num_trades=len(portfolio.trades),
        win_rate_pct=win_rate,
        equity_curve=equity_curve,
    )
