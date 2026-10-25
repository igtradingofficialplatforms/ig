# IGtrade starter project

## Run in VS Code (Windows)
1. Extract this ZIP.
2. In VS Code choose File → Open Folder and select `IGtrade-complete`.
3. Open Terminal → New Terminal.
4. Run `npm.cmd install`
5. Run `npm.cmd run dev`
6. Open the local URL printed by Vite (usually http://localhost:5173).

## Main files
- `src/App.jsx` — main app and pages
- `src/App.css` — design and responsive styling
- `src/Admin.jsx` — admin panel UI (local prototype only)
- `src/CustomerService.jsx` — Telegram support banner
- `src/supabase.js` — Supabase configuration placeholder
- `src/app-config.json` — duration/rate/amount settings
- `supabase/schema.sql` — database schema draft

## Trade duration, rate and amount rules

- 30 seconds: 20% rate; amount $20–$10,000.
- 60 seconds: 40% rate; amount $12,000–$30,000.
- 120 seconds: 80% rate; amount $35,000–$99,000.
- These are fixed virtual-account scenarios, not returns derived from live market movement. The same rules are shown and validated in `src/App.jsx` and recorded in `src/app-config.json`.

## Live market data setup
- BTC, ETH and SOL prices plus 1-minute candles use the public Binance Spot WebSocket feed. The UI does not substitute hardcoded prices if that feed is unavailable.
- US stocks (AAPL, NVDA, TSLA), Gold (XAU/USD), Forex (GBP/USD, EUR/USD, USD/JPY), and indices (US 500, US Tech 100, Germany 40, Wall Street) require a Twelve Data API key. Copy `.env.example` to `.env.local`, add your key to `VITE_TWELVEDATA_API_KEY`, then restart Vite. Availability, delays, symbols and rate limits depend on the provider plan; confirm that your plan permits the data use you need. Without a key, those prices remain unavailable rather than displaying invented values.
- A scrolling ticker shows the same connected market quote state used by the market cards. For Twelve Data instruments, the chart candles are built from real incoming price ticks; the percentage is measured since this browser session connected, not a claimed daily change. The fixed 20% / 40% / 80% outcomes are still fixed scenarios, not market-derived returns.
- When the trade timer ends, the app waits for the user to press **Done**. It then records opening price, target price, closing price, timestamps, profit and a candle-chart snapshot. Open Profile → Trades and click a trade row to expand its details.

## Important limitations
The footer includes a © 1998 IGtrade label and links supplied in the request; IGtrade is an independent independent project and is not affiliated with IG Group. This is still a front-end prototype. New member/account balance starts at $0. Admin balances, requests, wallet addresses and settings are currently stored only in browser state, not safely persisted to Supabase. Authentication and real database/RLS/server-side admin permissions are not yet integrated, so this is not ready for multiple real users. Never place Supabase service-role keys in frontend code. Do not send real crypto to placeholder addresses.

When trading is OFF, clicking the trade button shows a clearly labeled loss preview as a preview; no trade is executed and no balance is changed. When ON, the prototype uses the fixed 20% / 40% / 80% fixed scenario rules. These are controlled virtual outcomes, not market-derived returns.

Android APK creation requires Android Studio/SDK and a configured Capacitor Android project; iPhone users can install the PWA from Safari's Share menu → Add to Home Screen.


## Gold / Forex / Stocks / Index candle data

These markets require a Twelve Data API key. Copy `.env.example` to `.env.local`, then set `VITE_TWELVEDATA_API_KEY=your_key_here`. Restart the dev server after changing the env file (`Ctrl+C`, then `npm.cmd run dev`). The app requests up to 60 real 1-minute candles for the selected non-crypto symbol and uses the Twelve Data WebSocket price stream for live updates. Provider plan limits and symbol availability apply; some index symbols may require a paid plan or a provider-specific symbol. If the provider rejects a symbol or key, the app must show unavailable status rather than invent candles.


## Auth and admin access (updated)
- Public pages no longer show an Admin panel button, Admin preview, or the sidebar virtual badge.
- Register and Sign in buttons open a real Supabase Auth form (email/password or phone/password, depending on enabled Supabase providers).
- Admin panel is not linked publicly. Open `/admin` directly; a signed-in account must have `profiles.role = 'admin'` to access it.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, run `supabase/schema.sql` in the Supabase SQL Editor, then promote only your owner account with the SQL comment shown at the bottom of that schema. Never expose a service-role key in the frontend.
- Current market data still requires a valid Twelve Data key and a plan that permits the requested symbols. The app intentionally does not fabricate live stock prices.
- Important: admin controls, requests and balance operations still need their database/RPC persistence wiring before this is production-ready; local prototype state must not be treated as shared account records or real money.
