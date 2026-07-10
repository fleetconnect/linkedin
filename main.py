#!/usr/bin/env python3
"""CLI for the trading bot: backtest on history, or paper-trade live prices.

Examples:
    python main.py backtest --symbol BTCUSDT --interval 1h --limit 500 --strategy sma
    python main.py backtest --csv data.csv --strategy rsi --period 14
    python main.py paper --symbol BTCUSDT --interval 1m --strategy sma
    python main.py fetch --symbol ETHUSDT --interval 4h --limit 1000 --out eth.csv
"""

from __future__ import annotations

import argparse
import sys

from bot.backtest import run_backtest
from bot.data import fetch_klines, load_csv, save_csv
from bot.paper import run_paper
from bot.portfolio import Portfolio
from bot.risk import RiskManager
from bot.strategies import STRATEGIES, Strategy


def build_strategy(args: argparse.Namespace) -> Strategy:
    if args.strategy == "sma":
        return STRATEGIES["sma"](fast=args.fast, slow=args.slow)
    return STRATEGIES["rsi"](period=args.period, oversold=args.oversold,
                             overbought=args.overbought)


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--strategy", choices=sorted(STRATEGIES), default="sma")
    parser.add_argument("--fast", type=int, default=10, help="fast SMA period")
    parser.add_argument("--slow", type=int, default=30, help="slow SMA period")
    parser.add_argument("--period", type=int, default=14, help="RSI period")
    parser.add_argument("--oversold", type=float, default=30.0)
    parser.add_argument("--overbought", type=float, default=70.0)
    parser.add_argument("--cash", type=float, default=10_000.0, help="starting cash")
    parser.add_argument("--fee", type=float, default=0.001, help="fee rate per trade")
    parser.add_argument("--stop-loss", type=float, default=0.05,
                        help="stop-loss as a fraction below entry (0.05 = 5%%)")
    parser.add_argument("--max-position", type=float, default=0.95,
                        help="max fraction of cash to deploy per entry")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p_bt = sub.add_parser("backtest", help="run a strategy over historical candles")
    p_bt.add_argument("--symbol", default="BTCUSDT")
    p_bt.add_argument("--interval", default="1h")
    p_bt.add_argument("--limit", type=int, default=500)
    p_bt.add_argument("--csv", help="load candles from a CSV instead of Binance")
    add_common_args(p_bt)

    p_paper = sub.add_parser("paper", help="paper-trade against live prices")
    p_paper.add_argument("--symbol", default="BTCUSDT")
    p_paper.add_argument("--interval", default="1m")
    p_paper.add_argument("--poll", type=int, default=60, help="seconds between polls")
    add_common_args(p_paper)

    p_fetch = sub.add_parser("fetch", help="download candles to a CSV")
    p_fetch.add_argument("--symbol", default="BTCUSDT")
    p_fetch.add_argument("--interval", default="1h")
    p_fetch.add_argument("--limit", type=int, default=500)
    p_fetch.add_argument("--out", required=True, help="output CSV path")

    args = parser.parse_args(argv)

    if args.command == "fetch":
        candles = fetch_klines(args.symbol, args.interval, args.limit)
        save_csv(candles, args.out)
        print(f"Saved {len(candles)} candles to {args.out}")
        return 0

    strategy = build_strategy(args)
    portfolio = Portfolio(cash=args.cash, fee_rate=args.fee)
    risk = RiskManager(max_position_fraction=args.max_position,
                       stop_loss_pct=args.stop_loss)

    if args.command == "backtest":
        if args.csv:
            candles = load_csv(args.csv)
        else:
            candles = fetch_klines(args.symbol, args.interval, args.limit)
        if not candles:
            print("No candles to backtest.", file=sys.stderr)
            return 1
        result = run_backtest(strategy, candles, portfolio, risk)
        print(result.summary())
        return 0

    # paper
    run_paper(strategy, args.symbol, args.interval, args.poll, portfolio, risk)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
