"""Paper-trading portfolio: tracks cash, a single asset position, and trades."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Trade:
    timestamp: int
    side: str  # "buy" or "sell"
    price: float
    units: float
    fee: float


@dataclass
class Portfolio:
    cash: float = 10_000.0
    fee_rate: float = 0.001  # 0.1% per trade, roughly Binance spot taker fee
    position: float = 0.0  # units of the asset held
    entry_price: float | None = None
    trades: list[Trade] = field(default_factory=list)

    def equity(self, price: float) -> float:
        return self.cash + self.position * price

    def buy(self, price: float, timestamp: int, fraction: float = 1.0) -> Trade | None:
        """Spend `fraction` of available cash on the asset. No-op if already long."""
        if self.position > 0 or self.cash <= 0:
            return None
        spend = self.cash * min(max(fraction, 0.0), 1.0)
        if spend <= 0:
            return None
        fee = spend * self.fee_rate
        units = (spend - fee) / price
        self.cash -= spend
        self.position += units
        self.entry_price = price
        trade = Trade(timestamp, "buy", price, units, fee)
        self.trades.append(trade)
        return trade

    def sell_all(self, price: float, timestamp: int) -> Trade | None:
        """Liquidate the entire position. No-op if flat."""
        if self.position <= 0:
            return None
        gross = self.position * price
        fee = gross * self.fee_rate
        units = self.position
        self.cash += gross - fee
        self.position = 0.0
        self.entry_price = None
        trade = Trade(timestamp, "sell", price, units, fee)
        self.trades.append(trade)
        return trade
