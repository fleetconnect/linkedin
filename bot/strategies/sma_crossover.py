from __future__ import annotations

from collections import deque

from ..data import Candle
from .base import Signal, Strategy


class SmaCrossoverStrategy(Strategy):
    """Buy when the fast SMA crosses above the slow SMA, sell on the cross down."""

    def __init__(self, fast: int = 10, slow: int = 30):
        if fast >= slow:
            raise ValueError("fast period must be shorter than slow period")
        self.fast_window: deque[float] = deque(maxlen=fast)
        self.slow_window: deque[float] = deque(maxlen=slow)
        self._prev_diff: float | None = None

    def on_candle(self, candle: Candle) -> Signal:
        self.fast_window.append(candle.close)
        self.slow_window.append(candle.close)
        if len(self.slow_window) < self.slow_window.maxlen:
            return Signal.HOLD

        fast_sma = sum(self.fast_window) / len(self.fast_window)
        slow_sma = sum(self.slow_window) / len(self.slow_window)
        diff = fast_sma - slow_sma

        signal = Signal.HOLD
        if self._prev_diff is not None:
            if self._prev_diff <= 0 < diff:
                signal = Signal.BUY
            elif self._prev_diff >= 0 > diff:
                signal = Signal.SELL
        self._prev_diff = diff
        return signal
