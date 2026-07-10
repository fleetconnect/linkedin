import unittest

from bot.backtest import run_backtest
from bot.portfolio import Portfolio
from bot.risk import RiskManager
from bot.strategies import SmaCrossoverStrategy

from tests.helpers import make_candles, sine_prices, trend_prices


class TestBacktest(unittest.TestCase):
    def test_sma_profits_on_clean_cycle(self):
        # Down, long up-leg, then down again: crossover should buy low, sell high.
        prices = trend_prices(20, start=100, step=-1) + \
                 trend_prices(60, start=81, step=1) + \
                 trend_prices(20, start=140, step=-1)
        result = run_backtest(
            SmaCrossoverStrategy(fast=3, slow=8),
            make_candles(prices),
            Portfolio(cash=10_000.0, fee_rate=0.001),
            RiskManager(stop_loss_pct=0.5),  # wide stop so the signal drives exits
        )
        self.assertGreater(result.final_equity, result.initial_equity)
        self.assertGreaterEqual(result.num_trades, 2)

    def test_stop_loss_limits_losses(self):
        # Brief up-leg to trigger a buy, then a crash: the stop should exit early.
        prices = trend_prices(20, start=100, step=-1) + \
                 trend_prices(15, start=81, step=1) + \
                 trend_prices(40, start=95, step=-2)
        result = run_backtest(
            SmaCrossoverStrategy(fast=3, slow=8),
            make_candles(prices),
            Portfolio(cash=10_000.0, fee_rate=0.0),
            RiskManager(stop_loss_pct=0.05),
        )
        # Worst case is roughly the 5% stop plus one candle of slippage,
        # far better than riding the crash to the bottom.
        self.assertGreater(result.final_equity, 10_000.0 * 0.90)

    def test_metrics_shape(self):
        result = run_backtest(
            SmaCrossoverStrategy(fast=3, slow=8),
            make_candles(sine_prices(300)),
        )
        self.assertEqual(len(result.equity_curve), 300)
        self.assertGreaterEqual(result.max_drawdown_pct, 0.0)
        if result.win_rate_pct is not None:
            self.assertTrue(0.0 <= result.win_rate_pct <= 100.0)

    def test_empty_candles(self):
        result = run_backtest(SmaCrossoverStrategy(fast=3, slow=8), [])
        self.assertEqual(result.num_trades, 0)
        self.assertEqual(result.total_return_pct, 0.0)


if __name__ == "__main__":
    unittest.main()
