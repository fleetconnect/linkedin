from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum

from ..data import Candle


class Signal(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class Strategy(ABC):
    """A strategy consumes candles one at a time and emits trade signals.

    Implementations keep whatever internal state they need (rolling windows,
    indicator values) and must be fed candles in chronological order.
    """

    @abstractmethod
    def on_candle(self, candle: Candle) -> Signal:
        raise NotImplementedError
