from .base import Signal, Strategy
from .rsi import RsiStrategy
from .sma_crossover import SmaCrossoverStrategy

STRATEGIES = {
    "sma": SmaCrossoverStrategy,
    "rsi": RsiStrategy,
}

__all__ = ["Signal", "Strategy", "SmaCrossoverStrategy", "RsiStrategy", "STRATEGIES"]
