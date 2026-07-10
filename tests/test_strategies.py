import unittest

from bot.strategies import RsiStrategy, Signal, SmaCrossoverStrategy

from tests.helpers import make_candles, sine_prices, trend_prices


class TestSmaCrossover(unittest.TestCase):
    def test_rejects_bad_periods(self):
        with self.assertRaises(ValueError):
            SmaCrossoverStrategy(fast=30, slow=10)

    def test_holds_during_warmup(self):
        strategy = SmaCrossoverStrategy(fast=3, slow=5)
        candles = make_candles(trend_prices(4))
        signals = [strategy.on_candle(c) for c in candles]
        self.assertTrue(all(s is Signal.HOLD for s in signals))

    def test_buy_on_upcross_and_sell_on_downcross(self):
        # Falling then rising then falling prices force both crossovers.
        prices = trend_prices(20, start=100, step=-1) + \
                 trend_prices(20, start=81, step=1) + \
                 trend_prices(20, start=100, step=-1)
        strategy = SmaCrossoverStrategy(fast=3, slow=8)
        signals = [strategy.on_candle(c) for c in make_candles(prices)]
        self.assertIn(Signal.BUY, signals)
        self.assertIn(Signal.SELL, signals)
        # The buy (after the trough) must precede the sell (after the peak).
        self.assertLess(signals.index(Signal.BUY), signals.index(Signal.SELL))


class TestRsi(unittest.TestCase):
    def test_rejects_bad_thresholds(self):
        with self.assertRaises(ValueError):
            RsiStrategy(oversold=70, overbought=30)

    def test_holds_during_warmup(self):
        strategy = RsiStrategy(period=14)
        candles = make_candles(trend_prices(14))
        signals = [strategy.on_candle(c) for c in candles]
        self.assertTrue(all(s is Signal.HOLD for s in signals))

    def test_pure_uptrend_reads_overbought(self):
        strategy = RsiStrategy(period=14)
        candles = make_candles(trend_prices(30, step=1.0))
        last = [strategy.on_candle(c) for c in candles][-1]
        self.assertIs(last, Signal.SELL)

    def test_pure_downtrend_reads_oversold(self):
        strategy = RsiStrategy(period=14)
        candles = make_candles(trend_prices(30, step=-1.0))
        last = [strategy.on_candle(c) for c in candles][-1]
        self.assertIs(last, Signal.BUY)

    def test_oscillating_market_emits_both_signals(self):
        strategy = RsiStrategy(period=5, oversold=35, overbought=65)
        signals = [strategy.on_candle(c) for c in make_candles(sine_prices(300))]
        self.assertIn(Signal.BUY, signals)
        self.assertIn(Signal.SELL, signals)


if __name__ == "__main__":
    unittest.main()
