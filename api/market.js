
export default async function handler(req, res) {
  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { symbol, type } = req.query || {};

  const allowedSymbols = [
    "XAU/USD",
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
    return res.status(400).json({ error: "Unsupported symbol" });
  }

  const endpoint =
    type === "candles"
      ? "time_series"
      : "price";

  const url = new URL(
    `https://api.twelvedata.com/${endpoint}`
  );

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  if (type === "candles") {
    url.searchParams.set("interval", "1min");
    url.searchParams.set("outputsize", "60");
    url.searchParams.set("order", "ASC");
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (
      !response.ok ||
      data.status === "error" ||
      (type === "candles"
        ? !Array.isArray(data.values)
        : !data.price)
    ) {
      return res.status(502).json({
        error: data.message || "Market data unavailable"
      });
    }

    return res.status(200).json(
      type === "candles"
        ? { symbol, values: data.values }
        : { symbol, price: Number(data.price) }
    );
  } catch {
    return res.status(502).json({
      error: "Unable to fetch market data"
    });
  }
}
