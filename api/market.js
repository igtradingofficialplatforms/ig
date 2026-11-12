export default async function handler(req, res) {
  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API key not configured"
    });
  }

  const {
    symbol,
    type,
    interval = "1m",
    outputsize = "500"
  } = req.query || {};

  const allowedSymbols = [
    "XAU/USD",
    "USDT/USD",
    "AAPL",
    "NVDA",
    "TSLA",
    "GBP/USD",
    "EUR/USD",
    "USD/JPY",
    "SPX",
    "NDX",
    "DAX",
    "DJI"
  ];

  if (!symbol || !allowedSymbols.includes(symbol)) {
    return res.status(400).json({
      error: "Unsupported symbol"
    });
  }

  const intervals = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1h"
  };

  const endpoint = type === "candles"
    ? "time_series"
    : "price";

  if (type === "candles" && !intervals[interval]) {
    return res.status(400).json({
      error: "Unsupported timeframe"
    });
  }

  const requestedSize = Number(outputsize);
  const safeOutputSize = Number.isFinite(requestedSize)
    ? Math.min(500, Math.max(1, Math.floor(requestedSize)))
    : 500;

  const url = new URL(
    `https://api.twelvedata.com/${endpoint}`
  );

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  if (type === "candles") {
    url.searchParams.set("interval", intervals[interval]);
    url.searchParams.set("outputsize", String(safeOutputSize));
    url.searchParams.set("order", "ASC");
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (
      !response.ok ||
      data.status === "error" ||
      (
        type === "candles"
          ? !Array.isArray(data.values)
          : !data.price
      )
    ) {
      return res.status(502).json({
        error: data.message || "Market data unavailable"
      });
    }

    return res.status(200).json(
      type === "candles"
        ? {
            symbol,
            interval,
            values: data.values
          }
        : {
            symbol,
            price: Number(data.price)
          }
    );

  } catch (error) {
    return res.status(502).json({
      error: "Unable to fetch market data"
    });
  }
}