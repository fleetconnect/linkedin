"""Market data: fetch candles from Binance's public API or load from CSV."""

from __future__ import annotations

import csv
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

# binance.com geo-blocks some regions (HTTP 451); binance.us serves the same
# API shape, so we fall through the list until one host answers.
API_HOSTS = [
    "https://api.binance.com/api/v3",
    "https://api.binance.us/api/v3",
]


def _get_json(path: str, params: dict) -> object:
    query = urllib.parse.urlencode(params)
    last_error: Exception | None = None
    for host in API_HOSTS:
        try:
            with urllib.request.urlopen(f"{host}/{path}?{query}", timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code in (451, 403):  # geo-blocked; try the next host
                last_error = e
                continue
            raise
    raise last_error  # every host refused us


@dataclass(frozen=True)
class Candle:
    timestamp: int  # open time, ms since epoch
    open: float
    high: float
    low: float
    close: float
    volume: float


def fetch_klines(symbol: str, interval: str = "1h", limit: int = 500) -> list[Candle]:
    """Fetch OHLCV candles from Binance's public REST API (no API key needed)."""
    raw = _get_json(
        "klines", {"symbol": symbol.upper(), "interval": interval, "limit": limit}
    )
    return [
        Candle(
            timestamp=int(k[0]),
            open=float(k[1]),
            high=float(k[2]),
            low=float(k[3]),
            close=float(k[4]),
            volume=float(k[5]),
        )
        for k in raw
    ]


def fetch_price(symbol: str) -> float:
    """Fetch the latest trade price for a symbol."""
    return float(_get_json("ticker/price", {"symbol": symbol.upper()})["price"])


CSV_FIELDS = ["timestamp", "open", "high", "low", "close", "volume"]


def save_csv(candles: list[Candle], path: str) -> None:
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(CSV_FIELDS)
        for c in candles:
            writer.writerow([c.timestamp, c.open, c.high, c.low, c.close, c.volume])


def load_csv(path: str) -> list[Candle]:
    candles = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            candles.append(
                Candle(
                    timestamp=int(row["timestamp"]),
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=float(row["volume"]),
                )
            )
    return candles
