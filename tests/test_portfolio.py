import unittest

from bot.portfolio import Portfolio
from bot.risk import RiskManager


class TestPortfolio(unittest.TestCase):
    def test_buy_deducts_cash_and_fee(self):
        p = Portfolio(cash=1000.0, fee_rate=0.01)
        trade = p.buy(price=100.0, timestamp=0, fraction=1.0)
        self.assertIsNotNone(trade)
        self.assertEqual(p.cash, 0.0)
        self.assertAlmostEqual(p.position, 990.0 / 100.0)  # 1000 - 1% fee
        self.assertAlmostEqual(trade.fee, 10.0)

    def test_partial_fraction(self):
        p = Portfolio(cash=1000.0, fee_rate=0.0)
        p.buy(price=10.0, timestamp=0, fraction=0.5)
        self.assertAlmostEqual(p.cash, 500.0)
        self.assertAlmostEqual(p.position, 50.0)

    def test_cannot_buy_twice(self):
        p = Portfolio(cash=1000.0)
        self.assertIsNotNone(p.buy(price=10.0, timestamp=0))
        self.assertIsNone(p.buy(price=10.0, timestamp=1))

    def test_sell_all_realizes_value_minus_fee(self):
        p = Portfolio(cash=1000.0, fee_rate=0.0)
        p.buy(price=10.0, timestamp=0, fraction=1.0)
        p.sell_all(price=20.0, timestamp=1)
        self.assertAlmostEqual(p.cash, 2000.0)
        self.assertEqual(p.position, 0.0)
        self.assertIsNone(p.entry_price)

    def test_sell_when_flat_is_noop(self):
        p = Portfolio(cash=1000.0)
        self.assertIsNone(p.sell_all(price=10.0, timestamp=0))
        self.assertEqual(p.trades, [])

    def test_equity(self):
        p = Portfolio(cash=500.0, fee_rate=0.0)
        p.buy(price=10.0, timestamp=0, fraction=0.5)
        self.assertAlmostEqual(p.equity(price=20.0), 250.0 + 25.0 * 20.0)


class TestRiskManager(unittest.TestCase):
    def test_stop_out_triggers_below_threshold(self):
        p = Portfolio(cash=1000.0, fee_rate=0.0)
        p.buy(price=100.0, timestamp=0)
        risk = RiskManager(stop_loss_pct=0.05)
        self.assertFalse(risk.should_stop_out(p, price=96.0))
        self.assertTrue(risk.should_stop_out(p, price=95.0))

    def test_no_stop_out_when_flat(self):
        risk = RiskManager(stop_loss_pct=0.05)
        self.assertFalse(risk.should_stop_out(Portfolio(), price=1.0))


if __name__ == "__main__":
    unittest.main()
