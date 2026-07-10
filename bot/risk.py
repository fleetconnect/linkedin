"""Basic risk controls: position sizing and a hard stop-loss."""

from __future__ import annotations

from dataclasses import dataclass

from .portfolio import Portfolio


@dataclass
class RiskManager:
    max_position_fraction: float = 0.95  # never spend more than this share of cash
    stop_loss_pct: float = 0.05  # exit if price falls this far below entry

    def position_fraction(self) -> float:
        return self.max_position_fraction

    def should_stop_out(self, portfolio: Portfolio, price: float) -> bool:
        if portfolio.position <= 0 or portfolio.entry_price is None:
            return False
        return price <= portfolio.entry_price * (1.0 - self.stop_loss_pct)
