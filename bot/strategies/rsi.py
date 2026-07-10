from __future__ import annotations

from ..data import Candle
from .base import Signal, Strategy


class RsiStrategy(Strategy):
    """Buy when RSI drops below `oversold`, sell when it rises above `overbought`.

    Uses Wilder's smoothing for average gains/losses.
    """

    def __init__(self, period: int = 14, oversold: float = 30.0, overbought: float = 70.0):
        if not 0 < oversold < overbought < 100:
            raise ValueError("require 0 < oversold < overbought < 100")
        self.period = period
        self.oversold = oversold
        self.overbought = overbought
        self._prev_close: float | None = None
        self._avg_gain: float | None = None
        self._avg_loss: float | None = None
        self._seed_gains: list[float] = []
        self._seed_losses: list[float] = []

    def on_candle(self, candle: Candle) -> Signal:
        rsi = self._update_rsi(candle.close)
        if rsi is None:
            return Signal.HOLD
        if rsi < self.oversold:
            return Signal.BUY
        if rsi > self.overbought:
            return Signal.SELL
        return Signal.HOLD

    def _update_rsi(self, close: float) -> float | None:
        if self._prev_close is None:
            self._prev_close = close
            return None
        change = close - self._prev_close
        self._prev_close = close
        gain = max(change, 0.0)
        loss = max(-change, 0.0)

        if self._avg_gain is None:
            self._seed_gains.append(gain)
            self._seed_losses.append(loss)
            if len(self._seed_gains) < self.period:
                return None
            self._avg_gain = sum(self._seed_gains) / self.period
            self._avg_loss = sum(self._seed_losses) / self.period
        else:
            self._avg_gain = (self._avg_gain * (self.period - 1) + gain) / self.period
            self._avg_loss = (self._avg_loss * (self.period - 1) + loss) / self.period

        if self._avg_loss == 0:
            return 100.0
        rs = self._avg_gain / self._avg_loss
        return 100.0 - 100.0 / (1.0 + rs)
