"""Deterministic synthetic candle series for tests."""

from __future__ import annotations

import math

from bot.data import Candle


def make_candles(prices: list[float]) -> list[Candle]:
    return [
        Candle(timestamp=i * 60_000, open=p, high=p, low=p, close=p, volume=1.0)
        for i, p in enumerate(prices)
    ]


def sine_prices(n: int = 300, base: float = 100.0, amplitude: float = 20.0,
                period: int = 50) -> list[float]:
    return [base + amplitude * math.sin(2 * math.pi * i / period) for i in range(n)]


def trend_prices(n: int = 100, start: float = 100.0, step: float = 1.0) -> list[float]:
    return [start + step * i for i in range(n)]
