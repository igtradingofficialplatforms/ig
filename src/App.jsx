
import {
  SiBitcoin,
  SiEthereum,
  SiSolana,
  SiApple,
  SiNvidia,
  SiTesla
} from "react-icons/si";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './consoleWelcome.js';
import countryToCurrency from 'country-to-currency';
import AdminPanel from './Admin.jsx'
import CustomerService from './CustomerService.jsx'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, isSupabaseConfigured } from './supabase.js'
import MyProfile from './assets/MyProfile.jsx'

const emailParts = [
  'j***5','a***8','m***3','r***7','s***2','d***9','k***4','n***6','t***1','p***14','fa***47','ale***87','gr***59',
  'b***8','h***3','w***7','f***2','c***9','l***4','v***6','e***1','g***55','z***8',
  'ja***12','mi***24','ro***36','sa***48','da***51','ke***63','ni***75','to***87','pa***19','br***21',
  'ha***32','wi***43','fr***54','ch***65','li***76','vi***82','el***93','gr***14','zo***25','al***37',
  'ma***49','jo***52','an***64','ri***73','so***85','lu***96','am***18','be***29','ca***31','em***42'
];

const emailDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

const demoWithdrawals = emailDomains.flatMap(domain =>
  emailParts.map((part, index) => ({
    id: `${domain}-${index}`,
    email: `${part}@${domain}`,
    amount: Math.floor(Math.random() * (83010 - 250 + 1)) + 250
  }))
);

function WithdrawalTicker() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % demoWithdrawals.length);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const item = demoWithdrawals[current];

  return (
    <div className="withdraw-activity">
      <div className="withdraw-activity-label">WITHDRAWAL ACTIVITY</div>
      <div className="withdraw-activity-item" key={item.id}>
        <div className="withdraw-activity-email">{item.email}</div>
        <div className="withdraw-activity-status">Withdraw Successfully</div>
        <div className="withdraw-activity-amount">
          -{item.amount.toLocaleString('en-US')} USDT
        </div>
      </div>
    </div>
  );
}

const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  : null


async function trackActivity(eventType, pagePath = null) {
  try {
    if (!supabase) return;

    const {
      data: { user },
      error: sessionError
    } = await supabase.auth.getUser();

    if (sessionError || !user) return;

    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        event_type: eventType,
        page_path: pagePath
      });

    
if (error) {
  console.error('Activity tracking failed:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
} else {
  console.log('Activity saved successfully');
}

  } catch (error) {
    console.error('Activity tracking error:', error);
  }
}

async function uploadDepositProof(file, userId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!file) throw new Error('Please attach a deposit screenshot.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use a JPG, PNG, or WebP screenshot.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Screenshot must be 5 MB or smaller.')
  }

  const extension = file.type === 'image/png'
    ? 'png'
    : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('deposit-proofs')
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw error
  return path
}

const marketDefinitions = [
  { symbol: 'BTC', pair: 'BTCUSDT', name: 'Bitcoin', kind: 'Crypto', provider: 'Binance' },
  { symbol: 'ETH', pair: 'ETHUSDT', name: 'Ethereum', kind: 'Crypto', provider: 'Binance' },
  { symbol: 'SOL', pair: 'SOLUSDT', name: 'Solana', kind: 'Crypto', provider: 'Binance' },
  { symbol: 'XAU', pair: 'XAU/USD', name: 'Gold', kind: 'Commodity', provider: 'Twelve Data' },
  { symbol: 'AAPL', pair: 'AAPL', name: 'Apple Inc.', kind: 'Stock', provider: 'Twelve Data' },
  { symbol: 'NVDA', pair: 'NVDA', name: 'NVIDIA', kind: 'Stock', provider: 'Twelve Data' },
  { symbol: 'TSLA', pair: 'TSLA', name: 'Tesla', kind: 'Stock', provider: 'Twelve Data' },
  { symbol: 'GBPUSD', pair: 'GBP/USD', name: 'GBP/USD', kind: 'Forex', provider: 'Twelve Data' },
  { symbol: 'EURUSD', pair: 'EUR/USD', name: 'EUR/USD', kind: 'Forex', provider: 'Twelve Data' },
  { symbol: 'USDJPY', pair: 'USD/JPY', name: 'USD/JPY', kind: 'Forex', provider: 'Twelve Data' },
  { symbol: 'SPX', pair: 'SPX', name: 'US 500', kind: 'Index', provider: 'Twelve Data' },
  { symbol: 'NDX', pair: 'NDX', name: 'US Tech 100', kind: 'Index', provider: 'Twelve Data' },
  { symbol: 'DAX', pair: 'DAX', name: 'Germany 40', kind: 'Index', provider: 'Twelve Data' },
  { symbol: 'DJI', pair: 'DJI', name: 'Wall Street', kind: 'Index', provider: 'Twelve Data' },
]
// Names and order are taken from the supplied Top 200 list; prices are never taken from that snapshot.
const requestedCryptoAssets = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether USDt" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "USDC", name: "USDC" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "HYPE", name: "Hyperliquid" },
  { symbol: "ZEC", name: "Zcash" },
  { symbol: "XMR", name: "Monero" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "LEO", name: "UNUS SED LEO" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "USDE", name: "Ethena USDe" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "DAI", name: "Dai" },
  { symbol: "NEAR", name: "NEAR Protocol" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "CC", name: "Canton" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "GRAM", name: "Gram (prev. Toncoin)" },
  { symbol: "USD1", name: "World Liberty Financial USD" },
  { symbol: "SUI", name: "Sui" },
  { symbol: "XAUT", name: "Tether Gold" },
  { symbol: "RLUSD", name: "Ripple USD" },
  { symbol: "USDG", name: "Global Dollar" },
  { symbol: "HBAR", name: "Hedera" },
  { symbol: "PYUSD", name: "PayPal USD" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "CRO", name: "Cronos" },
  { symbol: "TAO", name: "Bittensor" },
  { symbol: "QNT", name: "Quant" },
  { symbol: "OKB", name: "OKB" },
  { symbol: "PAXG", name: "PAX Gold" },
  { symbol: "AAVE", name: "Aave" },
  { symbol: "PEPE", name: "Pepe" },
  { symbol: "ENA", name: "Ethena" },
  { symbol: "ASTER", name: "Aster" },
  { symbol: "ONDO", name: "Ondo" },
  { symbol: "WLFI", name: "World Liberty Financial" },
  { symbol: "USDD", name: "USDD" },
  { symbol: "ICP", name: "Internet Computer" },
  { symbol: "PUMP", name: "Pump.fun" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MNT", name: "Mantle" },
  { symbol: "SKY", name: "Sky" },
  { symbol: "JST", name: "JUST" },
  { symbol: "BGB", name: "Bitget Token" },
  { symbol: "WLD", name: "Worldcoin" },
  { symbol: "MORPHO", name: "Morpho" },
  { symbol: "VVV", name: "Venice Token" },
  { symbol: "ETC", name: "Ethereum Classic" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "KCS", name: "KuCoin Token" },
  { symbol: "POL", name: "Polygon (prev. MATIC)" },
  { symbol: "JUP", name: "Jupiter" },
  { symbol: "GT", name: "GateToken" },
  { symbol: "RENDER", name: "Render" },
  { symbol: "NIGHT", name: "Midnight" },
  { symbol: "KAS", name: "Kaspa" },
  { symbol: "ALGO", name: "Algorand" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "PI", name: "Pi" },
  { symbol: "INJ", name: "Injective" },
  { symbol: "LIT", name: "Lighter" },
  { symbol: "XDC", name: "XDC Network" },
  { symbol: "PIEVERSE", name: "Pieverse" },
  { symbol: "ZRO", name: "LayerZero" },
  { symbol: "FIL", name: "Filecoin" },
  { symbol: "CAKE", name: "PancakeSwap" },
  { symbol: "TUSD", name: "TrueUSD" },
  { symbol: "STX", name: "Stacks" },
  { symbol: "DASH", name: "Dash" },
  { symbol: "ETHFI", name: "ether.fi" },
  { symbol: "AERO", name: "Aero" },
  { symbol: "STABLE", name: "Stable" },
  { symbol: "EURC", name: "EURC" },
  { symbol: "NEXO", name: "Nexo" },
  { symbol: "FLR", name: "Flare" },
  { symbol: "VET", name: "VeChain" },
  { symbol: "PYTH", name: "Pyth Network" },
  { symbol: "APT", name: "Aptos" },
  { symbol: "RAY", name: "Raydium" },
  { symbol: "KITE", name: "Kite" },
  { symbol: "FF", name: "Falcon Finance" },
  { symbol: "TIA", name: "Celestia" },
  { symbol: "CRV", name: "Curve DAO Token" },
  { symbol: "FET", name: "Artificial Superintelligence Alliance" },
  { symbol: "PENGU", name: "Pudgy Penguins" },
  { symbol: "SEI", name: "Sei" },
  { symbol: "BTT", name: "BitTorrent [New]" },
  { symbol: "BSV", name: "Bitcoin SV" },
  { symbol: "VIRTUAL", name: "Virtuals Protocol" },
  { symbol: "SUN", name: "Sun [New]" },
  { symbol: "SPX", name: "SPX6900" },
  { symbol: "FDUSD", name: "First Digital USD" },
  { symbol: "STRK", name: "Starknet" },
  { symbol: "TRUMP", name: "OFFICIAL TRUMP" },
  { symbol: "PENDLE", name: "Pendle" },
  { symbol: "GNO", name: "Gnosis" },
  { symbol: "XTZ", name: "Tezos" },
  { symbol: "LDO", name: "Lido DAO" },
  { symbol: "XPL", name: "Plasma" },
  { symbol: "BONK", name: "Bonk" },
  { symbol: "BEAM", name: "Beam" },
  { symbol: "LUNC", name: "Terra Classic" },
  { symbol: "IMX", name: "Immutable" },
  { symbol: "KAIA", name: "Kaia" },
  { symbol: "NFT", name: "AINFT" },
  { symbol: "GRT", name: "The Graph" },
  { symbol: "OP", name: "Optimism" },
  { symbol: "DCR", name: "Decred" },
  { symbol: "CFX", name: "Conflux" },
  { symbol: "COMP", name: "Compound" },
  { symbol: "MON", name: "Monad" },
  { symbol: "FLOKI", name: "FLOKI" },
  { symbol: "ZBCN", name: "Zebec Network" },
  { symbol: "RUNE", name: "THORChain" },
  { symbol: "KMNO", name: "Kamino" },
  { symbol: "ENS", name: "Ethereum Name Service" },
  { symbol: "JASMY", name: "JasmyCoin" },
  { symbol: "AR", name: "Arweave" },
  { symbol: "CAP", name: "Cap" },
  { symbol: "TWT", name: "Trust Wallet Token" },
  { symbol: "IOTA", name: "IOTA" },
  { symbol: "MET", name: "Meteora" },
  { symbol: "FLUID", name: "Fluid" },
  { symbol: "TRAC", name: "OriginTrail" },
  { symbol: "AKT", name: "Akash Network" },
  { symbol: "JTO", name: "Jito" },
  { symbol: "SOON", name: "SOON" },
  { symbol: "BAT", name: "Basic Attention Token" },
  { symbol: "ZAMA", name: "Zama" },
  { symbol: "CVX", name: "Convex Finance" },
  { symbol: "TEL", name: "Telcoin" },
  { symbol: "GOMINING", name: "GoМining" },
  { symbol: "EIGEN", name: "EigenCloud" },
  { symbol: "WIF", name: "dogwifhat" },
  { symbol: "THETA", name: "Theta Network" },
  { symbol: "MX", name: "MX Token" },
  { symbol: "SYRUP", name: "Maple Finance" },
  { symbol: "SENT", name: "Sentient" },
  { symbol: "XCN", name: "Onyxcoin" },
  { symbol: "MANA", name: "Decentraland" },
  { symbol: "AXS", name: "Axie Infinity" },
  { symbol: "VSN", name: "Vision" },
  { symbol: "NEO", name: "Neo" },
  { symbol: "AWE", name: "AWE" },
  { symbol: "XEC", name: "eCash" },
  { symbol: "SAND", name: "The Sandbox" },
  { symbol: "CHZ", name: "Chiliz" },
  { symbol: "EDGE", name: "edgeX" },
  { symbol: "AIOZ", name: "AIOZ Network" },
  { symbol: "GEOD", name: "GEODNET" },
  { symbol: "GRASS", name: "Grass" },
  { symbol: "1INCH", name: "1inch" },
  { symbol: "USELESS", name: "Useless Coin" },
  { symbol: "PROM", name: "Prom" },
  { symbol: "FARTCOIN", name: "Fartcoin" },
  { symbol: "DEXE", name: "DeXe" },
  { symbol: "GENIUS", name: "Genius Terminal" },
  { symbol: "GLM", name: "Golem" },
  { symbol: "ZK", name: "ZKsync" },
  { symbol: "SFP", name: "SafePal" },
  { symbol: "SUPER", name: "SuperVerse" },
  { symbol: "PLUME", name: "Plume" },
  { symbol: "RSR", name: "Reserve Rights" },
  { symbol: "ATH", name: "Aethir" },
  { symbol: "PONS", name: "Pons" },
  { symbol: "EGLD", name: "MultiversX" },
  { symbol: "APE", name: "ApeCoin" },
  { symbol: "GMX", name: "GMX" },
  { symbol: "ZEN", name: "Horizen" },
  { symbol: "0G", name: "0G" },
  { symbol: "DEEP", name: "DeepBook Protocol" },
  { symbol: "DOG", name: "Dog (Bitcoin)" },
  { symbol: "ORCA", name: "Orca" },
  { symbol: "GALA", name: "Gala" },
  { symbol: "QTUM", name: "Qtum" },
  { symbol: "ZRX", name: "0x Protocol" },
  { symbol: "DYDX", name: "dYdX" },
  { symbol: "FTT", name: "FTX Token" },
  { symbol: "FORM", name: "Four" },
  { symbol: "WAL", name: "Walrus" },
  { symbol: "PEAQ", name: "peaq" },
  { symbol: "GAS", name: "Gas" },
  { symbol: "RED", name: "RedStone" },
  { symbol: "YFI", name: "Yearn" },
  { symbol: "MINA", name: "Mina" }
]
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quotePrice = (n, symbol) => {
  if (n == null || !Number.isFinite(Number(n))) return 'Waiting for live feed'
  const digits = ['GBPUSD', 'EURUSD', 'USDJPY'].includes(symbol) ? 5 : Number(n) < 1 ? 5 : 2
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function Logo() {
  return <div className="brand"><span className="ig-square-logo">IG</span><span><span className="brand-ig-red">IG</span><span className="brand-gold">trade</span></span></div>
}

function Candles({
  compact = false,
  progress = 0,
  candles = [],
  targetPrice = null,
  entryPrice = null,
  tradeSecondsLeft = null,
  tradeDuration = 0,
  currentPrice = null,
  timeframe = '1m',
  onTimeframeChange = () => {}
}) {
  const [selectedCandle, setSelectedCandle] = useState(null)

  const width = Math.max(1, candles.length) * 12

  const values = [
    ...candles.flatMap(c => [c.high, c.low]),
    ...(targetPrice == null ? [] : [targetPrice]),
    ...(entryPrice == null ? [] : [entryPrice]),
    ...(currentPrice == null ? [] : [currentPrice])
  ].filter(v => Number.isFinite(Number(v)))

  const rawMax = values.length ? Math.max(...values) : 1
  const rawMin = values.length ? Math.min(...values) : 0
  const padding = Math.max((rawMax - rawMin) * 0.08, 0.01)
  const max = rawMax + padding
  const min = rawMin - padding
  const span = Math.max(max - min, 0.000001)

  const y = value => 94 - ((Number(value) - min) / span) * 82

  const isSimulatedGold = candles.some(c => c.simulated)

  const elapsedPercent =
    tradeDuration > 0 && tradeSecondsLeft != null
      ? Math.min(
          100,
          Math.max(
            0,
            ((tradeDuration - tradeSecondsLeft) / tradeDuration) * 100
          )
        )
      : 0

  const timerText =
    tradeSecondsLeft == null
      ? ''
      : `${String(Math.floor(tradeSecondsLeft / 60)).padStart(2, '0')}:${String(tradeSecondsLeft % 60).padStart(2, '0')}`

  const priceLabels = Array.from(
    { length: 5 },
    (_, i) => max - (span * i / 4)
  )

  const formatPrice = value => {
    const digits = Number(value) < 1 ? 5 : 2
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
  }

  const formatCandleTime = value => {
    if (!value) return 'Time unavailable'

    const date = new Date(Number(value))

    if (Number.isNaN(date.getTime())) return 'Time unavailable'

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!candles.length) {
    return (
      <div className={`chart ${compact ? 'chart-compact' : ''} chart-empty`}>
        <div className="empty-state">
          <strong>Waiting for candle data</strong>
          <p>Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`chart ${compact ? 'chart-compact' : ''}`}>

      {/* Chart timeframe controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 5,
        padding: '9px 10px',
        background: '#11100d',
        borderBottom: '1px solid #383126',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          gap: 5,
          flexWrap: 'wrap'
        }}>
          {['1m', '5m', '15m', '30m', '1h'].map(item => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onTimeframeChange(item)
                setSelectedCandle(null)
              }}
              style={{
                border: '1px solid',
                borderColor: timeframe === item ? '#d8b66d' : '#383126',
                background: timeframe === item ? '#3a2d16' : '#191713',
                color: timeframe === item ? '#f5d58a' : '#aaa08a',
                borderRadius: 5,
                padding: '5px 9px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <span style={{
          color: isSimulatedGold ? '#e4bd69' : '#70c99a',
          fontSize: 10,
          fontWeight: 700
        }}>
          {isSimulatedGold ? '' : 'MARKET DATA'}
        </span>
      </div>

      {/* Trade timer */}
      {tradeSecondsLeft != null && tradeDuration > 0 && (
        <div style={{
          padding: '10px 12px',
          background: '#17140e',
          borderBottom: '1px solid #3a3020'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span style={{
              color: '#d8b66d',
              fontSize: 11,
              fontWeight: 700
            }}>
              TRADE · {tradeSecondsLeft === 0 ? 'TIME COMPLETE' : 'TIME REMAINING'}
            </span>

            <strong style={{
              color: '#f5d58a',
              fontSize: 20,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {timerText}
            </strong>
          </div>

          <div style={{
            height: 5,
            background: '#383126',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${elapsedPercent}%`,
              background: 'linear-gradient(90deg, #9b742c, #f5d58a)',
              borderRadius: 10,
              transition: 'width 0.8s linear'
            }} />
          </div>
        </div>
      )}

      {/* Selected candle OHLC information */}
      {selectedCandle && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 14px',
          padding: '10px 12px',
          background: '#17140e',
          borderBottom: '1px solid #383126',
          fontSize: 11
        }}>
          <div style={{ width: '100%', color: '#d8b66d' }}>
            {formatCandleTime(selectedCandle.time)}
          </div>

          <span style={{ color: '#aaa08a' }}>
            O: <strong style={{ color: '#fff' }}>
              {formatPrice(selectedCandle.open)}
            </strong>
          </span>

          <span style={{ color: '#aaa08a' }}>
            H: <strong style={{ color: '#70c99a' }}>
              {formatPrice(selectedCandle.high)}
            </strong>
          </span>

          <span style={{ color: '#aaa08a' }}>
            L: <strong style={{ color: '#ef7777' }}>
              {formatPrice(selectedCandle.low)}
            </strong>
          </span>

          <span style={{ color: '#aaa08a' }}>
            C: <strong style={{ color: '#fff' }}>
              {formatPrice(selectedCandle.close)}
            </strong>
          </span>
        </div>
      )}

      <div style={{
        display: 'flex',
        width: '100%',
        minWidth: 0
      }}>

        {/* Candlestick chart */}
        <div style={{
          flex: 1,
          minWidth: 0,
          position: 'relative'
        }}>
          <div className="chart-grid">
            <i /><i /><i /><i />
          </div>

          <svg
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Interactive market candlestick chart"
            style={{
              display: 'block',
              width: '100%',
              height: compact ? 110 : 260,
              touchAction: 'pan-y'
            }}
          >
            {candles.map((c, i) => {
              const x = i * 12 + 3
              const top = y(Math.max(c.open, c.close))
              const bottom = y(Math.min(c.open, c.close))
              const selected = selectedCandle?.time === c.time

              return (
                <g
                  key={c.time}
                  className={c.up ? 'candle-up' : 'candle-down'}
                  onClick={() => setSelectedCandle(c)}
                  style={{ cursor: 'pointer' }}
                >
                  {selected && (
                    <rect
                      x={x - 2}
                      y="1"
                      width="10"
                      height="98"
                      fill="#d8b66d"
                      opacity=".10"
                    />
                  )}

                  <line
                    x1={x + 3}
                    x2={x + 3}
                    y1={y(c.high)}
                    y2={y(c.low)}
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />

                  <rect
                    x={x}
                    y={top}
                    width="6"
                    height={Math.max(1.5, bottom - top)}
                    rx="1"
                    fill="currentColor"
                  />

                  <rect
                    x={x - 2}
                    y={Math.min(y(c.high), top) - 2}
                    width="10"
                    height={Math.max(8, Math.abs(y(c.low) - y(c.high)) + 4)}
                    fill="transparent"
                  />
                </g>
              )
            })}

            {currentPrice != null && (
              <line
                x1="0"
                x2={width}
                y1={y(currentPrice)}
                y2={y(currentPrice)}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
            )}

            {entryPrice != null && (
              <g>
                <line
                  x1="0"
                  x2={width}
                  y1={y(entryPrice)}
                  y2={y(entryPrice)}
                  stroke="#65b8ff"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x="4"
                  y={Math.max(8, y(entryPrice) - 3)}
                  fill="#65b8ff"
                  fontSize="5"
                >
                  ENTRY
                </text>
              </g>
            )}

            {targetPrice != null && (
              <g>
                <line
                  x1="0"
                  x2={width}
                  y1={y(targetPrice)}
                  y2={y(targetPrice)}
                  stroke="#d8b66d"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x="4"
                  y={Math.max(8, y(targetPrice) - 3)}
                  fill="#d8b66d"
                  fontSize="5"
                >
                  TARGET
                </text>
              </g>
            )}

            {progress > 0 && (
              <line
                x1="0"
                x2={width}
                y1={35 + (progress % 18)}
                y2={35 + (progress % 18)}
                stroke="#d6b56d"
                strokeDasharray="4 3"
                opacity=".8"
              />
            )}
          </svg>
        </div>

        {/* Right-side price scale */}
        <div style={{
          width: 68,
          minWidth: 68,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '8px 5px',
          borderLeft: '1px solid #383126',
          background: '#11100d',
          boxSizing: 'border-box'
        }}>
          {priceLabels.map((value, i) => (
            <span
              key={i}
              style={{
                color: '#c5b990',
                fontSize: 10,
                textAlign: 'right',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formatPrice(value)}
            </span>
          ))}

          {currentPrice != null && (
            <strong style={{
              color: '#fff',
              background: '#287b55',
              padding: '4px 2px',
              borderRadius: 3,
              textAlign: 'center',
              fontSize: 10,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatPrice(currentPrice)}
            </strong>
          )}
        </div>
      </div>

      <div className="chart-labels">
        <span>{formatCandleTime(candles[0]?.time)}</span>
        <span>{isSimulatedGold ? 'XAU/USD · LIVE' : 'MARKET'}</span>
        <span>Now</span>
      </div>
    </div>
  )
}
const languageOptions = [
  ['en', 'English'], ['bn', 'বাংলা'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['ur', 'اردو'], ['zh', '中文'], ['es', 'Español'], ['fr', 'Français'], ['pt', 'Português'], ['ru', 'Русский'], ['tr', 'Türkçe']
]
const countryCallingCodes = [
  ['US', 'United States', '+1'], ['CA', 'Canada', '+1'], ['GB', 'United Kingdom', '+44'], ['BD', 'Bangladesh', '+880'], ['IN', 'India', '+91'], ['PK', 'Pakistan', '+92'], ['NP', 'Nepal', '+977'], ['LK', 'Sri Lanka', '+94'], ['AE', 'United Arab Emirates', '+971'], ['SA', 'Saudi Arabia', '+966'], ['QA', 'Qatar', '+974'], ['KW', 'Kuwait', '+965'], ['OM', 'Oman', '+968'], ['BH', 'Bahrain', '+973'], ['MY', 'Malaysia', '+60'], ['SG', 'Singapore', '+65'], ['TH', 'Thailand', '+66'], ['ID', 'Indonesia', '+62'], ['PH', 'Philippines', '+63'], ['VN', 'Vietnam', '+84'], ['CN', 'China', '+86'], ['JP', 'Japan', '+81'], ['KR', 'South Korea', '+82'], ['AU', 'Australia', '+61'], ['NZ', 'New Zealand', '+64'], ['DE', 'Germany', '+49'], ['FR', 'France', '+33'], ['IT', 'Italy', '+39'], ['ES', 'Spain', '+34'], ['PT', 'Portugal', '+351'], ['NL', 'Netherlands', '+31'], ['BE', 'Belgium', '+32'], ['CH', 'Switzerland', '+41'], ['AT', 'Austria', '+43'], ['SE', 'Sweden', '+46'], ['NO', 'Norway', '+47'], ['DK', 'Denmark', '+45'], ['FI', 'Finland', '+358'], ['IE', 'Ireland', '+353'], ['GR', 'Greece', '+30'], ['TR', 'Türkiye', '+90'], ['RU', 'Russia', '+7'], ['UA', 'Ukraine', '+380'], ['PL', 'Poland', '+48'], ['CZ', 'Czechia', '+420'], ['RO', 'Romania', '+40'], ['HU', 'Hungary', '+36'], ['ZA', 'South Africa', '+27'], ['NG', 'Nigeria', '+234'], ['KE', 'Kenya', '+254'], ['EG', 'Egypt', '+20'], ['MA', 'Morocco', '+212'], ['GH', 'Ghana', '+233'], ['BR', 'Brazil', '+55'], ['MX', 'Mexico', '+52'], ['AR', 'Argentina', '+54'], ['CL', 'Chile', '+56'], ['CO', 'Colombia', '+57'], ['PE', 'Peru', '+51'], ['IL', 'Israel', '+972'], ['IR', 'Iran', '+98'], ['IQ', 'Iraq', '+964'], ['AF', 'Afghanistan', '+93'], ['MM', 'Myanmar', '+95'], ['KH', 'Cambodia', '+855'], ['LA', 'Laos', '+856'], ['ET', 'Ethiopia', '+251'], ['TZ', 'Tanzania', '+255'], ['UG', 'Uganda', '+256'], ['ZM', 'Zambia', '+260'], ['ZW', 'Zimbabwe', '+263'], ['FJ', 'Fiji', '+679'], ['IS', 'Iceland', '+354'], ['LU', 'Luxembourg', '+352'], ['MT', 'Malta', '+356'], ['CY', 'Cyprus', '+357'], ['HR', 'Croatia', '+385'], ['BG', 'Bulgaria', '+359'], ['RS', 'Serbia', '+381'], ['SK', 'Slovakia', '+421'], ['SI', 'Slovenia', '+386'], ['LT', 'Lithuania', '+370'], ['LV', 'Latvia', '+371'], ['EE', 'Estonia', '+372']
]
const uiTranslations = {
  bn: { Home: 'হোম', Trade: 'ট্রেড', Deposit: 'ডিপোজিট', Withdraw: 'উত্তোলন', Profile: 'প্রোফাইল', 'Sign in': 'লগইন', Register: 'নিবন্ধন', 'Install App': 'অ্যাপ ইনস্টল', 'WORKSPACE': 'কাজের স্থান', 'Email or phone': 'ইমেইল অথবা ফোন নম্বর', 'Full name': 'পূর্ণ নাম', Password: 'পাসওয়ার্ড', 'Confirm password': 'পাসওয়ার্ড নিশ্চিত করুন', 'Create account': 'অ্যাকাউন্ট তৈরি করুন', Continue: 'চালিয়ে যান', 'Select language': 'ভাষা নির্বাচন', 'Phone number': 'ফোন নম্বর', 'Country code': 'দেশের কোড', 'Available funds': 'উপলব্ধ ব্যালেন্স', 'Account balance': 'অ্যাকাউন্ট ব্যালেন্স', 'Deposit request': 'ডিপোজিট অনুরোধ', Trades: 'ট্রেডসমূহ', Deposits: 'ডিপোজিটসমূহ', Withdrawals: 'উত্তোলনসমূহ' },
  ar: { Home: 'الرئيسية', Trade: 'تداول', Deposit: 'إيداع', Withdraw: 'سحب', Profile: 'الملف الشخصي', 'Sign in': 'تسجيل الدخول', Register: 'إنشاء حساب', 'Install App': 'تثبيت التطبيق', WORKSPACE: 'مساحة العمل', 'Email or phone': 'البريد الإلكتروني أو رقم الهاتف', 'Full name': 'الاسم الكامل', Password: 'كلمة المرور', 'Confirm password': 'تأكيد كلمة المرور', 'Create account': 'إنشاء الحساب', Continue: 'متابعة', 'Select language': 'اختر اللغة', 'Phone number': 'رقم الهاتف', 'Country code': 'رمز الدولة', 'Available funds': 'الرصيد المتاح', 'Account balance': 'رصيد الحساب', 'Deposit request': 'طلب إيداع', Trades: 'التداولات', Deposits: 'الإيداعات', Withdrawals: 'عمليات السحب' },
  hi: { Home: 'होम', Trade: 'ट्रेड', Deposit: 'जमा', Withdraw: 'निकासी', Profile: 'प्रोफ़ाइल', 'Sign in': 'साइन इन', Register: 'रजिस्टर', 'Install App': 'ऐप इंस्टॉल', 'Email or phone': 'ईमेल या फ़ोन नंबर', 'Full name': 'पूरा नाम', Password: 'पासवर्ड', 'Confirm password': 'पासवर्ड की पुष्टि', 'Create account': 'खाता बनाएँ', Continue: 'जारी रखें', 'Select language': 'भाषा चुनें', 'Phone number': 'फ़ोन नंबर', 'Country code': 'देश का कोड', 'Available funds': 'उपलब्ध बैलेंस', 'Account balance': 'खाता बैलेंस', 'Deposit request': 'जमा अनुरोध', Trades: 'ट्रेड', Deposits: 'जमा', Withdrawals: 'निकासी' },
  ur: { Home: 'ہوم', Trade: 'ٹریڈ', Deposit: 'ڈپازٹ', Withdraw: 'رقم نکالیں', Profile: 'پروفائل', 'Sign in': 'سائن اِن', Register: 'رجسٹر', 'Install App': 'ایپ انسٹال', 'Email or phone': 'ای میل یا فون نمبر', 'Full name': 'پورا نام', Password: 'پاس ورڈ', 'Confirm password': 'پاس ورڈ کی تصدیق', 'Create account': 'اکاؤنٹ بنائیں', Continue: 'جاری رکھیں', 'Select language': 'زبان منتخب کریں', 'Phone number': 'فون نمبر', 'Country code': 'ملک کا کوڈ', 'Available funds': 'دستیاب بیلنس', 'Account balance': 'اکاؤنٹ بیلنس', 'Deposit request': 'ڈپازٹ کی درخواست', Trades: 'ٹریڈز', Deposits: 'ڈپازٹس', Withdrawals: 'رقم نکالنا' },
  zh: { Home: '首页', Trade: '交易', Deposit: '充值', Withdraw: '提现', Profile: '个人资料', 'Sign in': '登录', Register: '注册', 'Install App': '安装应用', 'Email or phone': '邮箱或电话号码', 'Full name': '姓名', Password: '密码', 'Confirm password': '确认密码', 'Create account': '创建账户', Continue: '继续', 'Select language': '选择语言', 'Phone number': '电话号码', 'Country code': '国家代码', 'Available funds': '可用余额', 'Account balance': '账户余额', 'Deposit request': '充值申请', Trades: '交易记录', Deposits: '充值记录', Withdrawals: '提现记录' },
  es: { Home: 'Inicio', Trade: 'Operar', Deposit: 'Depositar', Withdraw: 'Retirar', Profile: 'Perfil', 'Sign in': 'Iniciar sesión', Register: 'Registrarse', 'Install App': 'Instalar aplicación', 'Email or phone': 'Correo o teléfono', 'Full name': 'Nombre completo', Password: 'Contraseña', 'Confirm password': 'Confirmar contraseña', 'Create account': 'Crear cuenta', Continue: 'Continuar', 'Select language': 'Seleccionar idioma', 'Phone number': 'Número de teléfono', 'Country code': 'Código de país', 'Available funds': 'Saldo disponible', 'Account balance': 'Saldo de la cuenta', 'Deposit request': 'Solicitud de depósito', Trades: 'Operaciones', Deposits: 'Depósitos', Withdrawals: 'Retiros' },
  fr: { Home: 'Accueil', Trade: 'Trader', Deposit: 'Dépôt', Withdraw: 'Retrait', Profile: 'Profil', 'Sign in': 'Connexion', Register: 'Créer un compte', 'Install App': 'Installer l’application', 'Email or phone': 'E-mail ou téléphone', 'Full name': 'Nom complet', Password: 'Mot de passe', 'Confirm password': 'Confirmer le mot de passe', 'Create account': 'Créer un compte', Continue: 'Continuer', 'Select language': 'Choisir la langue', 'Phone number': 'Numéro de téléphone', 'Country code': 'Indicatif du pays', 'Available funds': 'Solde disponible', 'Account balance': 'Solde du compte', 'Deposit request': 'Demande de dépôt', Trades: 'Transactions', Deposits: 'Dépôts', Withdrawals: 'Retraits' },
  pt: { Home: 'Início', Trade: 'Negociar', Deposit: 'Depositar', Withdraw: 'Sacar', Profile: 'Perfil', 'Sign in': 'Entrar', Register: 'Registar', 'Install App': 'Instalar aplicação', 'Email or phone': 'E-mail ou telefone', 'Full name': 'Nome completo', Password: 'Palavra-passe', 'Confirm password': 'Confirmar palavra-passe', 'Create account': 'Criar conta', Continue: 'Continuar', 'Select language': 'Selecionar idioma', 'Phone number': 'Número de telefone', 'Country code': 'Código do país', 'Available funds': 'Saldo disponível', 'Account balance': 'Saldo da conta', 'Deposit request': 'Pedido de depósito', Trades: 'Negociações', Deposits: 'Depósitos', Withdrawals: 'Levantamentos' },
  ru: { Home: 'Главная', Trade: 'Торговля', Deposit: 'Пополнить', Withdraw: 'Вывести', Profile: 'Профиль', 'Sign in': 'Войти', Register: 'Регистрация', 'Install App': 'Установить приложение', 'Email or phone': 'Электронная почта или телефон', 'Full name': 'Полное имя', Password: 'Пароль', 'Confirm password': 'Подтвердите пароль', 'Create account': 'Создать аккаунт', Continue: 'Продолжить', 'Select language': 'Выбрать язык', 'Phone number': 'Номер телефона', 'Country code': 'Код страны', 'Available funds': 'Доступный баланс', 'Account balance': 'Баланс аккаунта', 'Deposit request': 'Заявка на пополнение', Trades: 'Сделки', Deposits: 'Пополнения', Withdrawals: 'Выводы' },
  tr: { Home: 'Ana sayfa', Trade: 'İşlem', Deposit: 'Para yatır', Withdraw: 'Para çek', Profile: 'Profil', 'Sign in': 'Giriş yap', Register: 'Kayıt ol', 'Install App': 'Uygulamayı yükle', 'Email or phone': 'E-posta veya telefon', 'Full name': 'Ad soyad', Password: 'Şifre', 'Confirm password': 'Şifreyi onayla', 'Create account': 'Hesap oluştur', Continue: 'Devam et', 'Select language': 'Dil seçin', 'Phone number': 'Telefon numarası', 'Country code': 'Ülke kodu', 'Available funds': 'Kullanılabilir bakiye', 'Account balance': 'Hesap bakiyesi', 'Deposit request': 'Para yatırma talebi', Trades: 'İşlemler', Deposits: 'Para yatırma', Withdrawals: 'Para çekme' }
}

Object.assign(uiTranslations, {
  en: {
    'Create Your Account': 'Create Your Account',
    'Register or sign in to access IG Trade.': 'Register or sign in to access IG Trade.',
    'Email Address': 'Email Address',
    'Enter your email address': 'Enter your email address',
    'Please enter your valid email address': 'Please enter your valid email address',
    'Full name': 'Full name',
    'Enter your full name': 'Enter your full name',
    Password: 'Password',
    'Enter your password': 'Enter your password',
    'Password must be at least 6 characters': 'Password must be at least 6 characters',
    'Confirm Password': 'Confirm Password',
    'Re-enter your password to confirm': 'Re-enter your password to confirm',
    'Please wait...': 'Please wait...',
    'Create Account': 'Create Account',
    'Sign in to your account': 'Sign in to your account',
    'Enter your registered email and password': 'Enter your registered email and password'
  },
  bn: {
    'Create Your Account': 'আপনার অ্যাকাউন্ট তৈরি করুন',
    'Register or sign in to access IG Trade.': 'IG Trade ব্যবহার করতে নিবন্ধন করুন অথবা লগইন করুন।',
    'Email Address': 'ইমেইল ঠিকানা',
    'Enter your email address': 'আপনার ইমেইল ঠিকানা লিখুন',
    'Please enter your valid email address': 'সঠিক ইমেইল ঠিকানা লিখুন',
    'Full name': 'পূর্ণ নাম',
    'Enter your full name': 'আপনার সম্পূর্ণ নাম লিখুন',
    Password: 'পাসওয়ার্ড',
    'Enter your password': 'আপনার পাসওয়ার্ড লিখুন',
    'Password must be at least 6 characters': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
    'Confirm Password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'Re-enter your password to confirm': 'নিশ্চিত করতে পাসওয়ার্ড আবার লিখুন',
    'Please wait...': 'অপেক্ষা করুন...',
    'Create Account': 'অ্যাকাউন্ট তৈরি করুন',
    'Sign in to your account': 'আপনার অ্যাকাউন্টে লগইন করুন',
    'Enter your registered email and password': 'আপনার নিবন্ধিত ইমেইল ও পাসওয়ার্ড লিখুন'
  },
  ar: {
    'Create Your Account': 'أنشئ حسابك',
    'Register or sign in to access IG Trade.': 'سجّل أو سجّل الدخول للوصول إلى IG Trade.',
    'Email Address': 'البريد الإلكتروني',
    'Enter your email address': 'أدخل بريدك الإلكتروني',
    'Please enter your valid email address': 'يرجى إدخال بريد إلكتروني صحيح',
    'Full name': 'الاسم الكامل',
    'Enter your full name': 'أدخل اسمك الكامل',
    Password: 'كلمة المرور',
    'Enter your password': 'أدخل كلمة المرور',
    'Password must be at least 6 characters': 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
    'Confirm Password': 'تأكيد كلمة المرور',
    'Re-enter your password to confirm': 'أعد إدخال كلمة المرور للتأكيد',
    'Please wait...': 'يرجى الانتظار...',
    'Create Account': 'إنشاء حساب',
    'Sign in to your account': 'سجّل الدخول إلى حسابك',
    'Enter your registered email and password': 'أدخل بريدك الإلكتروني المسجل وكلمة المرور'
  },
  hi: {
    'Create Your Account': 'अपना खाता बनाएँ',
    'Register or sign in to access IG Trade.': 'IG Trade का उपयोग करने के लिए रजिस्टर करें या साइन इन करें।',
    'Email Address': 'ईमेल पता',
    'Enter your email address': 'अपना ईमेल पता दर्ज करें',
    'Please enter your valid email address': 'कृपया सही ईमेल पता दर्ज करें',
    'Full name': 'पूरा नाम',
    'Enter your full name': 'अपना पूरा नाम दर्ज करें',
    Password: 'पासवर्ड',
    'Enter your password': 'अपना पासवर्ड दर्ज करें',
    'Password must be at least 6 characters': 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
    'Confirm Password': 'पासवर्ड की पुष्टि करें',
    'Re-enter your password to confirm': 'पुष्टि के लिए पासवर्ड दोबारा दर्ज करें',
    'Please wait...': 'कृपया प्रतीक्षा करें...',
    'Create Account': 'खाता बनाएँ',
    'Sign in to your account': 'अपने खाते में साइन इन करें',
    'Enter your registered email and password': 'अपना पंजीकृत ईमेल और पासवर्ड दर्ज करें'
  },
  ur: {
    'Create Your Account': 'اپنا اکاؤنٹ بنائیں',
    'Register or sign in to access IG Trade.': 'IG Trade استعمال کرنے کے لیے رجسٹر کریں یا سائن اِن کریں۔',
    'Email Address': 'ای میل ایڈریس',
    'Enter your email address': 'اپنا ای میل ایڈریس درج کریں',
    'Please enter your valid email address': 'براہ کرم درست ای میل ایڈریس درج کریں',
    'Full name': 'پورا نام',
    'Enter your full name': 'اپنا پورا نام درج کریں',
    Password: 'پاس ورڈ',
    'Enter your password': 'اپنا پاس ورڈ درج کریں',
    'Password must be at least 6 characters': 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے',
    'Confirm Password': 'پاس ورڈ کی تصدیق کریں',
    'Re-enter your password to confirm': 'تصدیق کے لیے پاس ورڈ دوبارہ درج کریں',
    'Please wait...': 'براہ کرم انتظار کریں...',
    'Create Account': 'اکاؤنٹ بنائیں',
    'Sign in to your account': 'اپنے اکاؤنٹ میں سائن اِن کریں',
    'Enter your registered email and password': 'اپنا رجسٹرڈ ای میل اور پاس ورڈ درج کریں'
  },
  zh: {
    'Create Your Account': '创建您的账户',
    'Register or sign in to access IG Trade.': '注册或登录以访问 IG Trade。',
    'Email Address': '电子邮箱',
    'Enter your email address': '请输入您的电子邮箱',
    'Please enter your valid email address': '请输入有效的电子邮箱',
    'Full name': '姓名',
    'Enter your full name': '请输入您的全名',
    Password: '密码',
    'Enter your password': '请输入密码',
    'Password must be at least 6 characters': '密码至少需要 6 个字符',
    'Confirm Password': '确认密码',
    'Re-enter your password to confirm': '请再次输入密码以确认',
    'Please wait...': '请稍候...',
    'Create Account': '创建账户',
    'Sign in to your account': '登录您的账户',
    'Enter your registered email and password': '请输入注册邮箱和密码'
  },
  es: {
    'Create Your Account': 'Crea tu cuenta',
    'Register or sign in to access IG Trade.': 'Regístrate o inicia sesión para acceder a IG Trade.',
    'Email Address': 'Correo electrónico',
    'Enter your email address': 'Introduce tu correo electrónico',
    'Please enter your valid email address': 'Introduce un correo electrónico válido',
    'Full name': 'Nombre completo',
    'Enter your full name': 'Introduce tu nombre completo',
    Password: 'Contraseña',
    'Enter your password': 'Introduce tu contraseña',
    'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Confirm Password': 'Confirmar contraseña',
    'Re-enter your password to confirm': 'Vuelve a introducir la contraseña para confirmarla',
    'Please wait...': 'Por favor, espera...',
    'Create Account': 'Crear cuenta',
    'Sign in to your account': 'Inicia sesión en tu cuenta',
    'Enter your registered email and password': 'Introduce tu correo registrado y contraseña'
  },
  fr: {
    'Create Your Account': 'Créez votre compte',
    'Register or sign in to access IG Trade.': 'Inscrivez-vous ou connectez-vous pour accéder à IG Trade.',
    'Email Address': 'Adresse e-mail',
    'Enter your email address': 'Saisissez votre adresse e-mail',
    'Please enter your valid email address': 'Veuillez saisir une adresse e-mail valide',
    'Full name': 'Nom complet',
    'Enter your full name': 'Saisissez votre nom complet',
    Password: 'Mot de passe',
    'Enter your password': 'Saisissez votre mot de passe',
    'Password must be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Confirm Password': 'Confirmer le mot de passe',
    'Re-enter your password to confirm': 'Saisissez à nouveau votre mot de passe pour confirmer',
    'Please wait...': 'Veuillez patienter...',
    'Create Account': 'Créer un compte',
    'Sign in to your account': 'Connectez-vous à votre compte',
    'Enter your registered email and password': 'Saisissez votre e-mail enregistré et votre mot de passe'
  },
  pt: {
    'Create Your Account': 'Crie sua conta',
    'Register or sign in to access IG Trade.': 'Registe-se ou entre para aceder ao IG Trade.',
    'Email Address': 'Endereço de e-mail',
    'Enter your email address': 'Insira o seu endereço de e-mail',
    'Please enter your valid email address': 'Insira um endereço de e-mail válido',
    'Full name': 'Nome completo',
    'Enter your full name': 'Insira o seu nome completo',
    Password: 'Palavra-passe',
    'Enter your password': 'Insira a sua palavra-passe',
    'Password must be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres',
    'Confirm Password': 'Confirmar palavra-passe',
    'Re-enter your password to confirm': 'Insira novamente a palavra-passe para confirmar',
    'Please wait...': 'Aguarde...',
    'Create Account': 'Criar conta',
    'Sign in to your account': 'Entre na sua conta',
    'Enter your registered email and password': 'Insira o seu e-mail registado e a palavra-passe'
  },
  ru: {
    'Create Your Account': 'Создайте аккаунт',
    'Register or sign in to access IG Trade.': 'Зарегистрируйтесь или войдите, чтобы получить доступ к IG Trade.',
    'Email Address': 'Электронная почта',
    'Enter your email address': 'Введите адрес электронной почты',
    'Please enter your valid email address': 'Введите действительный адрес электронной почты',
    'Full name': 'Полное имя',
    'Enter your full name': 'Введите своё полное имя',
    Password: 'Пароль',
    'Enter your password': 'Введите пароль',
    'Password must be at least 6 characters': 'Пароль должен содержать не менее 6 символов',
    'Confirm Password': 'Подтвердите пароль',
    'Re-enter your password to confirm': 'Введите пароль ещё раз для подтверждения',
    'Please wait...': 'Пожалуйста, подождите...',
    'Create Account': 'Создать аккаунт',
    'Sign in to your account': 'Войдите в свой аккаунт',
    'Enter your registered email and password': 'Введите зарегистрированную почту и пароль'
  },
  tr: {
    'Create Your Account': 'Hesabınızı Oluşturun',
    'Register or sign in to access IG Trade.': 'IG Trade’e erişmek için kayıt olun veya giriş yapın.',
    'Email Address': 'E-posta adresi',
    'Enter your email address': 'E-posta adresinizi girin',
    'Please enter your valid email address': 'Lütfen geçerli bir e-posta adresi girin',
    'Full name': 'Ad soyad',
    'Enter your full name': 'Adınızı ve soyadınızı girin',
    Password: 'Şifre',
    'Enter your password': 'Şifrenizi girin',
    'Password must be at least 6 characters': 'Şifre en az 6 karakter olmalıdır',
    'Confirm Password': 'Şifreyi onayla',
    'Re-enter your password to confirm': 'Onaylamak için şifrenizi tekrar girin',
    'Please wait...': 'Lütfen bekleyin...',
    'Create Account': 'Hesap oluştur',
    'Sign in to your account': 'Hesabınıza giriş yapın',
    'Enter your registered email and password': 'Kayıtlı e-posta adresinizi ve şifrenizi girin'
  }

})
const authButtonTranslations = {
  en: {
    Register: 'Register',
    'Sign in': 'Sign in',
    'Create Account': 'Create Account'
  },
  bn: {
    Register: 'নিবন্ধন',
    'Sign in': 'সাইন ইন',
    'Create Account': 'অ্যাকাউন্ট তৈরি করুন'
  },
  ar: {
    Register: 'التسجيل',
    'Sign in': 'تسجيل الدخول',
    'Create Account': 'إنشاء حساب'
  },
  hi: {
    Register: 'रजिस्टर',
    'Sign in': 'साइन इन',
    'Create Account': 'खाता बनाएँ'
  },
  ur: {
    Register: 'رجسٹر',
    'Sign in': 'سائن اِن',
    'Create Account': 'اکاؤنٹ بنائیں'
  },
  zh: {
    Register: '注册',
    'Sign in': '登录',
    'Create Account': '创建账户'
  },
  es: {
    Register: 'Registrarse',
    'Sign in': 'Iniciar sesión',
    'Create Account': 'Crear cuenta'
  },
  fr: {
    Register: "S'inscrire",
    'Sign in': 'Se connecter',
    'Create Account': 'Créer un compte'
  },
  pt: {
    Register: 'Registar',
    'Sign in': 'Entrar',
    'Create Account': 'Criar conta'
  },
  ru: {
    Register: 'Регистрация',
    'Sign in': 'Войти',
    'Create Account': 'Создать аккаунт'
  },
  tr: {
    Register: 'Kayıt Ol',
    'Sign in': 'Giriş Yap',
    'Create Account': 'Hesap Oluştur'
  }
};

Object.entries(authButtonTranslations).forEach(([code, values]) => {
  Object.assign(uiTranslations[code], values);
});
function MarketIcon({ symbol, kind }) {
  const key = String(symbol || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const icons = {
    BTC: <SiBitcoin />,
    ETH: <SiEthereum />,
    SOL: <SiSolana />,
    AAPL: <SiApple />,
    NVDA: <SiNvidia />,
    TSLA: <SiTesla />
  };

  const colors = {
    BTC: '#F7931A',
    ETH: '#8A92B2',
    SOL: '#9945FF',
    AAPL: '#FFFFFF',
    NVDA: '#76B900',
    TSLA: '#E82127'
  };

  // Gold
  if (key === 'XAU' || key === 'XAUUSD') {
    return (
      <div className="market-icon gold-icon">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M8 43L22 29L35 43L22 56Z" fill="#D99A16"/>
          <path d="M22 29L35 43L22 56Z" fill="#F5BD32"/>
          <path d="M28 27L43 12L58 27L43 42Z" fill="#E9AC19"/>
          <path d="M43 12L58 27L43 42Z" fill="#FFD85A"/>
          <path d="M25 44L39 30L53 44L39 58Z" fill="#C88A0A"/>
        </svg>
      </div>
    );
  }

  // Forex currency pairs
  const forex = {
    GBPUSD: { flags: ['🇬🇧', '🇺🇸'], color: '#D4AF37' },
    EURUSD: { flags: ['🇪🇺', '🇺🇸'], color: '#D4AF37' },
    USDJPY: { flags: ['🇺🇸', '🇯🇵'], color: '#D4AF37' }
  };

  if (forex[key]) {
    return (
      <div className="market-icon forex-icon">
        <span>{forex[key].flags[0]}</span>
        <span>{forex[key].flags[1]}</span>
      </div>
    );
  }

  // Stock indices
  const indices = {
    SPX: { label: '500', color: '#38BDF8' },
    NDX: { label: '100', color: '#A78BFA' },
    DAX: { label: 'DAX', color: '#F5C542' },
    DJI: { label: 'DJI', color: '#34D399' }
  };

  if (indices[key]) {
    return (
      <div
        className="market-icon index-icon"
        style={{ color: indices[key].color }}
      >
        <svg viewBox="0 0 64 64" fill="none">
          <rect x="7" y="7" width="50" height="50" rx="12"
            stroke="currentColor" strokeWidth="3"/>
          <path d="M15 42L25 31L34 37L49 19"
            stroke="currentColor" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M40 19H49V28"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <small>{indices[key].label}</small>
      </div>
    );
  }
// Load individual logos for additional Binance crypto coins
if (kind === 'Crypto' && !icons[key]) {
  return (
    <div className="market-icon">
      <img
        src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${key.toLowerCase()}.png`}
        alt={key}
        width="36"
        height="36"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          objectFit: 'contain'
        }}
        onError={e => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling.style.display = 'grid';
        }}
      />
      <span style={{
        display: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: '#30343b',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 700,
        placeItems: 'center'
      }}>
        {key.slice(0, 4)}
      </span>
    </div>
  );
}
  // Existing crypto and stock icons
  return (
    <div
      className="market-icon"
      style={{ color: colors[key] || '#D4AF37' }}
    >
      {icons[key] || '◆'}
    </div>
  );
}


function App() {
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem('igtrade-language') || 'en' } catch { return 'en' } })
  const t = (key) => uiTranslations[language]?.[key] || key
 
const handlePasswordChange = async () => {
  if (!supabase || !authSession?.user) {
    setToast('Please sign in first.');
    return;
  }

  if (!currentPassword) {
    setToast('Please enter your current password.');
    return;
  }

  if (newPassword.length < 6) {
    setToast('Password must be at least 6 characters.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setToast('New passwords do not match.');
    return;
  }

  if (currentPassword === newPassword) {
    setToast('New password must be different.');
    return;
  }

  setPasswordBusy(true);
  try {
    const { error: verifyError } = await supabase.auth.signInWithPassword(
      authSession.user.phone
        ? {
            phone: authSession.user.phone,
            password: currentPassword
          }
        : {
            email: authSession.user.email,
            password: currentPassword
          }
    );
    if (verifyError) {
      throw new Error('Current password is incorrect.');
    }

    const { error } = await supabase.auth.updateUser({
      
      password: newPassword
    });
    if (error) throw error;

    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToast('Password changed successfully.');

  } catch (error) {
    setToast(error.message);
  } finally {
    setPasswordBusy(false);
  }
};

  const [countryCode, setCountryCode] = useState('')
  const [page, setPage] = useState('Home')

  const [showPasswordChange, setShowPasswordChange] = useState(false);
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showNewPassword, setShowNewPassword] = useState(false);
const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [passwordBusy, setPasswordBusy] = useState(false);
  const [earnPositions, setEarnPositions] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem('igtrade-earn-positions') || '[]'
    );
  } catch {
    return [];
  }
});

const [earnTab, setEarnTab] = useState('Simple Earn');

const [advancedSelection, setAdvancedSelection] = useState('');
const [advancedAmount, setAdvancedAmount] = useState('');
const [advancedCollateral, setAdvancedCollateral] = useState('');
const [advancedCollateralAsset, setAdvancedCollateralAsset] = useState('BNB');
const [advancedAgreed, setAdvancedAgreed] = useState(false);
const [advancedBorrowBusy, setAdvancedBorrowBusy] = useState(false);
const [advancedPositions, setAdvancedPositions] = useState([]);
const [myAdvancedRequests, setMyAdvancedRequests] = useState([]);
const [advancedNotice, setAdvancedNotice] = useState('');
const [advancedDirection, setAdvancedDirection] = useState('Up');
const advancedGoldLogo = 'https://cryptologos.cc/logos/tether-gold-xaut-logo.png?v=040';

const advancedLoanProducts = [
  { type: 'Flexible Rate Loan', asset: 'USDT', rate: '7.98%', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040' },
  { type: 'Flexible Rate Loan', asset: 'USDC', rate: '6.50%', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040' },
  { type: 'Flexible Rate Loan', asset: 'XAU/USDT', rate: 'Gold', logo: advancedGoldLogo },
  { type: 'Fixed Rate Loan', asset: 'USDT', rate: '5.06%', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040' },
  { type: 'Fixed Rate Loan', asset: 'USDC', rate: '4.80%', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040' },
  { type: 'Fixed Rate Loan', asset: 'XAU/USDT', rate: 'Gold', logo: advancedGoldLogo },
  { type: 'VIP Loan', asset: 'USDT', rate: '5.35%', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040' },
  { type: 'VIP Loan', asset: 'XAU/USDT', rate: 'Gold', logo: advancedGoldLogo }
];


const advancedStakingProducts = [
  { asset: 'ETH', name: 'Ethereum', rate: '3.20%', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040' },
  { asset: 'SOL', name: 'Solana', rate: '5.50%', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=040' }
];

const advancedAmountNumber = Number(advancedAmount) || 0;
const advancedCollateralNumber = Number(advancedCollateral) || 0;

const advancedMaxBorrow = advancedCollateralNumber * 0.10;

const advancedLTV = advancedCollateralNumber > 0
  ? (advancedAmountNumber / advancedCollateralNumber) * 100
  : 0;
const submitAdvancedBorrow = async () => {
  if (!supabase || !authSession?.user?.id) {
    setAdvancedNotice('Please sign in before submitting a borrow request');
    return;
  }

  if (advancedBorrowBusy) return;

  if (advancedAmountNumber < 1) {
    setAdvancedNotice('Minimum  borrow amount is 1');
    return;
  }

  if (advancedCollateralNumber <= 0) {
    setAdvancedNotice('Enter collateral value');
    return;
  }

  if (advancedAmountNumber > advancedMaxBorrow) {
    setAdvancedNotice('Borrow amount exceeds the 10%  LTV limit');
    return;
  }

  if (!advancedAgreed) {
    setAdvancedNotice('Please accept the loan agreement');
    return;
  }

  const selectedAsset = advancedSelection.split(' ')[1];
  const borrowAsset = selectedAsset === 'XAU/USDT'
    ? 'GOLD'
    : selectedAsset;

  const loanType = advancedSelection.replace(
    `Borrow ${selectedAsset} `,
    ''
  );

  const selectedProduct = advancedLoanProducts.find(
    loan => loan.asset === selectedAsset && loan.type === loanType
  );

  if (!selectedProduct) {
    setAdvancedNotice('Loan product not found');
    return;
  }

  setAdvancedBorrowBusy(true);

  try {
    const { data, error } = await supabase
      .from('advanced_requests')
      .insert({
        user_id: authSession.user.id,
        user_email: authSession.user.email || '',
        asset: borrowAsset,
        amount: advancedAmountNumber,
        collateral_asset: advancedCollateralAsset,
        collateral_amount: advancedCollateralNumber,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
    setAdvancedNotice('Borrow request submitted. Waiting for Admin approval.');

    setAdvancedAmount('');
    setAdvancedCollateral('');
    setAdvancedAgreed(false);

  } catch (error) {
    console.error('Borrow request failed:', error);
    setAdvancedNotice('Borrow request failed: ' + error.message);
  } finally {
    setAdvancedBorrowBusy(false);
  }
};
const [earnType, setEarnType] = useState('Flexible');
const [earnCoin, setEarnCoin] = useState('USDT');
const [showEarnSubscribe, setShowEarnSubscribe] = useState(false);
const [earnAmount, setEarnAmount] = useState('');
const [earnSearch, setEarnSearch] = useState('');
const [earnFilter, setEarnFilter] = useState('All');


const earnProducts = [
  {
    coin: 'USDT',
    name: 'Tether',
    logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040',
    flexible: 3.2,
    locked: 5.1,
    days: 30
  },
  {
    coin: 'USDC',
    name: 'USD Coin',
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040',
    flexible: 3.0,
    locked: 4.8,
    days: 30
  },
  {
    coin: 'BTC',
    name: 'Bitcoin',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=040',
    flexible: 0.8,
    locked: 1.5,
    days: 60
  },
  {
    coin: 'ETH',
    name: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040',
    flexible: 1.2,
    locked: 2.1,
    days: 60
  },
  {
    coin: 'SOL',
    name: 'Solana',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=040',
    flexible: 2.4,
    locked: 4.2,
    days: 30
  },
  {
    coin: 'XAU',
    name: 'Gold',
    logo: 'https://cryptologos.cc/logos/tether-gold-xaut-logo.png?v=040',
    flexible: 2.0,
    locked: 3.5,
    days: 30,
    pair: 'XAU.USDT'
  }
  
];

const selectedEarnProduct =
  earnProducts.find(product => product.coin === earnCoin) || earnProducts[0];

const selectedEarnApr =
  earnType === 'Flexible'
    ? selectedEarnProduct.flexible
    : selectedEarnProduct.locked;

const earnTotal = earnPositions.reduce(
  (total, position) => total + position.amount,
  0
);

const earnEstimatedIncome = earnPositions.reduce(
  (total, position) =>
    total + (position.amount * position.apr / 100 / 365),
  0
);




const subscribeToEarn = () => {
  const amountValue = Number(earnAmount);

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return setToast('Please enter a valid USDT amount.');
  }

  const usdtPrice = Number(assetRates.USDT || 0);

  if (usdtPrice <= 0) {
    return setToast('USDT market price is unavailable.');
  }

  const valueInUSD = amountValue * usdtPrice;

  if (valueInUSD < 10) {
    return setToast('Minimum subscription is 10 USDT equivalent.');
  }

  if (amountValue > Number(balance || 0)) {
    return setToast('Insufficient USDT Funding balance.');
  }

  const marketRate =
    earnCoin === 'XAU'
      ? Number(assetRates.GOLD || 0)
      : earnCoin === 'USDT'
        ? usdtPrice
        : Number(assetRates[earnCoin] || 0);

  if (!Number.isFinite(marketRate) || marketRate <= 0) {
    return setToast(`${earnCoin} market price is unavailable.`);
  }

  const convertedAmount =
    earnCoin === 'USDT'
      ? amountValue
      : valueInUSD / marketRate;

  if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) {
    return setToast('Unable to calculate coin conversion.');
  }

  setBalance(current =>
    Number(current || 0) - amountValue
  );

  const newPosition = {
    id: Date.now(),
    coin: earnCoin,
    name: selectedEarnProduct.name,
    amount: convertedAmount,
    investedUSDT: amountValue,
    entryPrice: marketRate,
    type: earnType,
    apr: selectedEarnApr,
    days: earnType === 'Flexible' ? 0 : selectedEarnProduct.days,
    createdAt: new Date().toLocaleString(),
    status: 'Active',
    fundsDeducted: true
  };

  setEarnPositions(current => [newPosition, ...current]);
  setEarnAmount('');
  setEarnTab('My Positions');

  setToast(`${convertedAmount.toFixed(8)} ${earnCoin} subscribed successfully.`);
};

useEffect(() => {
  try {
    localStorage.setItem(
      'igtrade-earn-positions',
      JSON.stringify(earnPositions)
    );
  } catch (error) {
    console.error('Could not save Earn positions:', error);
  }
}, [earnPositions]);


const redeemEarnPosition = (positionId) => {
  const position = earnPositions.find(
    item => item.id === positionId
  );

  if (!position) {
    return setToast('Earn position not found.');
  }

  const confirmed = window.confirm(
    `Redeem ${position.amount} ${position.coin} from Earn?`
  );

  if (!confirmed) return;

  // Return funds only for positions created with the new system
  if (position.fundsDeducted === true) {
    if (position.coin === 'USDT') {
      setBalance(current =>
        Number(current || 0) + Number(position.amount)
      );
    } else {
      setCoinWallets(current => ({
        ...current,
        Funding: {
          ...current.Funding,
          [position.coin]:
            Number(current.Funding?.[position.coin] || 0) +
            Number(position.amount)
        }
      }));
    }
  }

  setEarnPositions(current =>
    current.filter(item => item.id !== positionId)
  );

  setToast(
    `${position.amount} ${position.coin} redeemed successfully.`
  );
};


const filteredEarnPositions = earnPositions.filter(position => {
  const matchesSearch =
    position.coin.toLowerCase().includes(earnSearch.toLowerCase()) ||
    position.name.toLowerCase().includes(earnSearch.toLowerCase());

  const matchesType =
    earnFilter === 'All' || position.type === earnFilter;

  return matchesSearch && matchesType;
});
  const [marketFilter, setMarketFilter] = useState('All')
  const [marketSearch, setMarketSearch] = useState('');
  const [cryptoPage, setCryptoPage] = useState(1);
const [cryptoMarkets, setCryptoMarkets] = useState([]);
const [cryptoRanking, setCryptoRanking] = useState([]);
const [globalCryptoData, setGlobalCryptoData] = useState(null);
const [fearGreedData, setFearGreedData] = useState(null);
const [globalCryptoLoading, setGlobalCryptoLoading] = useState(true);
const [btcDerivativesData, setBtcDerivativesData] = useState(null);
const [btcDerivativesLoading, setBtcDerivativesLoading] = useState(true);
const [btcOpenInterestHistory, setBtcOpenInterestHistory] = useState([]);
const [btcFundingHistory, setBtcFundingHistory] = useState([]);
const [btcHistoryLoading, setBtcHistoryLoading] = useState(true);

const [etfFlowData, setEtfFlowData] = useState({
  btc: [],
  eth: [],
  updatedAt: null
});
const [etfFlowLoading, setEtfFlowLoading] = useState(true);
const [btcLiquidations, setBtcLiquidations] = useState([]);
const [liquidationStreamStatus, setLiquidationStreamStatus] = useState('Connecting');
const [btcVolatilityData, setBtcVolatilityData] = useState(null);
const [btcVolatilityLoading, setBtcVolatilityLoading] = useState(true);
const [marketCapHistory, setMarketCapHistory] = useState([]);
const [marketCapRange, setMarketCapRange] = useState('30');
const [marketCapLoading, setMarketCapLoading] = useState(false);
const [fearGreedHistory, setFearGreedHistory] = useState([]);
const [altcoinSeasonData, setAltcoinSeasonData] = useState(null);
const [altcoinSeasonHistory, setAltcoinSeasonHistory] = useState([]);
const [altcoinSeasonLoading, setAltcoinSeasonLoading] = useState(true);
const [fearGreedHover, setFearGreedHover] = useState(null);
const [selectedFearGreed, setSelectedFearGreed] = useState(null);
const [altcoinSeasonHover, setAltcoinSeasonHover] = useState(null);
const [btcDailyHistory, setBtcDailyHistory] = useState([]);
const filteredCryptoRanking = cryptoRanking.filter(coin => {
  const search = marketSearch.toLowerCase().trim();

  return (
    !search ||
    coin.name.toLowerCase().includes(search) ||
    coin.symbol.toLowerCase().includes(search)
  );
});

const cryptoPageSize = 10;
const cryptoTotalPages = Math.max(
  1,
  Math.ceil(filteredCryptoRanking.length / cryptoPageSize)
);

const safeCryptoPage = Math.min(cryptoPage, cryptoTotalPages);

const paginatedCryptoRanking = filteredCryptoRanking.slice(
  (safeCryptoPage - 1) * cryptoPageSize,
  safeCryptoPage * cryptoPageSize
);
const [cryptoSparkline, setCryptoSparkline] = useState({});
  const [selected, setSelected] = useState('BTC')
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [visitorCountry, setVisitorCountry] = useState('');
const [localCurrency, setLocalCurrency] = useState('USD');
const [localCurrencyRate, setLocalCurrencyRate] = useState(0);
const [localCurrencySymbol, setLocalCurrencySymbol] = useState('$');
  const [assetsWalletTab, setAssetsWalletTab] = useState('Spot');
  const [selectedAssetWallet, setSelectedAssetWallet] = useState('Spot');
  const [assetsAction, setAssetsAction] = useState('');
const [transferFrom, setTransferFrom] = useState('Spot');
const [transferTo, setTransferTo] = useState('Funding');
const [transferCoin, setTransferCoin] = useState('USDT');
const [transferAmount, setTransferAmount] = useState('');

const [convertFrom, setConvertFrom] = useState('USDT');
const [convertTo, setConvertTo] = useState('BTC');
const [convertAmount, setConvertAmount] = useState('');
const [convertPreview, setConvertPreview] = useState(null);
  const [amount, setAmount] = useState('100')
  const [duration, setDuration] = useState(30)
  const [direction, setDirection] = useState('BUY')
  const [trade, setTrade] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [balance, setBalance] = useState(0)
  const [btcBalance, setBtcBalance] = useState(0);
const [ethBalance, setEthBalance] = useState(0);
  const [coinWallets, setCoinWallets] = useState({
  Spot: {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDC: 0,
    EUR: 0,
    GOLD: 0
  },
  Funding: {
    USDT: 0,
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDC: 0,
    EUR: 0,
    GOLD: 0
  }
});
  const [dailyStartValue, setDailyStartValue] = useState(null);
  const [tradeStarting, setTradeStarting] = useState(false)
  const [tradeHistory, setTradeHistory] = useState([])
  const [depositMethod, setDepositMethod] = useState('TRC20')
  const [depositAmount, setDepositAmount] = useState('50')
  const [depositFile, setDepositFile] = useState(null)
  const [depositAssets, setDepositAssets] = useState([]);
  const [fiatCurrency, setFiatCurrency] = useState('USD');
const [fiatAmount, setFiatAmount] = useState('100');
const [fiatPaymentMethod, setFiatPaymentMethod] = useState('Bank Transfer');
const [fiatDepositReview, setFiatDepositReview] = useState(false);
const [fiatCurrencySearch, setFiatCurrencySearch] = useState('');
const [fiatDepositStep, setFiatDepositStep] = useState('select');
const fiatCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', flag: '🇳🇵' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' }
];
const [selectedDepositCurrency, setSelectedDepositCurrency] = useState('');
const [depositCoinStep, setDepositCoinStep] = useState('select');
const [selectedDepositAssetId, setSelectedDepositAssetId] = useState('');
const [depositAssetsLoading, setDepositAssetsLoading] = useState(false);
const [depositMode, setDepositMode] = useState('home');
const [buyCryptoCoin, setBuyCryptoCoin] = useState('BTC');
const [buyCryptoSearch, setBuyCryptoSearch] = useState('');
const [buyCryptoStep, setBuyCryptoStep] = useState('select');
const [buyCryptoReview, setBuyCryptoReview] = useState(false);
const [buyCryptoAmount, setBuyCryptoAmount] = useState('100');
const [buyPaymentMethod, setBuyPaymentMethod] = useState('Card');
  const [withdrawMethod, setWithdrawMethod] = useState('TRC20')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [requests, setRequests] = useState([])
  const [advancedRequests, setAdvancedRequests] = useState([])
const [advancedRequestsLoading, setAdvancedRequestsLoading] = useState(false)
const [advancedReviewBusy, setAdvancedReviewBusy] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [tradeSettingLoaded, setTradeSettingLoaded] = useState(false)
  const [tradeFullscreen, setTradeFullscreen] = useState(false);
  

useEffect(() => {
  if (!supabase) {
    setTradeSettingLoaded(true)
    return
  }

  let active = true

  const loadTradingSetting = async () => {
    const { data, error } = await supabase
  .from('trading_settings')
  .select('is_open')
  .eq('id', 1)
  .maybeSingle()

    if (!active) return

    if (error) {
      console.error('Trading setting load failed:', error.message)
      setTradeEnabledState(false)
    } else {
      setTradeEnabledState(data.is_open === true)
    }

    setTradeSettingLoaded(true)
  }

  loadTradingSetting()

  const channel = supabase
    .channel('trading-settings-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trading_settings',
        filter: 'id=eq.1',
      },
      (payload) => {
        if (active && payload.new) {
          setTradeEnabledState(payload.new.is_open === true)
        }
      }
    )
    .subscribe()

  return () => {
    active = false
    supabase.removeChannel(channel)
  }
}, [])

const setTradeEnabled = async (value) => {
  const nextValue =
    typeof value === 'function' ? value(tradeEnabled) : value

  setTradeEnabledState(false)

  if (!supabase) {
    setToast('Trading.')
    return
  }

  const { error } = await supabase
    .from('trading_settings')
    .update({
      is_open: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    setTradeEnabledState(false)
    setToast(`Could not save trading setting: ${error.message}`)
    return
  }

  setTradeEnabledState(nextValue)
  setToast(nextValue ? 'Trading enabled.' : 'Trading paused.')
}


 const [toast, setToast] = useState('')
 const [tradeEnabled, setTradeEnabledState] = useState(false)
  const [loginOpen, setLoginOpen] = useState(window.location.pathname.replace(/\/+$/, '') === '/admin')
  const [authMode, setAuthMode] = useState('login')
  const [authIdentifier, setAuthIdentifier] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [showAuthPassword, setShowAuthPassword] = useState(false);
const [showAuthConfirm, setShowAuthConfirm] = useState(false);
  const [authConfirm, setAuthConfirm] = useState('')
  const [authName, setAuthName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authSession, setAuthSession] = useState(null)
  useEffect(() => {
  if (!supabase || !authSession?.user?.id) {
    setMyAdvancedRequests([]);
    return;
  }

  const loadMyAdvancedRequests = async () => {
    const { data, error } = await supabase
      .from('advanced_requests')
      .select('*')
      .eq('user_id', authSession.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Borrow history load error:', error);
      return;
    }

    setMyAdvancedRequests(data || []);
  };

  loadMyAdvancedRequests();

  const channel = supabase
    .channel(`my-advanced-requests-${authSession.user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'advanced_requests',
        filter: `user_id=eq.${authSession.user.id}`
      },
      () => loadMyAdvancedRequests()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [authSession?.user?.id]);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminProfileLoaded, setAdminProfileLoaded] = useState(false)
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const [profileTab, setProfileTab] = useState('Trades History')
  const [expandedTradeId, setExpandedTradeId] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [members, setMembers] = useState([])
  const loadAdvancedRequests = async () => {
  if (!supabase || !isAdmin || !authSession?.user?.id) return

  setAdvancedRequestsLoading(true)

  const { data, error } = await supabase
    .from('advanced_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Advanced requests loading failed:', error.message)
    setToast('Could not load Borrow requests: ' + error.message)
  } else {
    setAdvancedRequests(data || [])
  }

  setAdvancedRequestsLoading(false)
}

useEffect(() => {
  if (!supabase || !isAdmin || !authSession?.user?.id) {
    setAdvancedRequests([])
    return
  }

  loadAdvancedRequests()

  const channel = supabase
    .channel('advanced-borrow-requests-admin')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'advanced_requests'
      },
      () => {
        loadAdvancedRequests()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [isAdmin, authSession?.user?.id])
useEffect(() => {
  // তোমার আগের loadAdvancedRequests useEffect-এর কোড
}, [isAdmin, authSession?.user?.id])

// এখানে reviewAdvancedRequest বসবে
const reviewAdvancedRequest = async (id, status, adminNote = '') => {
  if (!supabase || !isAdmin || advancedReviewBusy) return

  if (status === 'Rejected' && !String(adminNote).trim()) {
    return setToast('Write a rejection reason first.')
  }

  setAdvancedReviewBusy(true)

  try {
    const { data, error } = await supabase.rpc(
      'review_advanced_borrow_request',
      {
        p_request_id: id,
        p_status: status,
        p_admin_note: String(adminNote || '').trim()
      }
    )

    if (error) throw error

    if (!data?.success) {
      throw new Error('Request review was not confirmed.')
    }

    await loadAdvancedRequests()

    setToast(
      status === 'Approved'
        ? 'Borrow approved. Funding balance updated in Supabase.'
        : 'Borrow request rejected.'
    )
  } catch (error) {
    console.error('Borrow review failed:', error)
    setToast('Borrow review failed: ' + error.message)
  } finally {
    setAdvancedReviewBusy(false)
  }
}
  const [memberEmail, setMemberEmail] = useState('')
  const [memberAmount, setMemberAmount] = useState('100')
  const [memberAction, setMemberAction] = useState('add')
  const [walletAddresses, setWalletAddresses] = useState({ TRC20: '', BTC: '', ETH: '' })
  const [walletQrCodes, setWalletQrCodes] = useState({
  TRC20: '',
  BTC: '',
  ETH: ''
});
useEffect(() => {
  const loadSavedWalletAddresses = async () => {
    const userId = authSession?.user?.id

    if (!supabase || !userId) return

    const { data, error } = await supabase
      .from('profiles')
      .select('trc20_address, btc_address, eth_address')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Address loading failed:', error.message)
      return
    }

    const saved = {
      TRC20: data?.trc20_address || '',
      BTC: data?.btc_address || '',
      ETH: data?.eth_address || ''
    }

    setWalletAddresses(saved)
    setWithdrawAddress(saved[withdrawMethod] || '')
  }

  loadSavedWalletAddresses()
}, [authSession?.user?.id])

useEffect(() => {
  if (!supabase) return;

  let active = true;

  const loadWalletAddresses = async () => {
    setDepositAssetsLoading(true);

    try {
      const { data, error } = await supabase
        .from('deposit_addresses')
        .select('id, currency, network, wallet_address, instructions, is_active, qr_path')
        .eq('is_active', true)
        .order('currency', { ascending: true });

      if (error) throw error;
      if (!active) return;

      const assets = (data || []).map(item => {
        let qrUrl = '';

        if (item.qr_path) {
          if (item.qr_path.startsWith('http')) {
            qrUrl = item.qr_path;
          } else {
            const { data: publicData } = supabase.storage
              .from('deposit-qr-codes')
              .getPublicUrl(item.qr_path);

            qrUrl = publicData?.publicUrl || '';
          }
        }

        return {
          ...item,
          currency: String(item.currency || '').trim().toUpperCase(),
          network: String(item.network || '').trim(),
          qr_url: qrUrl
        };
      });

      setDepositAssets(assets);

      setSelectedDepositCurrency(previous => {
        if (previous && assets.some(item => item.currency === previous)) {
          return previous;
        }

        return assets[0]?.currency || '';
      });

      setSelectedDepositAssetId(previous => {
        if (previous && assets.some(item => String(item.id) === String(previous))) {
          return previous;
        }

        return assets[0]?.id ? String(assets[0].id) : '';
      });

      const legacyAddresses = {
        TRC20: '',
        BTC: '',
        ETH: ''
      };

      const legacyQrCodes = {
        TRC20: '',
        BTC: '',
        ETH: ''
      };

      assets.forEach(item => {
        const network = item.network.toUpperCase();

        if (item.currency === 'USDT' && network.includes('TRC20')) {
          legacyAddresses.TRC20 = item.wallet_address || '';
          legacyQrCodes.TRC20 = item.qr_url || '';
        } else if (item.currency === 'BTC') {
          legacyAddresses.BTC = item.wallet_address || '';
          legacyQrCodes.BTC = item.qr_url || '';
        } else if (item.currency === 'ETH') {
          legacyAddresses.ETH = item.wallet_address || '';
          legacyQrCodes.ETH = item.qr_url || '';
        }
      });

      setWalletAddresses(legacyAddresses);
      setWalletQrCodes(legacyQrCodes);

    } catch (error) {
      console.error('Deposit assets loading failed:', error);
    } finally {
      if (active) {
        setDepositAssetsLoading(false);
      }
    }
  };

  loadWalletAddresses();

  return () => {
    active = false;
  };
}, [supabase, page]);
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/igtrading_platforms93')

  const [livePrices, setLivePrices] = useState({});
const [liveCandles, setLiveCandles] = useState({});
const [marketConnection, setMarketConnection] = useState({
  crypto: 'connecting',
  other: import.meta.env.VITE_TWELVEDATA_API_KEY
    ? 'connecting'
    : 'API key required'
});

const [chartTimeframe, setChartTimeframe] = useState('1m');
const chartTimeframeRef = useRef('1m');

const btcPrice = Number(livePrices.BTC?.price || 0);
const ethPrice = Number(livePrices.ETH?.price || 0);
const solPrice = Number(livePrices.SOL?.price || 0);
const eurPrice = Number(livePrices.EURUSD?.price || 0);

const usdtBalance = Number(balance || 0);

const getWalletBalance = (wallet, coin) => {
  // Admin virtual balance is Funding USDT
  if (wallet === 'Funding' && coin === 'USDT') {
    return Number(balance || 0);
  }

  // All other coins have separate wallet balances
  return Number(coinWallets[wallet]?.[coin] || 0);
};


const handleTransfer = async () => {
  const amount = Number(transferAmount);
  const coin = transferCoin;
  const from = transferFrom;
  const to = transferTo;
  const userId = authSession?.user?.id;

  if (!supabase || !userId) {
    return setToast('Please sign in first.');
  }

  if (from === to) {
    return setToast('Select different wallets.');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return setToast('Enter a valid transfer amount.');
  }

  const available = getWalletBalance(from, coin);

  if (amount > available) {
    return setToast('Insufficient available balance.');
  }

  // Prepare separate Spot and Funding coin balances
  const nextWallets = {
    Spot: { ...(coinWallets.Spot || {}) },
    Funding: { ...(coinWallets.Funding || {}) }
  };

  let nextBalance = Number(balance || 0);

  // Funding USDT is stored in profiles.virtual_balance
  if (coin === 'USDT') {
    if (from === 'Funding') {
      nextBalance -= amount;
    }

    if (to === 'Funding') {
      nextBalance += amount;
    }
  }

  // Update the coin balances in both wallets
  if (!(from === 'Funding' && coin === 'USDT')) {
    nextWallets[from][coin] =
      Number(nextWallets[from][coin] || 0) - amount;
  }

  if (!(to === 'Funding' && coin === 'USDT')) {
    nextWallets[to][coin] =
      Number(nextWallets[to][coin] || 0) + amount;
  }

  // Save both balances to Supabase
   const { data: savedProfile, error } = await supabase
  .from('profiles')
  .update({
    virtual_balance: nextBalance,
    coin_wallets: nextWallets
  })
  .eq('id', userId)
  .select('id, virtual_balance, coin_wallets')
  .maybeSingle();

if (error) {
  console.error('Transfer save failed:', error.message);
  return setToast('Transfer failed: ' + error.message);
}

if (!savedProfile) {
  console.error('Transfer was not saved. Check Supabase RLS policies.');
  return setToast('Transfer not saved. Supabase permission blocked the update.');
}

  if (error) {
    console.error('Transfer save failed:', error.message);
    return setToast('Transfer failed: ' + error.message);
  }

  // Update the screen only after Supabase saves successfully
  setBalance(nextBalance);
  setCoinWallets(nextWallets);

  setTransferAmount('');
  setToast(`${amount} ${coin} transferred successfully.`);
};


const assetRates = {
  USDT: 1,
  USDC: 1,
  BTC: btcPrice,
  ETH: ethPrice,
  SOL: solPrice,
  EUR: eurPrice,
  GOLD: Number(livePrices.XAU?.price || 0)
};

const fundingTotalUSDT =
  Number(balance || 0) +
  Number(btcBalance || 0) * btcPrice +
  Number(ethBalance || 0) * ethPrice +
  ['SOL', 'USDC', 'EUR', 'GOLD'].reduce(
    (total, coin) => {
      const amount = Number(coinWallets.Funding?.[coin] || 0);
      const rate = Number(assetRates[coin] || 0);
      return total + amount * rate;
    },
    0
  );

const estimatedTotalValue = fundingTotalUSDT;

const todaysPNL = useMemo(() => {
  if (dailyStartValue === null) return 0;
  return estimatedTotalValue - dailyStartValue;
}, [estimatedTotalValue, dailyStartValue]);
const handleConvert = async () => {
  const amount = Number(convertAmount);
  const from = convertFrom;
  const to = convertTo;
  const userId = authSession?.user?.id;

  if (!supabase || !userId) {
    return setToast('Please sign in first.');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return setToast('Enter a valid conversion amount.');
  }

  if (from === to) {
    return setToast('Select two different coins.');
  }

  const available = getWalletBalance('Funding', from);

  if (amount > available) {
    return setToast(`Insufficient ${from} Funding balance.`);
  }

  const fromRate = Number(assetRates[from] || 0);
  const toRate = Number(assetRates[to] || 0);

  if (fromRate <= 0 || toRate <= 0) {
    return setToast('Live market price is not available.');
  }

  const receiveAmount = Number(
    ((amount * fromRate) / toRate).toFixed(8)
  );

  if (!receiveAmount || !Number.isFinite(receiveAmount)) {
    return setToast('Unable to calculate conversion.');
  }

  const samePreview =
    convertPreview &&
    convertPreview.from === from &&
    convertPreview.to === to &&
    convertPreview.amount === amount;

  // First click: show preview
  if (!samePreview) {
    setConvertPreview({
      from,
      to,
      amount,
      receiveAmount,
      rate: fromRate / toRate
    });
    return;
  }

  // Prepare updated Funding wallet
  const nextWallets = {
    Spot: { ...(coinWallets.Spot || {}) },
    Funding: { ...(coinWallets.Funding || {}) }
  };

  let nextBalance = Number(balance || 0);
  let nextBtcBalance = Number(btcBalance || 0);
let nextEthBalance = Number(ethBalance || 0);

  // Funding USDT is stored in virtual_balance
  if (from === 'USDT') {
  nextBalance -= amount;
} else {
  nextWallets.Funding[from] =
    Number(nextWallets.Funding[from] || 0) - amount;

  if (from === 'BTC') nextBtcBalance -= amount;
  if (from === 'ETH') nextEthBalance -= amount;
}

 if (to === 'USDT') {
  nextBalance += receiveAmount;
} else {
  nextWallets.Funding[to] =
    Number(nextWallets.Funding[to] || 0) + receiveAmount;

  if (to === 'BTC') nextBtcBalance += receiveAmount;
  if (to === 'ETH') nextEthBalance += receiveAmount;
}

  // Save conversion to Supabase
  const { error } = await supabase
    .from('profiles')
   .update({
  virtual_balance: nextBalance,
  btc_balance: nextBtcBalance,
  eth_balance: nextEthBalance,
  coin_wallets: nextWallets
})
    .eq('id', userId);

  if (error) {
    console.error('Conversion save failed:', error.message);
    return setToast('Conversion failed: ' + error.message);
  }

  // Update screen after successful save
  setBalance(nextBalance);
setBtcBalance(nextBtcBalance);
setEthBalance(nextEthBalance);
setCoinWallets(nextWallets);
  setToast(
    `Converted ${amount} ${from} to ${receiveAmount} ${to}.`
  );

  setConvertAmount('');
  setConvertPreview(null);
};


const selectedRate = assetRates[selectedAsset] || 0;

const availableAmount =
  selectedRate > 0
    ? fundingTotalUSDT / selectedRate
    : 0;

const convertedPNL =
  selectedRate > 0
    ? todaysPNL / selectedRate
    : 0;

const pnlPercentage =
  dailyStartValue > 0
    ? (todaysPNL / dailyStartValue) * 100
    : 0;

useEffect(() => {
  chartTimeframeRef.current = chartTimeframe;
}, [chartTimeframe]);

// Load real Binance USDT Spot markets for the requested Top 200 coins
useEffect(() => {
  let active = true;

  const loadBinanceSpotMarkets = async () => {
    try {
      setMarketConnection(v => ({
        ...v,
        crypto: 'loading Binance Spot markets'
      }));

      const [exchangeResponse, tickerResponse] = await Promise.all([
        fetch('https://data-api.binance.vision/api/v3/exchangeInfo'),
        fetch('https://data-api.binance.vision/api/v3/ticker/24hr')
      ]);

      if (!exchangeResponse.ok || !tickerResponse.ok) {
        throw new Error('Binance market API request failed');
      }

      const exchangeData = await exchangeResponse.json();
      const tickerData = await tickerResponse.json();

      if (!active) return;

      const tickerMap = new Map(
        tickerData.map(item => [item.symbol, item])
      );

      const requestedMap = new Map(
        requestedCryptoAssets.map(item => [item.symbol, item.name])
      );

      const markets = exchangeData.symbols
        .filter(item =>
          item.status === 'TRADING' &&
          item.quoteAsset === 'USDT' &&
          item.isSpotTradingAllowed === true &&
          requestedMap.has(item.baseAsset) &&
          tickerMap.has(item.symbol)
        )
        .map(item => {
          const ticker = tickerMap.get(item.symbol);

          return {
            symbol: item.baseAsset,
            pair: item.symbol,
            name: requestedMap.get(item.baseAsset),
            kind: 'Crypto',
            provider: 'Binance',
            marketType: 'Spot',
            price: Number(ticker.lastPrice),
            change: Number(ticker.priceChangePercent),
            volume: Number(ticker.quoteVolume),
            high: Number(ticker.highPrice),
            low: Number(ticker.lowPrice),
            updatedAt: Date.now()
          };
        });

      const orderMap = new Map(
        requestedCryptoAssets.map((item, index) => [item.symbol, index])
      );

      markets.sort(
        (a, b) =>
          orderMap.get(a.symbol) - orderMap.get(b.symbol)
      );

      if (active) {
        setCryptoMarkets(markets);
        setMarketConnection(v => ({
          ...v,
          crypto: 'live'
        }));
      }
    } catch (error) {
      console.error('Binance Spot market loading failed:', error);

      if (active) {
        setMarketConnection(v => ({
          ...v,
          crypto: 'disconnected'
        }));
      }
    }
  };

  loadBinanceSpotMarkets();

  return () => {
    active = false;
  };
}, []);

// Real-time Binance Spot ticker updates
useEffect(() => {
  if (!cryptoMarkets.length) return;

  const ws = new WebSocket(
    'wss://data-stream.binance.vision:443/ws/!ticker@arr'
  );

  ws.onmessage = (event) => {
    try {
      const tickers = JSON.parse(event.data);
      const updates = new Map();

      tickers.forEach(ticker => {
        if (ticker.s && ticker.s.endsWith('USDT')) {
          updates.set(ticker.s, ticker);
        }
      });

      setCryptoMarkets(previous =>
        previous.map(market => {
          const ticker = updates.get(market.pair);
          if (!ticker) return market;

          return {
            ...market,
            price: Number(ticker.c),
            change: Number(ticker.P),
            volume: Number(ticker.q),
            high: Number(ticker.h),
            low: Number(ticker.l),
            updatedAt: Date.now()
          };
        })
      );
    } catch (error) {
      console.error('Binance ticker update error:', error);
    }
  };

  ws.onerror = (error) => {
  };

  ws.onclose = () => {
  
  };

  return () => {
    ws.close();
  };
}, [cryptoMarkets.length]);

// CoinMarketCap-style Crypto Ranking Data
useEffect(() => {
  let stopped = false;
  let timer;

  const loadCryptoRanking = async () => {
    try {
      const url = new URL(
        'https://api.coingecko.com/api/v3/coins/markets'
      );

      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('order', 'market_cap_desc');
      url.searchParams.set('per_page', '200');
      url.searchParams.set('page', '1');
      url.searchParams.set('sparkline', 'true');
      url.searchParams.set(
        'price_change_percentage',
        '1h,24h,7d'
      );

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!stopped && Array.isArray(data)) {
        setCryptoRanking(data);
      }
    } catch (error) {
      console.error('Crypto ranking load failed:', error);
    }

    if (!stopped) {
      timer = setTimeout(loadCryptoRanking, 300000);
    }
  };

  loadCryptoRanking();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);

// Load live global crypto market data and Fear & Greed Index
useEffect(() => {
  let stopped = false;
  let timer;

  const loadGlobalCryptoData = async () => {
    try {
      const [globalResponse, fearResponse] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/global'),
        fetch('https://api.alternative.me/fng/?limit=1')
      ]);

      if (!globalResponse.ok || !fearResponse.ok) {
        throw new Error('Global crypto data API unavailable');
      }

      const globalResult = await globalResponse.json();
      const fearResult = await fearResponse.json();

      if (stopped) return;

      setGlobalCryptoData(globalResult.data || null);
      setFearGreedData(fearResult.data?.[0] || null);

    } catch (error) {
      console.error('Global crypto data loading failed:', error);
    } finally {
      if (!stopped) {
        setGlobalCryptoLoading(false);
        timer = setTimeout(loadGlobalCryptoData, 300000);
      }
    }
  };

  loadGlobalCryptoData();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);
// Load live BTC Futures Open Interest and Funding Rate
useEffect(() => {
  let stopped = false;
  let timer;

  const loadBtcDerivatives = async () => {
    try {
      const [oiResponse, fundingResponse] = await Promise.all([
        fetch('https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT'),
        fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT')
      ]);

      if (!oiResponse.ok || !fundingResponse.ok) {
        throw new Error('BTC Futures API unavailable');
      }

      const [oi, funding] = await Promise.all([
        oiResponse.json(),
        fundingResponse.json()
      ]);

      if (stopped) return;

      const openInterestBTC = Number(oi.openInterest);
      const markPrice = Number(funding.markPrice);
      const fundingRate = Number(funding.lastFundingRate);

      setBtcDerivativesData({
        openInterestBTC,
        openInterestUSD: openInterestBTC * markPrice,
        markPrice,
        fundingRate,
        nextFundingTime: Number(funding.nextFundingTime),
        updatedAt: Date.now()
      });

    } catch (error) {
      console.error('BTC derivatives data failed:', error);
    } finally {
      if (!stopped) {
        setBtcDerivativesLoading(false);
        timer = setTimeout(loadBtcDerivatives, 30000);
      }
    }
  };

  loadBtcDerivatives();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);

// Load BTC Futures historical Open Interest and Funding Rate
useEffect(() => {
  let stopped = false;

  const loadBtcHistory = async () => {
    try {
      const [oiResponse, fundingResponse] = await Promise.all([
        fetch(
          'https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=30'
        ),
        fetch(
          'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=30'
        )
      ]);

      if (!oiResponse.ok || !fundingResponse.ok) {
        throw new Error('Historical futures API unavailable');
      }

      const [oiData, fundingData] = await Promise.all([
        oiResponse.json(),
        fundingResponse.json()
      ]);

      if (stopped) return;

      setBtcOpenInterestHistory(
        Array.isArray(oiData) ? oiData : []
      );

      setBtcFundingHistory(
        Array.isArray(fundingData) ? fundingData : []
      );
    } catch (error) {
      console.error('BTC futures history failed:', error);
    } finally {
      if (!stopped) {
        setBtcHistoryLoading(false);
      }
    }
  };

  loadBtcHistory();

  return () => {
    stopped = true;
  };
}, []);

// Load BTC and ETH Spot ETF Net Flow data
useEffect(() => {
  let stopped = false;

  const loadETFData = async () => {
    try {
      const [btcResponse, ethResponse] = await Promise.all([
        fetch('https://xoomar.com/api/markets/etf-flows?asset=btc&days=30'),
        fetch('https://xoomar.com/api/markets/etf-flows?asset=eth&days=30')
      ]);

      if (!btcResponse.ok || !ethResponse.ok) {
        throw new Error('ETF flow API unavailable');
      }

      const [btcJson, ethJson] = await Promise.all([
        btcResponse.json(),
        ethResponse.json()
      ]);

      const makeDailyTotals = (rows) => {
        const totals = {};

        (Array.isArray(rows) ? rows : []).forEach(row => {
          if (row.flowUsd == null || !row.date) return;

          const value = Number(row.flowUsd);
          if (!Number.isFinite(value)) return;

          totals[row.date] = (totals[row.date] || 0) + value;
        });

        return Object.entries(totals)
          .map(([date, flowUsd]) => ({ date, flowUsd }))
          .sort((a, b) => b.date.localeCompare(a.date));
      };

      if (stopped) return;

      setEtfFlowData({
        btc: makeDailyTotals(btcJson.data),
        eth: makeDailyTotals(ethJson.data),
        updatedAt: btcJson.updatedAt || ethJson.updatedAt || null
      });

    } catch (error) {
      console.error('ETF flow data failed:', error);
    } finally {
      if (!stopped) {
        setEtfFlowLoading(false);
      }
    }
  };

  loadETFData();

  return () => {
    stopped = true;
  };
}, []);


// Live BTC liquidation stream - All Market
useEffect(() => {
  let socket;
  let stopped = false;
  let reconnectTimer;

  const connectLiquidationStream = () => {
    if (stopped) return;

    socket = new WebSocket(
      'wss://fstream.binance.com/ws/!forceOrder@arr'
    );

    socket.onopen = () => {
      if (!stopped) {
        setLiquidationStreamStatus('Connected');
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Binance all-market stream returns an array
        const events = Array.isArray(message)
          ? message
          : [message];

        const btcEvents = events.filter(
          item => item.o?.s === 'BTCUSDT'
        );

        if (btcEvents.length === 0) return;

        const newLiquidations = btcEvents
          .map(item => {
            const order = item.o;

            const price = Number(order.ap || order.p || 0);
            const quantity = Number(order.z || order.q || 0);

            if (!price || !quantity) return null;

            return {
              id: `${order.s}-${order.T}-${order.S}`,
              side: order.S,
              price,
              quantity,
              value: price * quantity,
              time: Number(order.T || Date.now())
            };
          })
          .filter(Boolean);

        if (newLiquidations.length > 0) {
          setBtcLiquidations(previous => [
            ...newLiquidations,
            ...previous
          ].slice(0, 20));
        }

      } catch (error) {
        console.error('Liquidation message error:', error);
      }
    };

    socket.onerror = () => {
      if (!stopped) {
        setLiquidationStreamStatus('Unavailable');
      }
    };

    socket.onclose = () => {
      if (!stopped) {
        setLiquidationStreamStatus('Reconnecting');

        reconnectTimer = setTimeout(
          connectLiquidationStream,
          5000
        );
      }
    };
  };

  connectLiquidationStream();

  return () => {
    stopped = true;
    clearTimeout(reconnectTimer);

    if (socket) {
      socket.close();
    }
  };
}, []);


// Calculate BTC 24-hour realized volatility
useEffect(() => {
  let stopped = false;
  let timer;

  const loadBtcVolatility = async () => {
    try {
      const response = await fetch(
        'https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=25'
      );

      if (!response.ok) {
        throw new Error('BTC volatility API unavailable');
      }

      const candles = await response.json();

      if (!Array.isArray(candles) || candles.length < 25) {
        throw new Error('Not enough hourly BTC candles');
      }

      const closes = candles.map(candle => Number(candle[4]));
      const returns = [];

      for (let i = 1; i < closes.length; i++) {
        if (closes[i - 1] > 0 && closes[i] > 0) {
          returns.push(Math.log(closes[i] / closes[i - 1]));
        }
      }

      const average = returns.reduce((sum, value) => sum + value, 0)
        / returns.length;

      const variance = returns.reduce(
        (sum, value) => sum + Math.pow(value - average, 2),
        0
      ) / returns.length;

      const volatility = Math.sqrt(variance) * Math.sqrt(24) * 100;

      const firstOpen = Number(candles[0][1]);
      const lastClose = closes[closes.length - 1];

      if (stopped) return;

      setBtcVolatilityData({
        volatility,
        priceChange: ((lastClose / firstOpen) - 1) * 100,
        lastPrice: lastClose,
        updatedAt: Date.now()
      });

    } catch (error) {
      console.error('BTC volatility failed:', error);
    } finally {
      if (!stopped) {
        setBtcVolatilityLoading(false);
        timer = setTimeout(loadBtcVolatility, 300000);
      }
    }
  };

  loadBtcVolatility();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);

// Load free historical Crypto Fear & Greed data
useEffect(() => {
  let active = true;

  const loadFearGreedHistory = async () => {
    try {
      const response = await fetch(
        'https://api.alternative.me/fng/?limit=365'
      );

      if (!response.ok) {
        throw new Error('Fear & Greed API unavailable');
      }

      const result = await response.json();

      if (!active) return;

      const history = (result.data || [])
        .map(item => ({
          value: Number(item.value),
          classification: item.value_classification,
          timestamp: Number(item.timestamp) * 1000
        }))
        .filter(item =>
          Number.isFinite(item.value) &&
          Number.isFinite(item.timestamp)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      setFearGreedHistory(history);

    } catch (error) {
      console.error('Fear & Greed history failed:', error);
    }
  };

  loadFearGreedHistory();

  return () => {
    active = false;
  };
}, []);
// Load live Altcoin Season Index and historical data
useEffect(() => {
  let stopped = false;
  let timer;

  const loadAltcoinSeason = async () => {
    try {
      const [latestResponse, historyResponse] = await Promise.all([
        fetch(
          'https://pro-api.coinmarketcap.com/public-api/v1/altcoin-season-index/latest'
        ),
        fetch(
          'https://pro-api.coinmarketcap.com/public-api/v1/altcoin-season-index/historical?timeframe=90d'
        )
      ]);

      if (!latestResponse.ok || !historyResponse.ok) {
        throw new Error('Altcoin Season API unavailable');
      }

      const latestResult = await latestResponse.json();
      const historyResult = await historyResponse.json();

      if (stopped) return;

      setAltcoinSeasonData(latestResult.data || null);

      const history = (historyResult.data?.points || [])
        .map(item => ({
          value: Number(item.altcoin_index),
          timestamp: new Date(item.timestamp).getTime()
        }))
        .filter(item =>
          Number.isFinite(item.value) &&
          Number.isFinite(item.timestamp)
        );

      setAltcoinSeasonHistory(history);

    } catch (error) {
      console.error('Altcoin Season loading failed:', error);
    } finally {
      if (!stopped) {
        setAltcoinSeasonLoading(false);
        timer = setTimeout(loadAltcoinSeason, 900000);
      }
    }
  };

  loadAltcoinSeason();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);
// Load real BTC daily historical price and volume
useEffect(() => {
  let stopped = false;
  let timer;

  const loadBtcDailyHistory = async () => {
    try {
      const response = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365'
      );

      if (!response.ok) {
        throw new Error('BTC historical API unavailable');
      }

      const result = await response.json();

      if (stopped) return;

      const history = result.map(item => ({
  timestamp: Number(item[0]),
  open: Number(item[1]),
  price: Number(item[4]),
  volume: Number(item[5]),
  quoteVolume: Number(item[7])
}));

      setBtcDailyHistory(history);

    } catch (error) {
      console.error('BTC history loading failed:', error);
    } finally {
      if (!stopped) {
        timer = setTimeout(loadBtcDailyHistory, 300000);
      }
    }
  };

  loadBtcDailyHistory();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}, []);
// Detect visitor country and fetch live Forex rate
useEffect(() => {
  let stopped = false;
  let timer;

  const loadVisitorCurrency = async () => {
    try {
      const geoResponse = await fetch('https://ipwho.is/');
      if (!geoResponse.ok) {
        throw new Error('IP location request failed');
      }
const geo = await geoResponse.json();
if (stopped) return;

if (geo.success === false || !geo.country_code) {
  throw new Error('IP country detection failed');
}
const currency = countryToCurrency[geo.country_code];
if (!currency) {
  throw new Error(
    `Currency mapping unavailable for ${geo.country_code}`
  );
}

const currencySymbol =
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value || currency;

setVisitorCountry(geo.country || '');
setLocalCurrency(currency);
setLocalCurrencySymbol(currencySymbol);

      
const loadForexRate = async () => {
  if (currency === 'USD') {
    if (!stopped) setLocalCurrencyRate(1);
    return;
  }

  try {
    const rateResponse = await fetch(
      'https://open.er-api.com/v6/latest/USD'
    );

    if (!rateResponse.ok) {
      throw new Error(`Currency API error: ${rateResponse.status}`);
    }

    const rateData = await rateResponse.json();
    const rate = Number(rateData.rates?.[currency]);

    if (
      rateData.result !== 'success' ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      throw new Error(`Rate unavailable for ${currency}`);
    }

    if (!stopped) {
      setLocalCurrencyRate(rate);
    }
  } catch (error) {
    console.error('Forex rate error:', error);
  }
};

await loadForexRate();

if (!stopped) {
  timer = setInterval(loadForexRate, 86400000);
}

    } catch (error) {
     console.error('CURRENCY ERROR DETAILS:', error.message);
    }
  };

  loadVisitorCurrency();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}, []);


// Real-time Binance Kline data for individual crypto charts
useEffect(() => {
  if (!cryptoMarkets.length) return;

  const symbols = cryptoMarkets.map(m => m.pair.toLowerCase());

  const ws = new WebSocket(
    'wss://data-stream.binance.vision:443/ws'
  );

  ws.onopen = () => {
    ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: symbols.map(symbol => `${symbol}@kline_${chartTimeframe}`),
      id: 1
    }));
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.e !== 'kline' || !message.k) return;

      const symbol = message.s;
      const candleTime = message.k.t;
      const closePrice = Number(message.k.c);

      if (!symbol || !Number.isFinite(closePrice)) return;

      setCryptoSparkline(previous => {
        const oldPrices = previous[symbol] || [];
        const last = oldPrices[oldPrices.length - 1];

        let updatedPrices;

        if (last && last.time === candleTime) {
          updatedPrices = [
            ...oldPrices.slice(0, -1),
            { time: candleTime, price: closePrice }
          ];
        } else {
          updatedPrices = [
            ...oldPrices,
            { time: candleTime, price: closePrice }
          ].slice(-30);
        }

        return {
          ...previous,
          [symbol]: updatedPrices
        };
      });
            const baseSymbol = symbol.replace(/USDT$/, '');
      const k = message.k;

      setLiveCandles(previous => {
  const oldCandles = previous[baseSymbol] || [];

  const candle = {
    time: Number(k.t),
    open: Number(k.o),
    high: Number(k.h),
    low: Number(k.l),
    close: Number(k.c),
    up: Number(k.c) >= Number(k.o)
  };

  const next = [...oldCandles];
  const last = next[next.length - 1];

  if (last?.time === candle.time) {
    next[next.length - 1] = candle;
  } else {
    next.push(candle);
  }

  return {
    ...previous,
    [baseSymbol]: next.slice(-500)
  };
});
    } catch (error) {
      console.error('Binance Kline update error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Binance Kline WebSocket error:', error);
  };

  return () => {
    ws.close();
  };
}, [cryptoMarkets.map(m => m.pair).join(','), chartTimeframe]);


useEffect(() => {
  if (!authSession?.user?.id) return;

  const today = new Date().toLocaleDateString('en-CA');
  const storageKey = `igtrade_daily_start_${authSession.user.id}`;

  const saved = localStorage.getItem(storageKey);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (parsed.date === today && Number.isFinite(Number(parsed.value))) {
        setDailyStartValue(Number(parsed.value));
        return;
      }
    } catch {}
  }

  const startingValue = Number(balance || 0);

  localStorage.setItem(
    storageKey,
    JSON.stringify({ date: today, value: startingValue })
  );

  setDailyStartValue(startingValue);
}, [authSession?.user?.id]);

  
// Supabase authentication and persistent session
useEffect(() => {
  if (!supabase) {
    setAuthSession(null);
    setIsAdmin(false);
    setAdminProfileLoaded(true);
    return;
  }

  let active = true;

  const loadRole = async (session) => {
    if (!active) return;

    setAuthSession(session || null);

    if (!session?.user?.id) {
      setIsAdmin(false);
      setAdminOpen(false);
      setProfileName('');
      setProfileEmail('');
      setAdminProfileLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role,display_name,email,virtual_balance,btc_balance,eth_balance,coin_wallets')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!active) return;

    setProfileName(
      data?.display_name ||
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.display_name ||
      ''
    );

    setProfileEmail(session.user.email || session.user.phone || '');

    setIsAdmin(!error && data?.role === 'admin');

    if (!error && data?.role === 'admin' && isAdminRoute) {
      setAdminOpen(true);
    }

    if (!error && data) {
      setBtcBalance(Number(data.btc_balance || 0));
setEthBalance(Number(data.eth_balance || 0));
      if (Number.isFinite(Number(data.virtual_balance))) {
        setBalance(Number(data.virtual_balance));
      }

      if (data.coin_wallets) {
        setCoinWallets(data.coin_wallets);
      }
    }

    setAdminProfileLoaded(true);
  };

  // Restore the existing login session.
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Session restore failed:', error.message);
    }

    if (active) loadRole(data?.session || null);
  });

  // Listen for login, logout and token refresh.
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!active) return;

      setAuthSession(session || null);

      if (session?.user?.id) {
        setTimeout(() => {
          if (active) loadRole(session);
        }, 0);
      } else {
        setIsAdmin(false);
        setAdminOpen(false);
        setProfileName('');
        setProfileEmail('');
        setAdminProfileLoaded(true);
      }
    }
  );

  return () => {
    active = false;
    authListener.subscription.unsubscribe();
  };
}, []);

  // Load every member's latest balance for the admin panel.
  useEffect(() => {
    if (!supabase || !isAdmin || !authSession?.user?.id) {
      setMembers([]);
      return;
    }

    let active = true;

    const loadMembers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, virtual_balance')
        .order('created_at', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('Admin member balance loading failed:', error.message);
        return;
      }

      setMembers((data || []).map(member => ({
        id: member.id,
        email: member.email || '',
        name: member.display_name || '',
        balance: Number(member.virtual_balance || 0)
      })));
    };

    loadMembers();

    const channel = supabase
      .channel('admin-members-balance-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          if (active) loadMembers();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [isAdmin, authSession?.user?.id]);
  useEffect(() => {
  if (!supabase || !isAdmin || !authSession?.user?.id) {
    setRequests([]);
    return;
  }

  let active = true;

  const loadFundingRequests = async () => {
    const { data, error } = await supabase.rpc(
      'admin_list_funding_requests'
    );
    if (!active) return;

    if (error) {
      console.error('Admin funding requests load failed:', error.message);
      setToast('Could not load funding requests: ' + error.message);
      return;
    }

      setRequests((data || []).map(row => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  method: row.method || '',
  currency: row.currency || '',
  amount: Number(row.amount || 0),
  paymentAmountUsd: Number(row.payment_amount_usd || 0),
  adminCreditAmount: Number(
    row.admin_credit_amount ?? row.amount ?? 0
  ),
  status: row.status,
  created: row.created,
  adminNote: row.admin_note || '',
  address: row.address || '',
  proof_path: row.proof_path || ''
})));
  };

  loadFundingRequests();

  const channel = supabase
    .channel('admin-funding-requests-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'deposit_requests'
      },
      () => {
        if (active) loadFundingRequests();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'withdrawal_requests'
      },
      () => {
        if (active) loadFundingRequests();
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}, [isAdmin, authSession?.user?.id]);
useEffect(() => {
  const userId = authSession?.user?.id;

  if (!supabase || !userId) {
    setTradeHistory([]);
    return;
  }

  let active = true;

  
const refreshAccount = async () => {
  const [
  { data: profile, error: profileError },
  { data: rows, error: tradeError },
  { data: withdrawRows, error: withdrawError },
  { data: depositRows, error: depositError }
] = await Promise.all([
    supabase
      .from('profiles')
      .select('virtual_balance, btc_balance, eth_balance, coin_wallets')
      .eq('id', userId)
      .maybeSingle(),

    supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('opened_at', { ascending: false })
      .limit(100),

    supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

    if (!active) return;
    if (depositError) {
  console.error('Deposit history error:', depositError.message);
} else {
  const loadedDeposits = (depositRows || []).map(row => ({
    id: row.id,
    type: 'Deposit',
    method: row.method || row.network || '',
    amount: Number(row.amount),
    status: row.status,
    created: row.created_at,
    proof_path: row.proof_path || row.proof_url || '',
    adminNote: row.admin_note || ''
  }));

    if (!isAdmin) {
    setRequests(current => [
      ...current.filter(r => r.type !== 'Deposit'),
      ...loadedDeposits
    ]);
  }
}

    if (profileError) {
      console.error('Balance load error:', profileError.message);
    } else if (profile) {
  setBalance(Number(profile.virtual_balance || 0));
  setBtcBalance(Number(profile.btc_balance || 0));
  setEthBalance(Number(profile.eth_balance || 0));

  if (profile.coin_wallets) {
    setCoinWallets(profile.coin_wallets);
  }
}

    if (tradeError) {
  console.error('Trade history error:', tradeError.message);
} else {
  setTradeHistory((rows || []).map(row => ({
      id: row.id,
      symbol: row.market,
      assetName: row.market,
      direction: row.trade_type,
      amount: Number(row.amount),
      duration: Number(row.duration_seconds),
      virtualRate: Number(row.profit_percentage) / 100,
      openPrice: Number(row.entry_price),
      price: Number(row.entry_price),
      targetPrice: row.target_price == null
        ? null : Number(row.target_price),
      endPrice: row.close_price == null
        ? null : Number(row.close_price),
      profit: Number(row.profit_loss || 0),
      done: ['won', 'lost', 'cancelled'].includes(row.status),
      startedAt: row.opened_at,
      openTime: row.opened_at,
      closeTime: row.closed_at,
      resultAt: row.closed_at
        ? new Date(row.closed_at).toLocaleTimeString()
        : '',
      endCandles: row.snapshot?.candles || [],
      startCandles: []
      })));
}
    if (withdrawError) {
      console.error('Withdraw history error:', withdrawError.message);
    } else {
      const loadedWithdrawals = (withdrawRows || []).map(row => ({
        id: row.id,
        type: 'Withdraw',
        method: row.method,
        amount: Number(row.amount),
        address: row.wallet_address,
        status: row.status,
        created: row.created_at,
        adminNote: row.admin_note || ''
      }));

            if (!isAdmin) {
        setRequests(current => [
          ...current.filter(r => r.type !== 'Withdraw'),
          ...loadedWithdrawals
        ]);
      }
    }
  };

  refreshAccount();

  const channel = supabase
    .channel(`igtrade-account-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      payload => {
       if (active && payload.new) {
  setBalance(Number(payload.new.virtual_balance || 0));
  setBtcBalance(Number(payload.new.btc_balance || 0));
  setEthBalance(Number(payload.new.eth_balance || 0));

  if (payload.new.coin_wallets) {
    setCoinWallets(payload.new.coin_wallets);
  }
}
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `user_id=eq.${userId}`
      },
      () => {
        if (active) refreshAccount();
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}, [authSession?.user?.id, isAdmin]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    if (!supabase) return setToast('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart Vite.')
    const rawIdentifier = authIdentifier.trim()
    const identifier = rawIdentifier.includes('@') || rawIdentifier.startsWith('+') ? rawIdentifier : (countryCode ? `${countryCode}${rawIdentifier.replace(/^0+/, '')}` : rawIdentifier)
    if (!identifier || !authPassword) return setToast('Enter your email or phone and password.')
    if (authMode === 'register') {
      if (!rawIdentifier.includes('@') && !rawIdentifier.startsWith('+') && !countryCode) return setToast('Select your phone country code first.')
      if (!authName.trim()) return setToast('Enter your full name.')
      if (authPassword.length < 6) return setToast('Password must contain at least 6 characters.')
      if (authPassword !== authConfirm) return setToast('Passwords do not match.')
    }
    setAuthBusy(true)
    try {
      const isPhone = !identifier.includes('@')
      let result
      if (authMode === 'register') {
        const payload = { password: authPassword, options: { data: { full_name: authName.trim() } } }
        if (isPhone) payload.phone = identifier
        else payload.email = identifier
        result = await supabase.auth.signUp(payload)
      } else {
        result = await supabase.auth.signInWithPassword(isPhone ? { phone: identifier, password: authPassword } : { email: identifier, password: authPassword })
      }
      if (result.error) throw result.error
      if (authMode === 'register' && !result.data?.session) {
        setToast(isPhone ? 'Registration submitted. Complete the SMS verification if enabled in Supabase.' : 'Registration submitted. Check your email for the confirmation link.')
      } else {
        setAuthSession(result.data.session || null)
        setLoginOpen(false)
        setToast(authMode === 'register' ? 'Account created and signed in.' : 'Signed in successfully.')
      }
      if (result.data?.session) {
                if (authMode !== 'register') await trackActivity('login');
        const { data: profile } = await supabase.from('profiles').select('role,virtual_balance,btc_balance,eth_balance,coin_wallets').eq('id', result.data.session.user.id).maybeSingle()
        if (profile?.coin_wallets) {
  setCoinWallets(profile.coin_wallets);
}
        setIsAdmin(profile?.role === 'admin')
        if (profile?.role === 'admin' && isAdminRoute) setAdminOpen(true)
        if (profile && Number.isFinite(Number(profile.virtual_balance))) setBalance(Number(profile.virtual_balance))
          if (profile) {
  setBtcBalance(Number(profile.btc_balance || 0));
  setEthBalance(Number(profile.eth_balance || 0));
}
    if (profile?.coin_wallets) {
  setCoinWallets(profile.coin_wallets);
}
      }
    } catch (error) {
      setToast(error?.message || 'Authentication failed. Check Supabase Auth settings.')
    } finally { setAuthBusy(false) }
  }
  const markets = [
  ...marketDefinitions
    .filter(m => m.kind !== 'Crypto')
    .map(m => ({
      ...m,
      ...(livePrices[m.symbol] || {}),
      price: livePrices[m.symbol]?.price ?? null,
      change: livePrices[m.symbol]?.change ?? null
    })),
  ...cryptoMarkets
];
  const asset = markets.find(m => m.symbol === selected) || markets[0]

const buyCryptoMarketPrice = Number(
  markets.find(m => m.symbol === buyCryptoCoin)?.price || 0
);

const estimatedBuyCrypto =
  buyCryptoMarketPrice > 0 && Number(buyCryptoAmount) > 0
    ? Number(buyCryptoAmount) / buyCryptoMarketPrice
    : null;
useEffect(() => {
  let retryTimer;
  let closed = false;

  const streams = cryptoMarkets
    .map(m => m.pair.toLowerCase())
    .flatMap(s => [
      `${s}@ticker`,
      `${s}@kline_${chartTimeframe}`
    ])
    .join('/');

  let cryptoSocket;

  const connectCrypto = () => {
    if (closed || !streams) return;

    cryptoSocket = new WebSocket(
      `wss://data-stream.binance.vision:443/stream?streams=${streams}`
    );

    cryptoSocket.onopen = () => {
      setMarketConnection(v => ({ ...v, crypto: 'live' }));
    };

    cryptoSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const d = message.data;

        if (!d) return;

        if (d.e === '24hrTicker') {
          const symbol = d.s.replace('USDT', '');

          setLivePrices(prev => ({
            ...prev,
            [symbol]: {
              price: Number(d.c),
              change: Number(d.P),
              updatedAt: Date.now(),
              source: 'Binance live'
            }
          }));
        }

        if (d.e === 'kline') {
          const symbol = d.s.replace('USDT', '');
          const k = d.k;

          setLiveCandles(prev => {
            const next = [...(prev[symbol] || [])];

           const candle = {
  time: Number(k.t),
  open: Number(k.o),
  high: Number(k.h),
  low: Number(k.l),
  close: Number(k.c),
  up: Number(k.c) >= Number(k.o)
};

            const last = next[next.length - 1];

            if (last?.time === candle.time) {
              next[next.length - 1] = candle;
            } else {
              next.push(candle);
            }

            return {
              ...prev,
              [symbol]: next.slice(-500)
            };
          });
        }
      } catch (error) {
        console.error('Binance WebSocket error:', error);
      }
    };

    cryptoSocket.onerror = () => {
      setMarketConnection(v => ({
        ...v,
        crypto: 'disconnected'
      }));
    };

    cryptoSocket.onclose = () => {
      setMarketConnection(v => ({
        ...v,
        crypto: 'reconnecting'
      }));

      if (!closed) {
        retryTimer = setTimeout(connectCrypto, 2500);
      }
    };
  };

  connectCrypto();

  const providerSymbols = {
    USDT: 'USDT/USD',
    AAPL: 'AAPL',
    NVDA: 'NVDA',
    TSLA: 'TSLA',
    GBPUSD: 'GBP/USD',
    EURUSD: 'EUR/USD',
    USDJPY: 'USD/JPY',
    SPX: 'SPX',
    NDX: 'NDX',
    DAX: 'DAX',
    DJI: 'DJI'
  };

  let pricePollTimer;
  let pricePollStopped = false;

  const updateOtherPrices = async () => {
    if (closed || pricePollStopped) return;

    const symbols = Object.entries(providerSymbols);

    await Promise.allSettled(
      symbols.map(async ([symbol, providerSymbol]) => {
        const url = new URL('/api/market', window.location.origin);
        url.searchParams.set('symbol', providerSymbol);

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const price = Number(data.price);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Invalid market price');
        }

        const now = Date.now();

        setLivePrices(prev => {
          const old = prev[symbol] || {};
          const base = old.sessionStartPrice || old.price || price;
          const change = base
            ? ((price - base) / base) * 100
            : null;

          return {
            ...prev,
            [symbol]: {
              ...old,
              price,
              change,
              sessionStartPrice: base,
              updatedAt: now,
              source: 'Twelve Data API'
            }
          };
        });
      })
    );

    if (!closed && !pricePollStopped) {
      setMarketConnection(v => ({
        ...v,
        other: 'polling API'
      }));

      pricePollTimer = setTimeout(updateOtherPrices, 15000);
    }
  };

  updateOtherPrices();

  return () => {
    closed = true;
    pricePollStopped = true;

    clearTimeout(retryTimer);
    clearTimeout(pricePollTimer);

    cryptoSocket?.close();
  };
}, [cryptoMarkets, chartTimeframe]);

  useEffect(() => {
  if (!authSession?.user?.id) return;

  trackActivity('page_view', String(page).toLowerCase());
}, [page, authSession?.user?.id]);
  // Load historical candles for the selected market and chart timeframe.
useEffect(() => {
  const market = [
  ...marketDefinitions,
  ...cryptoMarkets
].find(m => m.symbol === selected)

  if (!market || market.symbol === 'XAU') return

  const controller = new AbortController()

  const loadHistoricalCandles = async () => {
    try {
      setMarketConnection(v => ({
        ...v,
        [market.kind === 'Crypto' ? 'crypto' : 'other']: 'loading historical candles'
      }))

      let candles = []

      if (market.kind === 'Crypto') {
        // Actual Binance historical candles
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${market.pair}&interval=${chartTimeframe}&limit=500`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Binance history HTTP ${response.status}`)
        }

        const data = await response.json()

        
candles = data.map(k => ({
  time: Number(k[0]),
  open: Number(k[1]),
  high: Number(k[2]),
  low: Number(k[3]),
  close: Number(k[4]),
  volume: Number(k[5]),
  quoteVolume: Number(k[7]),
  up: Number(k[4]) >= Number(k[1])
}));

      } else {
        // Other markets use your existing /api/market backend.
        const providerSymbols = {
          AAPL: 'AAPL',
          NVDA: 'NVDA',
          TSLA: 'TSLA',
          GBPUSD: 'GBP/USD',
          EURUSD: 'EUR/USD',
          USDJPY: 'USD/JPY',
          SPX: 'SPX',
          NDX: 'NDX',
          DAX: 'DAX',
          DJI: 'DJI'
        }

        const providerSymbol = providerSymbols[market.symbol]
        if (!providerSymbol) return

        const url = new URL('/api/market', window.location.origin)
        url.searchParams.set('symbol', providerSymbol)
        url.searchParams.set('type', 'candles')
        url.searchParams.set('interval', chartTimeframe)
        url.searchParams.set('outputsize', '500')

        const response = await fetch(url.toString(), {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(`Candle API HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.status === 'error' || !Array.isArray(data.values)) {
          throw new Error(data.message || 'No historical candle data returned')
        }

        candles = data.values.map(v => ({
          time: Date.parse(
            v.datetime.replace(' ', 'T') +
            (v.datetime.includes('Z') ? '' : 'Z')
          ),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
          up: Number(v.close) >= Number(v.open)
        }))
      }

      if (controller.signal.aborted) return

      candles = candles.filter(c =>
        Number.isFinite(c.time) &&
        [c.open, c.high, c.low, c.close].every(Number.isFinite)
      )

      if (!candles.length) {
        throw new Error('No valid historical candles found')
      }

      setLiveCandles(prev => ({
        ...prev,
        [market.symbol]: candles
      }))

      const last = candles[candles.length - 1]

      setLivePrices(prev => {
        const old = prev[market.symbol] || {}

        return {
          ...prev,
          [market.symbol]: {
            ...old,
            price: old.price ?? last.close,
            updatedAt: old.updatedAt ?? Date.now(),
            source: market.kind === 'Crypto'
              ? 'Binance historical data'
              : 'Market historical data'
          }
        }
      })

      setMarketConnection(v => ({
        ...v,
        [market.kind === 'Crypto' ? 'crypto' : 'other']: 'historical data loaded'
      }))
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Historical candle loading failed:', error.message)

        setMarketConnection(v => ({
          ...v,
          [market.kind === 'Crypto' ? 'crypto' : 'other']: 'historical data unavailable'
        }))
      }
    }
  }

  loadHistoricalCandles()

  return () => controller.abort()
}, [selected, chartTimeframe])

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });

      caches.delete('igtrade-shell-v1');
    } else {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  const handler = (event) => {
    event.preventDefault();
    setInstallPrompt(event);
  };

  window.addEventListener('beforeinstallprompt', handler);

  return () => window.removeEventListener('beforeinstallprompt', handler);
 
}, []);
 // Gold simulated market: price stays between 3980 and 4095.
useEffect(() => {
  const MIN_PRICE = 3980;
  const MAX_PRICE = 4095;
  const START_PRICE = 4037.5;

  let price = START_PRICE;
  let candleOpen = START_PRICE;
  let candleHigh = START_PRICE;
  let candleLow = START_PRICE;
  let candleTime = Math.floor(Date.now() / 30000) * 30000;
  let sessionStart = START_PRICE;

  const initialCandles = Array.from({ length: 40 }, (_, i) => {
    const base = START_PRICE + (Math.random() - 0.5) * 12;
    const open = Math.max(MIN_PRICE, Math.min(MAX_PRICE, base));
    const close = Math.max(
      MIN_PRICE,
      Math.min(MAX_PRICE, open + (Math.random() - 0.5) * 5)
    );

    return {
      time: candleTime - (39 - i) * 30000,
      open,
      high: Math.max(open, close) + Math.random() * 1.5,
      low: Math.min(open, close) - Math.random() * 1.5,
      close,
      up: close >= open,
      simulated: true
    };
  });

  const lastInitial = initialCandles[initialCandles.length - 1];
  price = lastInitial.close;
  candleOpen = price;
  candleHigh = price;
  candleLow = price;

  setLivePrices(prev => ({
    ...prev,
    XAU: {
      price,
      change: 0,
      sessionStartPrice: sessionStart,
      updatedAt: Date.now(),
      source: 'Simulated Gold Market'
    }
  }));

  setLiveCandles(prev => ({
    ...prev,
    XAU: initialCandles
  }));

  setMarketConnection(prev => ({
    ...prev,
    gold: 'simulated'
  }));

  const timer = setInterval(() => {
    const now = Date.now();
    const movement = (Math.random() - 0.49) * 1.8;

    price = Math.max(
      MIN_PRICE,
      Math.min(MAX_PRICE, price + movement)
    );

    const nextCandleTime = Math.floor(now / 30000) * 30000;

    if (nextCandleTime !== candleTime) {
      candleTime = nextCandleTime;
      candleOpen = price;
      candleHigh = price;
      candleLow = price;
    } else {
      candleHigh = Math.max(candleHigh, price);
      candleLow = Math.min(candleLow, price);
    }

   
const candle = {
  time: candleTime,
  open: candleOpen,
  high: candleHigh,
  low: candleLow,
  close: price,
  volume: 0,
  quoteVolume: 0,
  trades: 0,
  up: price >= candleOpen,
  simulated: true
};

    setLivePrices(prev => ({
      ...prev,
      XAU: {
        ...prev.XAU,
        price,
        change: ((price - sessionStart) / sessionStart) * 100,
        updatedAt: now,
        source: 'Simulated Gold Market'
      }
    }));

    setLiveCandles(prev => {
      const next = [...(prev.XAU || [])];
      const last = next[next.length - 1];

      if (last?.time === candle.time) {
        next[next.length - 1] = candle;
      } else {
        next.push(candle);
      }

      return {
        ...prev,
        XAU: next.slice(-60)
      };
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);
  const installApp = async () => {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null) }
    else setToast('Android/desktop: use your browser menu → Install app or Add to Home Screen. On iPhone: Safari Share → Add to Home Screen.')
  }
 
const adjustMemberBalance = async (action = memberAction) => {
  if (!supabase) {
    setToast("Supabase connection is unavailable.");
    return;
  }

  const email = memberEmail.trim().toLowerCase();
  const amount = Number(memberAmount);

  if (!email || !Number.isFinite(amount) || amount <= 0) {
    setToast("Enter a valid member email and amount.");
    return;
  }

  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, virtual_balance")
    .ilike("email", email)
    .maybeSingle();

  if (findError) {
    setToast("Could not find member: " + findError.message);
    return;
  }

  if (!profile) {
    setToast("Member not found in profiles.");
    return;
  }

  const current = Number(profile.virtual_balance ?? 0);
  const next =
    action === "add"
      ? current + amount
      : current - amount;

  if (next < 0) {
    setToast("Insufficient balance to deduct that amount.");
    return;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ virtual_balance: next })
    .eq("id", profile.id)
    .select("id, virtual_balance")
    .maybeSingle();

  if (updateError) {
    setToast("Balance update failed: " + updateError.message);
    return;
  }

  if (!updated) {
    setToast("Update blocked. Check Supabase RLS policies.");
    return;
  }

  setMembers(currentMembers =>
    currentMembers.map(m =>
      m.email?.toLowerCase() === email
        ? { ...m, balance: Number(updated.virtual_balance) }
        : m
    )
  );

  setToast(
    `Balance updated successfully. New balance: ${updated.virtual_balance} USDT`
  );
};

  const filterMarkets = markets.filter(m => {
  const matchesFilter =
    marketFilter === 'All' || m.kind === marketFilter;

  const searchText = marketSearch.trim().toLowerCase();

  const matchesSearch =
    !searchText ||
    m.symbol?.toLowerCase().includes(searchText) ||
    m.pair?.toLowerCase().includes(searchText) ||
    m.name?.toLowerCase().includes(searchText);

  return matchesFilter && matchesSearch;
});

  useEffect(() => {
    if (!trade || remaining <= 0) return
    const timer = setTimeout(() => setRemaining(v => Math.max(0, v - 1)), 1000)
    return () => clearTimeout(timer)
  }, [trade, remaining])

  useEffect(() => {
    if (trade && remaining === 0 && !trade.done && !trade.awaitingDone) {
      setTrade(current => current ? { ...current, awaitingDone: true, endPrice: livePrices[current.symbol]?.price ?? current.openPrice, endCandles: [...(liveCandles[current.symbol] || [])] } : current)
      setToast('Trade timer ended. Review the closing price and press Done to save this trade to history.')
    }
  }, [remaining, trade, livePrices, liveCandles])

  const settledTradeIds = useRef(new Set());

  
const finishTrade = async () => {
  if (!trade || trade.done || !trade.awaitingDone) return;

  const tradeId = trade.id;

  if (settledTradeIds.current.has(tradeId)) return;
  settledTradeIds.current.add(tradeId);

  if (!supabase || !authSession?.user?.id) {
    settledTradeIds.current.delete(tradeId);
    return setToast('Please sign in to save this trade.');
  }

  const closingPrice =
    livePrices[trade.symbol]?.price ??
    trade.endPrice ??
    trade.openPrice;

  try {
    const { data, error } = await supabase.rpc(
      'igtrade_settle_virtual_trade',
      {
        p_trade_id: tradeId,
        p_close_price: Number(closingPrice),
        p_target_price: Number(trade.targetPrice),
        p_snapshot: {
          candles: liveCandles[trade.symbol] || trade.endCandles || []
        }
      }
    );

    if (error) throw error;

    const profit = Number(data?.profit);
    const nextBalance = Number(data?.balance);

    if (!Number.isFinite(profit) || !Number.isFinite(nextBalance)) {
      throw new Error('Invalid Supabase settlement response.');
    }

    const result = {
      ...trade,
      done: true,
      awaitingDone: false,
      endPrice: closingPrice,
      closeTime: new Date().toLocaleString(),
      profit,
      resultAt: new Date().toLocaleTimeString(),
      endCandles: [...(
        liveCandles[trade.symbol] || trade.endCandles || []
      )]
    };

    setBalance(nextBalance);
    setTrade(result);

    setTradeHistory(history => [
      result,
      ...history.filter(item => item.id !== result.id)
    ]);

    setToast(
  `Trade completed. Profit: ${money(profit)}`
);

  } catch (error) {
    settledTradeIds.current.delete(tradeId);
    console.error('Trade settlement failed:', error);
    setToast(`Could not save trade: ${error.message}`);
  }
};


  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  
const startTrade = async () => {
  const n = Number(amount);

  const limits = duration === 30
    ? [20, 10000]
    : duration === 60
      ? [12000, 30000]
      : [35000, 99000];

  if (n < limits[0] || n > limits[1]) {
    return setToast(
      `For ${duration}s trades, amount must be ${money(limits[0])}–${money(limits[1])}.`
    );
  }

  if (n > balance) {
    return setToast('Not enough available balance');
  }

  if (trade && !trade.done) {
    return setToast('Finish the current trade first.');
  }

  if (asset.price == null) {
    return setToast('Live price is not connected.');
  }

  if (!supabase || !authSession?.user?.id) {
    return setToast('Please sign in before trading.');
  }

  if (tradeStarting) return;

  const rate = duration === 30 ? 0.20
    : duration === 60 ? 0.40 : 0.80;

  const targetPrice = Number(
    (asset.price * (
      direction === 'BUY'
        ? 1 + rate / 100
        : 1 - rate / 100
    )).toFixed(asset.price < 10 ? 5 : 2)
  );

  setTradeStarting(true);

  try {
    const { data, error } = await supabase.rpc(
      'igtrade_start_virtual_trade',
      {
        p_market: asset.symbol,
        p_trade_type: direction,
        p_amount: n,
        p_duration_seconds: duration,
        p_entry_price: Number(asset.price),
        p_profit_percentage: Math.round(rate * 100),
        p_target_price: targetPrice
      }
    );

    if (error) throw error;

    const nextBalance = Number(data?.balance);

    if (!data?.trade_id || !Number.isFinite(nextBalance)) {
      throw new Error('Invalid Supabase trade response.');
    }

    setBalance(nextBalance);

    setTrade({
      id: data.trade_id,
      symbol: asset.symbol,
      assetName: asset.name,
      price: asset.price,
      openPrice: asset.price,
      targetPrice,
      endPrice: null,
      amount: n,
      duration,
      direction,
      virtualRate: rate,
      startedAt: new Date().toLocaleString(),
      openTime: new Date().toLocaleString(),
      done: false,
      awaitingDone: false,
      startCandles: [...(liveCandles[asset.symbol] || [])]
    });

    setTradeFullscreen(true);
setPage('Trade');
setRemaining(duration);
setToast('Trade started');

  } catch (error) {
    console.error('Trade start failed:', error);
    setToast(`Trade failed: ${error.message}`);
  } finally {
    setTradeStarting(false);
  }
};
const saveWalletSettings = async (qrFiles) => {
  if (!supabase || !authSession?.user?.id) {
    return setToast('Please sign in as admin first.');
  }

  const networks = [
    { key: 'TRC20', currency: 'USDT', network: 'TRC20' },
    { key: 'BTC', currency: 'BTC', network: 'Bitcoin network' },
    { key: 'ETH', currency: 'ETH', network: 'Ethereum (ERC20)' }
  ];

  try {
    setToast('Saving wallet settings...');

    const updatedQrCodes = { ...walletQrCodes };

    for (const item of networks) {
      const file = qrFiles?.[item.key];
      let qrPath = null;

      if (file) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${item.key}: Please select an image.`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${item.key}: Image must be under 5 MB.`);
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
        qrPath = `wallet-qr/${item.key}-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('deposit-qr-codes')
          .upload(qrPath, file, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('deposit-qr-codes')
          .getPublicUrl(qrPath);

        updatedQrCodes[item.key] = publicData.publicUrl;
      }

      const updateValues = {
        wallet_address: walletAddresses[item.key] || ''
      };

      if (qrPath) updateValues.qr_path = qrPath;

      const { data: existing, error: findError } = await supabase
        .from('deposit_addresses')
        .select('id')
        .eq('currency', item.currency)
        .eq('network', item.network)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase
          .from('deposit_addresses')
          .update(updateValues)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('deposit_addresses')
          .insert({
            currency: item.currency,
            network: item.network,
            ...updateValues,
            is_active: true
          });

        if (error) throw error;
      }
    }

    setWalletQrCodes(updatedQrCodes);
    setToast('Wallet addresses and QR codes saved successfully.');
    return true;

  } catch (error) {
    console.error('Wallet settings save failed:', error);
    setToast(`Wallet save failed: ${error.message}`);
    return false;
  }
};

 

const submitDeposit = async (e) => {
  e.preventDefault();

  // User-entered USD amount
  const n = Number(depositAmount);

  const selectedAsset = depositAssets.find(
    item => String(item.id) === String(selectedDepositAssetId)
  );

  if (!selectedAsset) {
    return setToast('Please select an available deposit coin and network.');
  }

  const currency = selectedAsset.currency;
  const network = selectedAsset.network;
  const userId = authSession?.user?.id;

  if (!supabase || !userId) {
    return setToast('Please log in first.');
  }

  if (!Number.isFinite(n) || n <= 0) {
    return setToast('Enter a valid USD amount.');
  }

  // Minimum $50 for USDT TRC20
  if (
    currency === 'USDT' &&
    network.toUpperCase().includes('TRC20') &&
    n < 50
  ) {
    return setToast('Minimum USDT deposit request is $50 USD.');
  }

  // Require an available live conversion price
  if (!Number.isFinite(selectedDepositPrice) || selectedDepositPrice <= 0) {
    return setToast('Live conversion price is unavailable. Please try again later.');
  }

  // Calculate crypto amount from USD
  const cryptoAmount = n / selectedDepositPrice;

  if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) {
    return setToast('Unable to calculate the crypto amount.');
  }

  if (!selectedAsset.wallet_address) {
    return setToast('Deposit address is not configured yet.');
  }

  try {
    let proofPath = null;

    if (depositFile?.file) {
      setToast('Uploading screenshot...');
      proofPath = await uploadDepositProof(depositFile.file, userId);
    }

    const { data, error } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: userId,
        amount: cryptoAmount,
        admin_credit_amount: cryptoAmount,
        payment_amount_usd: n,
        method: network,
        network: network,
        currency: currency,
        proof_url: proofPath,
        proof_path: proofPath,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;

    setRequests(r => [
      {
        id: data.id,
        type: 'Deposit',
        method: data.method,
        currency: currency,
        amount: Number(data.amount),
        paymentAmountUsd: Number(data.payment_amount_usd || n),
        adminCreditAmount: Number(
          data.admin_credit_amount ?? cryptoAmount
        ),
        status: data.status,
        created: data.created_at,
        proof_path: data.proof_path || data.proof_url
      },
      ...r
    ]);

    setToast('Deposit request submitted successfully.');
    setDepositFile(null);
    setDepositAmount('');

    const receiptInput = document.getElementById('receipt');

    if (receiptInput) {
      receiptInput.value = '';
    }

  } catch (error) {
    console.error('Deposit submission failed:', error);
    setToast(`Deposit failed: ${error.message}`);
  }
};

const withdrawCurrency =
  withdrawMethod === 'TRC20' ? 'USDT' : withdrawMethod;

const withdrawAvailableBalance =
  withdrawCurrency === 'USDT'
    ? Number(balance || 0)
    : withdrawCurrency === 'BTC'
      ? Number(btcBalance || 0)
      : Number(ethBalance || 0);
const submitWithdraw = async (e) => {
  e.preventDefault();

  const n = Number(withdrawAmount);
  const address = withdrawAddress.trim();

  const minimumAmount =
    withdrawCurrency === 'USDT' ? 1 : 0.00000001;

  if (!address || !Number.isFinite(n) || n <= 0) {
    return setToast('Enter a destination address and valid amount.');
  }

  if (n < minimumAmount) {
    return setToast(`Minimum withdrawal is ${minimumAmount} ${withdrawCurrency}.`);
  }

  if (n > withdrawAvailableBalance) {
    return setToast(`Insufficient ${withdrawCurrency} balance.`);
  }

  if (!supabase) {
    return setToast('Supabase is not configured.');
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return setToast('Please sign in before submitting a withdrawal request.');
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: user.id,
      amount: n,
      currency: withdrawCurrency,
      method: withdrawMethod,
      wallet_address: address,
      status: 'Pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Withdrawal submission failed:', error);
    return setToast(`Withdrawal failed: ${error.message}`);
  }

  setRequests(r => [
    {
      id: data.id,
      type: 'Withdraw',
      method: data.method,
      currency: data.currency,
      amount: Number(data.amount),
      address: data.wallet_address,
      status: data.status,
      created: data.created_at
    },
    ...r
  ]);

  setToast('Withdrawal request submitted');
  setWithdrawAddress('');
  setWithdrawAmount('');
};


  const approveRequest = async (id, status, adminNote = '') => {
  const request = requests.find(r => r.id === id);

  if (!supabase || !isAdmin) {
    return setToast('Admin access required.');
  }

  if (!request || request.status !== 'Pending') {
    return setToast('This request has already been reviewed.');
  }

  if (status === 'Rejected' && !String(adminNote).trim()) {
    return setToast('Write a rejection reason before rejecting.');
  }

  const requestType =
    request.type === 'Withdraw' ? 'Withdrawal' : request.type;

  if (!['Deposit', 'Withdrawal'].includes(requestType)) {
    return setToast('Invalid request type.');
  }

  try {
    const { data, error } = await supabase.rpc(
      'admin_review_funding_request',
      {
        p_request_id: id,
        p_request_type: requestType,
        p_status: status,
        p_admin_note: String(adminNote || '').trim()
      }
    );

    if (error) throw error;
    if (!data?.success) {
      throw new Error('Request review was not confirmed.');
    }

    setRequests(current =>
      current.map(r =>
        r.id === id
          ? {
              ...r,
              status: data.status,
              adminNote: String(adminNote || '').trim(),
              reviewedAt: new Date().toISOString()
            }
          : r
      )
    );

    setToast(
      status === 'Approved'
        ? requestType === 'Withdrawal'
          ? 'Withdrawal Successfully Completed.'
          : 'Deposit Successfully Approved.'
        : `${requestType} request rejected successfully.`
    );

  } catch (error) {
    console.error('Funding request review failed:', error);
    console.error('WITHDRAWAL APPROVAL ERROR DETAILS:', error);
    setToast('Approval failed: ' + error.message);
  }
};

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast('Copied.') }
    catch { setToast('Copy not available in this browser.') }
  }

const selectedDepositAsset = depositAssets.find(
  item => String(item.id) === String(selectedDepositAssetId)
);

const selectedDepositPrice = (() => {
  const symbol = String(
    selectedDepositAsset?.currency || ''
  ).toUpperCase();

  if (!symbol) return 0;

  const binanceMarket = cryptoMarkets.find(
    market =>
      String(market.symbol).toUpperCase() === symbol &&
      Number(market.price) > 0
  );

  if (binanceMarket) {
    return Number(binanceMarket.price);
  }

  const coinGeckoMarket = cryptoRanking.find(
    market =>
      String(market.symbol).toUpperCase() === symbol &&
      Number(market.current_price) > 0
  );

  if (coinGeckoMarket) {
    return Number(coinGeckoMarket.current_price);
  }

  return 0;
})();

const estimatedDepositCrypto =
  selectedDepositPrice > 0 && Number(depositAmount) > 0
    ? Number(depositAmount) / selectedDepositPrice
    : 0;
const supportedDepositCoins = [
  { symbol: 'BTC', name: 'Bitcoin', logo: 'btc', fallback: '₿' },
  { symbol: 'ETH', name: 'Ethereum', logo: 'eth', fallback: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', logo: 'usdt', fallback: '₮' },
  { symbol: 'BNB', name: 'BNB', logo: 'bnb', fallback: '◆' },
  { symbol: 'USDC', name: 'USD Coin', logo: 'usdc', fallback: '$' },
  { symbol: 'XRP', name: 'XRP', logo: 'xrp', fallback: '✕' },
  { symbol: 'SOL', name: 'Solana', logo: 'sol', fallback: '◎' },
  { symbol: 'TRX', name: 'TRON', logo: 'trx', fallback: '◆' },
  { symbol: 'HYPE', name: 'Hyperliquid', logo: 'hype', fallback: 'H' },
  { symbol: 'ZEC', name: 'Zcash', logo: 'zec', fallback: 'ⓩ' },
  { symbol: 'DOGE', name: 'Dogecoin', logo: 'doge', fallback: 'Ð' },
  { symbol: 'XMR', name: 'Monero', logo: 'xmr', fallback: 'ɱ' },
  { symbol: 'USDS', name: 'USDS', logo: 'usds', fallback: '$' },
  { symbol: 'WBT', name: 'WhiteBIT Coin', logo: 'wbt', fallback: 'W' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: 'wbtc', fallback: '₿' },
  { symbol: 'WBETH', name: 'Wrapped Beacon ETH', logo: 'wbeth', fallback: 'Ξ' },
  { symbol: 'XLM', name: 'Stellar', logo: 'xlm', fallback: '*' },
  { symbol: 'LINK', name: 'Chainlink', logo: 'link', fallback: '⬡' },
  { symbol: 'ADA', name: 'Cardano', logo: 'ada', fallback: '₳' },
  { symbol: 'USDE', name: 'Ethena USDe', logo: 'usde', fallback: '$' },
  { symbol: 'UNI', name: 'Uniswap', logo: 'uni', fallback: 'U' },
  { symbol: 'DAI', name: 'Dai', logo: 'dai', fallback: '◈' },
  { symbol: 'NEAR', name: 'NEAR Protocol', logo: 'near', fallback: 'N' },
  { symbol: 'BCH', name: 'Bitcoin Cash', logo: 'bch', fallback: '₿' },
  { symbol: 'LTC', name: 'Litecoin', logo: 'ltc', fallback: 'Ł' },
  { symbol: 'AVAX', name: 'Avalanche', logo: 'avax', fallback: '▲' },
  { symbol: 'SUI', name: 'Sui', logo: 'sui', fallback: 'S' },
  { symbol: 'GRAM', name: 'Gram', logo: 'gram', fallback: 'G' },
  { symbol: 'RLUSD', name: 'Ripple USD', logo: 'rlusd', fallback: '$' },
  { symbol: 'XAUT', name: 'Tether Gold', logo: 'xaut', fallback: 'Au' }
];

const depositCurrencies = supportedDepositCoins.filter(coin =>
  depositAssets.some(
    item => item.currency?.toUpperCase() === coin.symbol
  )
);

const selectedCurrencyNetworks = depositAssets.filter(
  item => item.currency?.toUpperCase() === selectedDepositCurrency
);

  if (isAdminRoute && (!authSession || !isAdmin)) {
    return <div className="app-shell admin-login-shell"><main className="main-content" style={{ maxWidth: 560, margin: '10vh auto', padding: 24 }}><div className="panel form-panel"><Logo />{!isSupabaseConfigured && <div className="notice"></div>}</div></main>{loginOpen && <div className="modal-backdrop"><div className="modal panel"><Logo /><form onSubmit={handleAuthSubmit}><label className="field-label">Email or phone</label><input className="text-input" value={authIdentifier} onChange={e => setAuthIdentifier(e.target.value)} required /><label className="field-label">{t('Password')}</label><input className="text-input" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required /><button className="btn btn-gold btn-full" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : 'Admin sign in'}</button></form></div></div>}{toast && <div className="toast">{toast}<button onClick={() => setToast('')}>×</button></div>}</div>
  }

  if (isAdminRoute && authSession && isAdmin) {
    return <div className="app-shell admin-only-shell"><main className="main-content" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}><div className="page-title"><div className="eyebrow">RESTRICTED AREA</div><h1>Admin controls</h1><p className="muted">Signed in as an authorized admin.</p><button className="btn btn-outline" onClick={async () => { await supabase?.auth.signOut(); setAuthSession(null); setIsAdmin(false); setAdminOpen(false); window.location.href = '/' }}>Sign out</button></div><AdminPanel supabase={supabase} adminOpen={true} setAdminOpen={() => { window.location.href = '/' }} tradeEnabled={tradeEnabled} setTradeEnabled={setTradeEnabled} requests={requests} approveRequest={approveRequest} 
    advancedRequests={advancedRequests}
reviewAdvancedRequest={reviewAdvancedRequest}
    memberEmail={memberEmail} setMemberEmail={setMemberEmail} memberAmount={memberAmount} setMemberAmount={setMemberAmount} memberAction={memberAction} setMemberAction={setMemberAction} adjustMemberBalance={adjustMemberBalance} members={members}
walletAddresses={walletAddresses}
setWalletAddresses={setWalletAddresses}
walletQrCodes={walletQrCodes}
saveWalletSettings={saveWalletSettings}
setToast={setToast} telegramUrl={telegramUrl} setTelegramUrl={setTelegramUrl} />{toast && <div className="toast">{toast}<button onClick={() => setToast('')}>×</button></div>}</main></div>
  }
// Require authentication before accessing the website
if (!adminProfileLoaded) {
  return (
    <div className="app-shell">
      <div className="loading-screen">
        Loading...
      </div>
    </div>
  );
}

if (!authSession && !isAdminRoute) {
  return (
    <div className="app-shell">
      <div className="modal-backdrop">
        <div className="modal panel">
          <div className="auth-top-bar">
  <Logo />
<select
  className="auth-language-select"
  value={language}
  onChange={e => setLanguage(e.target.value)}
  aria-label="Select language"
>
  {languageOptions.map(([code, name]) => (
    <option key={code} value={code}>
      {name}
    </option>
  ))}
</select>
  {loginOpen && (
    <button
      type="button"
      className="auth-close-btn"
      onClick={() => setLoginOpen(false)}
    >
      ×
    </button>
  )}
</div>

<h2>
  {t(authMode === 'register' ? 'Create Your Account' : 'Sign in to your account')}
</h2>
          <p className="muted">
  {t('Register or sign in to access IG Trade.')}
</p>

          <div className="auth-tabs">
            <button
              className="btn btn-gold btn-full"
              onClick={() => {
                setAuthMode('register');
                setLoginOpen(true);
              }}
            >
              {t('Register')}
            </button>

            <button
              className="btn btn-outline btn-full"
              onClick={() => {
                setAuthMode('login');
                setLoginOpen(true);
              }}
            >
             {t('Sign in')}
            </button>
          </div>

          {loginOpen && (
  <div className="auth-form-wrapper">
    <div className="auth-form-heading">
      <h3>
        {authMode === 'register'
  ? t('Create Your Account')
  : t('Sign in')}
      </h3>

      
    </div>

    <form onSubmit={handleAuthSubmit}>
              <label className="field-label">{t('Email Address')}</label>

<input
  className="text-input"
  type="email"
  placeholder={t('Enter your email address')}
  value={authIdentifier}
  onChange={e => setAuthIdentifier(e.target.value)}
  required
/>

<small className="input-hint">
  {t('Please enter your valid email address')}
</small>

              <input
                className="text-input"
                value={authIdentifier}
                onChange={e => setAuthIdentifier(e.target.value)}
                required
              />

              {authMode === 'register' && (
                <>
                  <label className="field-label">{t('Full name')}</label>
                  <input
                    className="text-input"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    required
                  />
                  <small className="input-hint">
  {t('Enter your full name')}
</small>
                </>
              )}

              <label className="field-label">{t('Password')}</label>
              <input
  className="text-input"
  type="password"
  placeholder={t('Enter your password')}
  value={authPassword}
  onChange={e => setAuthPassword(e.target.value)}
  minLength={6}
  required
/>

<small className="input-hint">
  {t('Password must be at least 6 characters')}
</small>

              {authMode === 'register' && (
                <>
                  <label className="field-label">{t('Confirm Password')}</label>
                  <input
                    className="text-input"
                    type="password"
                    value={authConfirm}
                    onChange={e => setAuthConfirm(e.target.value)}
                    required
                  />
                  <small className="input-hint">
  {t('Re-enter your password to confirm')}
</small>
                </>
              )}

              <button
                className="btn btn-gold btn-full"
                type="submit"
                disabled={authBusy}
              >
                {authBusy
  ? t('Please wait...')
  : authMode === 'register'
    ? t('Create Account')
    : t('Sign in')}
</button>
                       </form>
          </div>
          )}

          {toast && <div className="toast">{toast}</div>}
        </div>
      </div>
    </div>
  );
}
  return <div className="app-shell" dir={language === 'ar' || language === 'ur' ? 'rtl' : 'ltr'}>
   <header className="topbar">
  <Logo />
  <div className="topbar-right">
    <label className="language-picker-label" aria-label="Select language">
      <span>🌐</span>
      <select
        className="language-picker"
        value={language}
        onChange={e => {
          setLanguage(e.target.value);
          try {
            localStorage.setItem('igtrade-language', e.target.value);
          } catch {}
        }}
        aria-label="Select language"
      >
        {languageOptions.map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </label>

    <span className="virtual-pill">
      <span className="pulse" /> IG Official Platforms
    </span>

    <button className="btn btn-outline install-btn" onClick={installApp}>
      ↓ Install App
    </button>

    <button
      className="btn btn-outline login-btn"
      onClick={() => {
        setAuthMode('login');
        setLoginOpen(true);
      }}
    >
      {t('Sign in')}
    </button>

    <button
      className="btn btn-gold register-btn"
      onClick={() => {
        setAuthMode('register');
        setLoginOpen(true);
      }}
    >
      {t('Register')}
    </button>

    <button className="avatar" onClick={() => setPage('Profile')}>
      IG
    </button>
  </div>
</header>

    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-caption">WORKSPACE</div>
        

<div className="nav-menu">
  {[
    { name: 'Home' },
    { name: 'Trade' },
    { name: 'Dashboard' },
    { name: 'Assets' },
    { name: 'Earn' }
  ].map((item) => (
    <button
      key={item.name}
      onClick={() => setPage(item.name)}
      className={`nav-item ${page === item.name ? 'active' : ''}`}
    >
      <span className="nav-icon">
        {item.name === 'Home' && (
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
          </svg>
        )}
        {item.name === 'Trade' && (
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 7h13l-3-3M17 17H4l3 3M20 7l-3-3M4 17l3 3" />
          </svg>
        )}
        {item.name === 'Dashboard' &&(
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m-5-5 5 5 5-5M4 20h16" />
          </svg>
        )}
        {item.name === 'Assets' && (
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="15" rx="2" />
            <path d="M3 9h18M16 14h2" />
          </svg>
        )}
        {item.name === 'Earn' && (
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7M9 10h6" />
          </svg>
        )}
      </span>
      {t(item.name)}
    </button>
  ))}
</div>


<div className="side-spacer" />
</aside>

      <main className="main-content">
  <WithdrawalTicker />

  {page === 'Home' && <section className="page-section">
          <div className="welcome-row"><div><div className="binance-wallet panel">

  <div className="wallet-heading">
  <span>Estimated Total Value</span>

  <label className="wallet-select-wrap">
    <select
      value={selectedAsset}
      onChange={(e) => setSelectedAsset(e.target.value)}
      className="wallet-currency-select"
    >
      <option value="USDT">USDT</option>
      <option value="BTC">BTC</option>
      <option value="ETH">ETH</option>
      <option value="SOL">SOL</option>
      <option value="EUR">EUR</option>
    </select>
    <span>▼</span>
  </label>
</div>
  <div className="wallet-total">
  ${fundingTotalUSDT.toFixed(2)} USDT
</div>
<div className="wallet-local-currency">
  {localCurrencyRate > 0
    ? `≈ ${localCurrencySymbol}${(fundingTotalUSDT * localCurrencyRate).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${localCurrency}`
    : `Local currency rate unavailable`}
</div>
  <div className="wallet-available">
    ● Available funds · ≈ {availableAmount.toFixed(8)} {selectedAsset}
  </div>

  <div className="wallet-conversion">
    ≈ {availableAmount.toFixed(8)} {selectedAsset}
  </div>

  <div className="wallet-pnl">
    <span>Today's PNL</span>

    <strong className={todaysPNL >= 0 ? 'positive' : 'negative'}>
      {todaysPNL >= 0 ? '+' : '-'}
      {Math.abs(convertedPNL).toFixed(8)} {selectedAsset}
      {' '}
      ({pnlPercentage >= 0 ? '+' : ''}
      {pnlPercentage.toFixed(2)}%)
    </strong>
  </div>

  <button
    className="add-funds-btn"
    onClick={() => setPage('Deposit')}
  >
    + Add funds
  </button>

</div>
<div className="ticker-wrap"></div><div className="eyebrow">LIVE MARKET OVERVIEW</div><h1>Trade CFDs with the world’s No.1 provider1.</h1><p className="hero-subtitle"></p><p className="muted">Go long or short on 17,000+ markets and earn up to $2,500 in cashback.2</p></div></div>
          <div className="ticker-wrap"><div className="ticker-track">{[...markets, ...markets].map((m, i) => <div className="ticker-item" key={`${m.symbol}-${i}`}><strong>{m.name}</strong><span>{quotePrice(m.price, m.symbol)}</span><small className={m.change == null ? '' : m.change >= 0 ? 'positive' : 'negative'}>{m.change == null ? '—' : `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`}</small></div>)}</div></div>
          <div className="section-heading"><div><h2>Access 17,000+ markets all in one</h2></div><div className="filter-tabs">{['All', 'Crypto', 'Commodity', 'Stock', 'Forex', 'Index'].map(f => <button key={f} onClick={() => setMarketFilter(f)} className={marketFilter === f ? 'selected' : ''}>{f === 'Commodity' ? 'Gold' : f === 'Stock' ? 'Stocks' : f}</button>)}</div></div>
          <div className="market-search">
  <input
    type="text"
    value={marketSearch}
    onChange={e => {
  setMarketSearch(e.target.value);
  setCryptoPage(1);
}}
    placeholder="Search markets (BTC, ETH, Bitcoin...)"
    className="market-search-input"
   />
</div>

<div className="market-count">
  Showing {filterMarkets.length} markets
</div>


{/* CoinMarketCap-style Crypto Ranking Table */}
{(marketFilter === 'All' || marketFilter === 'Crypto') && (
  <div className="crypto-ranking-wrap">
    <div className="crypto-ranking-title">
      <h2>Cryptocurrency Rankings</h2>
      <span>{cryptoRanking.length} Coins</span>
    </div>

    <div className="crypto-ranking-scroll">
      <table className="crypto-ranking-table">
        <thead>
          <tr>
  <th>#</th>
  <th>Name</th>
  <th>Price</th>
  <th>24h Volume</th>
  <th>1h</th>
  <th>24h</th>
  <th>7d</th>
  <th>Last 7 Days</th>
  <th>Market Cap</th>
  <th>Circulating Supply</th>
</tr>
        </thead>

        <tbody>
          {paginatedCryptoRanking.map((coin, index) => {
              const money = value =>
                value == null
                  ? '—'
                  : '$' + Number(value).toLocaleString('en-US', {
                      maximumFractionDigits: 2
                    });

              const percent = value =>
                value == null
                  ? '—'
                  : `${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`;

              const supply = coin.circulating_supply == null
                ? '—'
                : Number(coin.circulating_supply).toLocaleString('en-US', {
                    maximumFractionDigits: 2
                  }) + ' ' + coin.symbol.toUpperCase();

              const prices = coin.sparkline_in_7d?.price || [];
              const min = prices.length ? Math.min(...prices) : 0;
              const max = prices.length ? Math.max(...prices) : 0;
              const range = max - min || 1;

              const points = prices.map((price, i) => {
                const x = (i / Math.max(prices.length - 1, 1)) * 100;
                const y = 30 - ((price - min) / range) * 27;
                return `${x},${y}`;
              }).join(' ');

              const oneHour = coin.price_change_percentage_1h_in_currency;
              const oneDay = coin.price_change_percentage_24h;
              const sevenDay = coin.price_change_percentage_7d_in_currency;

              return (
                <tr
                  key={coin.id}
                  onClick={() => {
                    setSelected(coin.symbol.toUpperCase());
                    setPage('Trade');
                  }}
                  className="crypto-ranking-row"
                >
                 <td>{coin.market_cap_rank || ((safeCryptoPage - 1) * cryptoPageSize + index + 1)}</td>

                  <td>
                    <div className="ranking-coin-name">
                      <img src={coin.image} alt={coin.name} />
                      <strong>{coin.name}</strong>
                      <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setPage('Deposit');
  }}
  style={{
    background: '#0ecb81',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 9px',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: '8px'
  }}
>
  BUY
</button>
                      <span>{coin.symbol.toUpperCase()}</span>
                    </div>
                  </td>

                  <td className="ranking-price">{money(coin.current_price)}</td>
<td>{money(coin.total_volume)}</td>

                  <td className={oneHour == null ? '' : oneHour >= 0 ? 'positive' : 'negative'}>
                    {percent(oneHour)}
                  </td>

                  <td className={oneDay == null ? '' : oneDay >= 0 ? 'positive' : 'negative'}>
                    {percent(oneDay)}
                  </td>

                  <td className={sevenDay == null ? '' : sevenDay >= 0 ? 'positive' : 'negative'}>
                    {percent(sevenDay)}
                  </td>

                  <td>
                    <svg className="ranking-sparkline" viewBox="0 0 100 32">
                      {points && (
                        <polyline
                          points={points}
                          fill="none"
                          stroke={
                            prices[prices.length - 1] >= prices[0]
                              ? '#00c087'
                              : '#f6465d'
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </td>
                  <td>{money(coin.market_cap)}</td>
<td>{supply}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {cryptoRanking.length === 0 && (
        <div className="ranking-loading">
          Loading cryptocurrency rankings...
        </div>
      )}
    </div>
   <div className="crypto-pagination">
  <button
    type="button"
    disabled={safeCryptoPage === 1}
    onClick={() => setCryptoPage(safeCryptoPage - 1)}
  >
    Previous
  </button>

  {Array.from({ length: cryptoTotalPages }, (_, i) => i + 1)
    .filter(pageNumber =>
      pageNumber === 1 ||
      pageNumber === cryptoTotalPages ||
      Math.abs(pageNumber - safeCryptoPage) <= 3
    )
    .map((pageNumber, index, pages) => (
      <React.Fragment key={pageNumber}>
        {index > 0 && pageNumber - pages[index - 1] > 1 && (
          <span style={{ padding: '7px 4px' }}>...</span>
        )}

        <button
          type="button"
          onClick={() => setCryptoPage(pageNumber)}
          style={{
            background: safeCryptoPage === pageNumber ? '#0ecb81' : '#222',
            color: '#fff',
            border: '1px solid #444',
            padding: '7px 11px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {pageNumber}
        </button>
      </React.Fragment>
    ))}

  <button
    type="button"
    disabled={safeCryptoPage === cryptoTotalPages}
    onClick={() => setCryptoPage(safeCryptoPage + 1)}
  >
    Next
  </button>
</div>
  </div>
)}

{/* Existing non-crypto market cards */}
<div className="market-grid">
  {filterMarkets
    .filter(m => m.kind !== 'Crypto')
    .map(m => (
      <button
        key={m.symbol}
        className={`market-card ${selected === m.symbol ? 'market-selected' : ''}`}
        onClick={() => {
          setSelected(m.symbol);
          setPage('Trade');
        }}
      >
        <div className="coin-row">
          <MarketIcon symbol={m.symbol} kind={m.kind} />

          <span className="coin-info">
            <strong>{m.pair}</strong>
            <small>{m.name}</small>
          </span>

          <span className={`change ${m.change == null ? '' : m.change >= 0 ? 'positive' : 'negative'}`}>
            {m.change == null ? '—' : `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`}
          </span>
        </div>

        <div className="market-price">
          {quotePrice(m.price, m.symbol)}
        </div>

        <div className="market-volume">
          24h Vol: {m.volume != null
            ? '$' + new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 2
              }).format(m.volume)
            : '—'}
        </div>

        <div className="market-high-low">
          <span>H: {m.high != null ? quotePrice(m.high, m.symbol) : '—'}</span>
          <span>L: {m.low != null ? quotePrice(m.low, m.symbol) : '—'}</span>
        </div>

        <div className="mini-spark">
          {(() => {
            const prices = cryptoSparkline[m.pair] || [];
            const values = prices.map(item => item.price);

            if (values.length < 2) return null;

            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || 1;

            const points = values.map((price, index) => {
              const x = (index / (values.length - 1)) * 120;
              const y = 27 - ((price - min) / range) * 24;
              return `${x},${y}`;
            }).join(' ');

            const isUp = values[values.length - 1] >= values[0];

            return (
              <svg viewBox="0 0 120 30" preserveAspectRatio="none">
                <polyline
                  points={points}
                  fill="none"
                  stroke={isUp ? '#00c087' : '#f6465d'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })()}
        </div>
      </button>
    ))}
</div>

          <div className="lower-grid"><div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">MARKET CHART</span><h2>{asset.name} <span className="muted">({asset.pair})</span></h2></div><div className="price-stack"><strong>{asset.price == null ? 'Live price unavailable' : quotePrice(asset.price, asset.symbol)}</strong><span className={asset.change >= 0 ? 'positive' : 'negative'}>{asset.change == null ? 'Change since connection unavailable' : `${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}% since connection`}</span></div></div><Candles
  Candles
  compact
  candles={liveCandles[asset.symbol] || []}
  currentPrice={asset.price}
  timeframe={chartTimeframe}
  onTimeframeChange={setChartTimeframe}
/>

<div style={{
  marginTop: '18px',
  padding: '14px',
  borderRadius: '10px',
  background: '#171b22'
}}>
  {(() => {
    const volumeCandles = (
      liveCandles[asset.symbol] || []
    ).slice(-60);

    const maxVolume = Math.max(
      ...volumeCandles.map(c => Number(c.volume || 0)),
      1
    );

    const hasVolume = volumeCandles.some(
      c => Number(c.volume) > 0
    );

    return (
      <>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <strong>Trading Volume ({asset.symbol})</strong>
          <small className="muted">Live · {chartTimeframe}</small>
        </div>

        {hasVolume ? (
          <div style={{
            height: '105px',
            display: 'flex',
            alignItems: 'end',
            gap: '3px',
            overflow: 'hidden'
          }}>
            {volumeCandles.map((candle, index) => {
              const volume = Number(candle.volume || 0);
              const height = Math.max(
                2,
                (volume / maxVolume) * 100
              );

              return (
                <div
                  key={`${candle.time}-${index}`}
                  title={`${new Date(candle.time).toLocaleString()} | Volume: ${volume.toLocaleString('en-US')}`}
                  style={{
                    flex: 1,
                    minWidth: '2px',
                    height: `${height}%`,
                    background: candle.up ? '#00c087' : '#f6465d',
                    borderRadius: '3px 3px 0 0'
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p className="muted">
            Waiting for real volume data...
          </p>
        )}

        {hasVolume && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px'
          }}>
            <small className="muted">
              {volumeCandles.length} candles
            </small>
            <small className="muted">
              Latest volume: {Number(
                volumeCandles[volumeCandles.length - 1]?.volume || 0
              ).toLocaleString('en-US', {
                maximumFractionDigits: 3
              })}
            </small>
          </div>
        )}
      </>
    );
  })()}
</div>
 </div><div className="panel quick-panel"><span className="eyebrow">QUICK ACTION</span><h2>Ready to trade?</h2><p className="muted">Start a trade with account funds.</p><button className="btn btn-gold btn-full" onClick={() => setPage('Trade')}>Open trading terminal <span>↗</span></button><button className="btn btn-outline btn-full" onClick={() => setPage('Deposit')}>Deposit request <span>＋</span></button><div className="secure-note"><span>✦</span> Account balance.</div></div></div>
          <CustomerService telegramUrl={telegramUrl} />
        </section>}
        {page === 'Trade' && <section className={`page-section ${tradeFullscreen ? 'trade-fullscreen' : ''}`}>

  {tradeFullscreen && (
    <div className="page-title-row">
      <button
        className="btn btn-outline"
        onClick={() => {
          setTradeFullscreen(false);
          setPage('Home');
        }}
      >
        Back to Home
      </button>
    </div>
  )}
        <div className="trade-layout"><div className="panel trade-chart-panel"><div className="panel-head"><div className="asset-select">
  <MarketIcon symbol={asset.symbol} />
  <div className="asset-info">
    <strong className="market-symbol">{asset.pair}</strong>
    <small>{asset.name}</small>
  </div><select value={selected} onChange={e => setSelected(e.target.value)}>{markets.map(m => <option key={m.symbol} value={m.symbol}>{m.pair} — {m.name}</option>)}</select></div><div className="price-stack"><strong>{asset.price == null ? 'Live price unavailable' : quotePrice(asset.price, asset.symbol)}</strong><span className={asset.change >= 0 ? 'positive' : 'negative'}>{asset.change == null ? '—' : `${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}%`}</span></div></div><div className="chart-legend"><span><i className="legend-green" /> Up candle</span><span><i className="legend-red" /> Down candle</span><span className="muted">
  {asset.symbol === 'XAU'
    ? ''
    : 'Live'}
</span>
</div>
<Candles
  progress={duration - remaining}
  candles={liveCandles[asset.symbol] || []}
  targetPrice={
    trade && !trade.done
      ? trade.targetPrice
      : null
  }
  entryPrice={
    selected === 'XAU' && trade?.symbol === 'XAU' && !trade.done
      ? trade.openPrice
      : null
  }
  tradeSecondsLeft={
    selected === 'XAU' && trade?.symbol === 'XAU' && !trade.done
      ? remaining
      : null
  }
  tradeDuration={
    selected === 'XAU' && trade?.symbol === 'XAU'
      ? trade.duration
      : 0
  }
 currentPrice={asset.price}
timeframe={chartTimeframe}
onTimeframeChange={setChartTimeframe}
/>
            {trade && <div className={`trade-result ${trade.done ? 'result-done' : ''}`}>{trade.awaitingDone && (
  <button
    className="btn btn-gold btn-full"
    onClick={finishTrade}
  >
    REVIEW TRADE RESULT
  </button>
)}<div className="result-grid"><div><small>Asset</small><strong>{trade.assetName || trade.symbol}</strong></div><div><small>Direction</small><strong>{trade.direction}</strong></div><div><small>Duration</small><strong>{trade.duration}s</strong></div><div><small>Trade amount</small><strong>{money(trade.amount)}</strong></div><div><small>Opening price</small><strong>{quotePrice(trade.openPrice ?? trade.price, trade.symbol)}</strong></div><div><small>Target price</small><strong>{quotePrice(trade.targetPrice, trade.symbol)}</strong></div><div><small>Closing price</small><strong>{trade.endPrice == null ? 'Waiting for close' : quotePrice(trade.endPrice, trade.symbol)}</strong></div><div>
  <small>{!trade.done ? 'EXPECTED RESULT' : trade.profit < 0 ? 'LOSS' : 'PROFIT'}</small>
  <strong className={
    trade.done
      ? (trade.profit < 0 ? 'negative' : 'positive')
      : 'gold-text'
  }>
    {trade.done
      ? `${trade.profit < 0 ? '-' : '+'}${money(Math.abs(trade.profit))}`
      : `Expected ±${money(trade.amount * trade.virtualRate)}`
    }
  </strong>
</div><div><small>rate</small><strong className="gold-text">{Math.round(trade.virtualRate * 100)}%</strong></div></div><div className="trade-timestamps"><span>Opened: {trade.openTime || trade.startedAt}</span><span>{trade.closeTime ? `Closed: ${trade.closeTime}` : trade.awaitingDone ?'': 'Waiting for timer to finish.'}</span></div><Candles compact candles={trade.done || trade.awaitingDone ? (trade.endCandles || liveCandles[trade.symbol] || []) : (liveCandles[trade.symbol] || trade.startCandles || [])} targetPrice={trade.targetPrice} /><div className="result-top"><span className="eyebrow">{trade.done ? 'TRADE COMPLETED' : trade.awaitingDone ? 'REVIEW TRADE RESULT' : 'TRADE IN PROGRESS'}</span>{trade.done ? <span className="status-pill status-on">Saved ✓</span> : trade.awaitingDone ? <span className="status-pill status-on">Timer ended</span> : <span className="countdown">Remaining:{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>}</div>{trade.done && <><p className="result-message">Saved to Profile → Trades with opening price, target price, closing price and chart snapshot.</p><button className="btn btn-gold" onClick={() => { setTrade(null); setRemaining(0) }}>Start another trade</button></>}</div>}
          </div><div className="panel trade-controls"><div className="control-head"><h2>Place trade</h2><span className="tiny-tag">IG</span></div><div className="label-row"><label>Direction</label></div><div className="direction-row"><button className={`direction buy ${direction === 'BUY' ? 'direction-active' : ''}`} onClick={() => setDirection('BUY')}>↗ BUY</button><button className={`direction sell ${direction === 'SELL' ? 'direction-active' : ''}`} onClick={() => setDirection('SELL')}>↘ SELL</button></div><label className="field-label">Trade duration</label><div className="duration-options">{[30, 60, 120].map(d => <button key={d} className={duration === d ? 'duration-active' : ''} onClick={() => { setDuration(d); setAmount(d === 30 ? '100' : d === 60 ? '12000' : '35000') }}><strong>{d}s</strong><small>{d === 30 ? '20% rate' : d === 60 ? '40% rate' : '80% rate'}</small></button>)}</div><label className="field-label" htmlFor="amount">Amount (USDT)</label><div className="amount-input"><span>$</span><input id="amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="amount-hint">{duration === 30 ? 'Amount range: $20 – $10,000' : duration === 60 ? '$12,000 – $30,000' : '$35,000 – $99,000'} · Account balance: {money(balance)}</div><button className="btn btn-gold btn-full btn-large"disabled={tradeStarting || !!(trade && !trade.done)}onClick={startTrade}
>{tradeStarting ? 'Saving trade...' : !tradeEnabled ? 'Trading' : trade && !trade.done ? `Trade running · ${remaining}s` : 'Start trade'} <span>↗</span></button><p className="fine-print">IG trading platforms</p></div></div>
        </section>}

        {page === 'Deposit' && (
  <section className="page-section narrow-page deposit-page">

    {depositMode === 'home' && (
      <>
        <div className="eyebrow">IG TRADE WALLET</div>
        <h1>Deposit <span className="gold-text">Assets</span></h1>
        <p className="muted">
          Choose how you want to add funds to your account
        </p>

        <div className="deposit-home-grid">

          <button
            type="button"
            className="panel deposit-option-card"
            onClick={() => {
              setDepositCoinStep('select');
              setDepositMode('crypto');
              if (depositAssets.length > 0 && !selectedDepositAssetId) {
                setSelectedDepositCurrency(depositAssets[0].currency);
                setSelectedDepositAssetId(String(depositAssets[0].id));
                setDepositMethod(depositAssets[0].network);
              }
            }}
          >
            <span className="deposit-option-icon crypto-option-icon">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 3v18M15 3v18M6 7h10a3 3 0 0 1 0 6H8h8a3 3 0 0 1 0 6H6" />
  </svg>
</span>
            <strong>Deposit Assets XUA/USD Gold</strong>
            <small>Deposit crypto from an external wallet</small>
            <span className="deposit-option-arrow">→</span>
          </button>

          <button
            type="button"
            className="panel deposit-option-card"
            onClick={() => setDepositMode('buy')}
          >
            <span className="deposit-option-icon buy-option-icon">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3 10h18M7 15h4" />
  </svg>
</span>
            <strong>Buy Gold </strong>
            <small>Buy gold Index using supported payment methods</small>
            <span className="deposit-option-arrow">→</span>
          </button>

          <button
            type="button"
            className="panel deposit-option-card"
            onClick={() => setDepositMode('fiat')}
          >
            <span className="deposit-option-icon fiat-option-icon">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7M8 10h.01M16 10h.01" />
  </svg>
</span>
            <strong>Deposit Fiat</strong>
            <small>Add funds using traditional currency</small>
            <span className="deposit-option-arrow">→</span>
          </button>

        </div>
      </>
    )}

    
{depositMode === 'buy' && (
  <div className="panel form-panel buy-crypto-panel">

    <button
      type="button"
      className="btn btn-outline"
      onClick={() => setDepositMode('home')}
    >
      ← Back
    </button>

    <div className="eyebrow"></div>
    <h2>Buy <span className="gold-text">Gold/Forex</span></h2>

{buyCryptoStep === 'select' && (
  <>
    <label className="field-label">Select Coin</label>

    <div className="buy-coin-search">
      <span>⌕</span>
      <input
        type="text"
        value={buyCryptoSearch}
        onChange={e => setBuyCryptoSearch(e.target.value)}
        placeholder="Search cryptocurrency..."
      />

      {buyCryptoSearch && (
        <button
          type="button"
          onClick={() => setBuyCryptoSearch('')}
        >
          ×
        </button>
      )}
    </div>

    <div className="buy-coin-grid">
      {supportedDepositCoins
        .filter(coin =>
          coin.symbol.toLowerCase().includes(buyCryptoSearch.trim().toLowerCase()) ||
          coin.name.toLowerCase().includes(buyCryptoSearch.trim().toLowerCase())
        )
        .map(coin => (
          <button
            type="button"
            key={coin.symbol}
            className="buy-coin-btn"
            onClick={() => {
              setBuyCryptoCoin(coin.symbol);
              setBuyCryptoSearch('');
              setBuyCryptoStep('details');
            }}
          >
            <img
              src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${coin.logo}.png`}
              alt={`${coin.name} logo`}
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
              }}
            />

            <span>
              <strong>{coin.symbol}</strong>
              <small>{coin.name}</small>
            </span>
          </button>
        ))}
    </div>

    {supportedDepositCoins.filter(coin =>
      coin.symbol.toLowerCase().includes(buyCryptoSearch.trim().toLowerCase()) ||
      coin.name.toLowerCase().includes(buyCryptoSearch.trim().toLowerCase())
    ).length === 0 && (
      <p className="muted">No coin found</p>
    )}
  </>
)}

{buyCryptoStep === 'details' && (
  <div className="buy-selected-coin-card">
    <div className="buy-selected-coin-heading">
      <span className="field-label">Selected Coin</span>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => {
          setBuyCryptoStep('select');
          setBuyCryptoSearch('');
        }}
      >
        ← Change Coin
      </button>
    </div>

    {supportedDepositCoins
      .filter(coin => coin.symbol === buyCryptoCoin)
      .map(coin => (
        <div className="buy-selected-coin-info" key={coin.symbol}>
          <img
            src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${coin.logo}.png`}
            alt={`${coin.name} logo`}
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
            }}
          />

          <div>
            <strong>{coin.symbol}</strong>
            <small>{coin.name}</small>
          </div>
        </div>
      ))}
  </div>
)}
    <label className="field-label">You Pay</label>

    <div className="buy-amount-box">
      <span>USD $</span>
      <input
        type="number"
        min="10"
        value={buyCryptoAmount}
        onChange={e => setBuyCryptoAmount(e.target.value)}
        placeholder="Enter amount"
      />
    </div>

    <label className="field-label">Payment Method</label>

    <div className="buy-payment-grid">
      <button
        type="button"
        className={`buy-payment-btn ${
          buyPaymentMethod === 'Card' ? 'deposit-choice-active' : ''
        }`}
        onClick={() => setBuyPaymentMethod('Card')}
      >
        <strong>▣ Card</strong>
        <small>Credit / Debit Card</small>
      </button>

      <button
        type="button"
        className={`buy-payment-btn ${
          buyPaymentMethod === 'Bank Transfer' ? 'deposit-choice-active' : ''
        }`}
        onClick={() => setBuyPaymentMethod('Bank Transfer')}
      >
        <strong>▤ Bank Transfer</strong>
        <small>Bank payment</small>
      </button>
    </div>

    
<div className="buy-summary">

  <div className="buy-selected-asset">
    <span>Selected Asset</span>

    <div className="buy-selected-coin">
      <img
        src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${
          supportedDepositCoins.find(
            coin => coin.symbol === buyCryptoCoin
          )?.logo || 'generic'
        }.png`}
        alt={`${buyCryptoCoin} logo`}
        onError={e => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
        }}
      />

      <div>
        <strong>{buyCryptoCoin}</strong>
        <small>
          {supportedDepositCoins.find(
            coin => coin.symbol === buyCryptoCoin
          )?.name || buyCryptoCoin}
        </small>
      </div>
    </div>
  </div>

  <div>
    <span>Payment Amount</span>
    <strong>${Number(buyCryptoAmount || 0).toFixed(2)} USD</strong>
  </div>

  <div>
    <span>Payment Method</span>
    <strong>{buyPaymentMethod}</strong>
  </div>

  <div>
    <span>Estimated Coin</span>
   
<strong>
  {estimatedBuyCrypto !== null
    ? `${estimatedBuyCrypto.toLocaleString('en-US', {
        maximumFractionDigits: 8
      })} ${buyCryptoCoin}`
    : 'Live quote unavailable'}
</strong>
  </div>
</div>
   
<button
  type="button"
  className="btn btn-gold btn-full"
  disabled={
    !buyCryptoAmount ||
    Number(buyCryptoAmount) <= 0 ||
    estimatedBuyCrypto === null
  }
  onClick={() => setBuyCryptoReview(true)}
>
  Submit
</button>

{buyCryptoReview && (
  <div className="buy-order-review">
    <div className="eyebrow">ORDER</div>
    <h3>Review Your Order</h3>

    <div className="buy-review-row">
      <span>All Markets</span>
      <strong>{buyCryptoCoin}</strong>
    </div>

    <div className="buy-review-row">
      <span>Payment Amount</span>
      <strong>${Number(buyCryptoAmount).toFixed(2)} USD</strong>
    </div>

    <div className="buy-review-row">
      <span>Payment Method</span>
      <strong>{buyPaymentMethod}</strong>
    </div>

    <div className="buy-review-row">
      <span>Estimated Crypto</span>
      <strong>
        {estimatedBuyCrypto !== null
          ? `${estimatedBuyCrypto.toLocaleString('en-US', {
              maximumFractionDigits: 8
            })} ${buyCryptoCoin}`
          : 'Live quote unavailable'}
      </strong>
    </div>

    <button
      type="button"
      className="btn btn-outline btn-full"
      onClick={() => setBuyCryptoReview(false)}
    >
      ← Back to Edit Order
    </button>
  </div>
)}

  </div>
)}


   
{depositMode === 'fiat' && (
  <div className="panel form-panel fiat-deposit-panel">
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => {
        setDepositMode('home');
        setFiatDepositReview(false);
      }}
    >
      ← Back
    </button>

    <div className="eyebrow">FIAT CURRENCY</div>
    <h2>Deposit <span className="gold-text">Fiat</span></h2>
    <p className="muted">
      Select your currency and payment method
    </p>

    {!fiatDepositReview ? (
      <>
     
{fiatDepositStep === 'select' ? (
  <>
    <label className="field-label">Select Currency</label>

    <div className="fiat-search-box">
      <span>⌕</span>
      <input
        type="text"
        value={fiatCurrencySearch}
        onChange={e => setFiatCurrencySearch(e.target.value)}
        placeholder="Search currency..."
      />
      {fiatCurrencySearch && (
        <button
          type="button"
          onClick={() => setFiatCurrencySearch('')}
        >
          ×
        </button>
      )}
    </div>

    <div className="fiat-currency-grid">
      {fiatCurrencies
        .filter(currency =>
          currency.code.toLowerCase().includes(
            fiatCurrencySearch.trim().toLowerCase()
          ) ||
          currency.name.toLowerCase().includes(
            fiatCurrencySearch.trim().toLowerCase()
          )
        )
        .map(currency => (
          <button
            type="button"
            key={currency.code}
            className="fiat-choice-btn"
            onClick={() => {
              setFiatCurrency(currency.code);
              setFiatCurrencySearch('');
              setFiatDepositStep('details');
            }}
          >
            <img
              className="fiat-currency-flag"
              src={`https://flagcdn.com/w80/${
                currency.code === 'EUR' ? 'eu' :
                currency.code === 'USD' ? 'us' :
                currency.code === 'GBP' ? 'gb' :
                currency.code === 'CAD' ? 'ca' :
                currency.code === 'AUD' ? 'au' :
                currency.code === 'SGD' ? 'sg' :
                currency.code === 'CHF' ? 'ch' :
                currency.code === 'JPY' ? 'jp' :
                currency.code === 'CNY' ? 'cn' :
                currency.code === 'HKD' ? 'hk' :
                currency.code === 'INR' ? 'in' :
                currency.code === 'BDT' ? 'bd' :
                currency.code === 'NZD' ? 'nz' :
                currency.code === 'SEK' ? 'se' :
                currency.code === 'NOK' ? 'no' :
                currency.code === 'DKK' ? 'dk' :
                currency.code === 'PLN' ? 'pl' :
                currency.code === 'CZK' ? 'cz' :
                currency.code === 'HUF' ? 'hu' :
                currency.code === 'RON' ? 'ro' :
                currency.code === 'TRY' ? 'tr' :
                currency.code === 'RUB' ? 'ru' :
                currency.code === 'UAH' ? 'ua' :
                currency.code === 'KRW' ? 'kr' :
                currency.code === 'THB' ? 'th' :
                currency.code === 'MYR' ? 'my' :
                currency.code === 'IDR' ? 'id' :
                currency.code === 'PHP' ? 'ph' :
                currency.code === 'VND' ? 'vn' :
                currency.code === 'PKR' ? 'pk' :
                currency.code === 'LKR' ? 'lk' :
                currency.code === 'NPR' ? 'np' :
                currency.code === 'AED' ? 'ae' :
                currency.code === 'SAR' ? 'sa' :
                currency.code === 'QAR' ? 'qa' :
                currency.code === 'KWD' ? 'kw' :
                currency.code === 'BHD' ? 'bh' :
                currency.code === 'OMR' ? 'om' :
                currency.code === 'JOD' ? 'jo' :
                currency.code === 'ILS' ? 'il' :
                currency.code === 'ZAR' ? 'za' :
                currency.code === 'NGN' ? 'ng' :
                currency.code === 'KES' ? 'ke' :
                currency.code === 'EGP' ? 'eg' :
                currency.code === 'MAD' ? 'ma' :
                currency.code === 'TND' ? 'tn' :
                currency.code === 'BRL' ? 'br' :
                currency.code === 'MXN' ? 'mx' :
                currency.code === 'ARS' ? 'ar' : 'cl'
              }.png`}
              alt={`${currency.name} flag`}
            />
            <strong>{currency.code}</strong>
            <small>{currency.name}</small>
          </button>
        ))}
    </div>

    {fiatCurrencies.filter(currency =>
      currency.code.toLowerCase().includes(
        fiatCurrencySearch.trim().toLowerCase()
      ) ||
      currency.name.toLowerCase().includes(
        fiatCurrencySearch.trim().toLowerCase()
      )
    ).length === 0 && (
      <p className="muted">No currency found</p>
    )}
  </>
) : (
  <div className="fiat-selected-currency">
    <div className="fiat-selected-heading">
      <span className="field-label">Selected Currency</span>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => {
          setFiatDepositStep('select');
          setFiatCurrencySearch('');
        }}
      >
        ← Change Currency
      </button>
    </div>

    {(() => {
      const selectedFiat = fiatCurrencies.find(
        currency => currency.code === fiatCurrency
      );

      if (!selectedFiat) return null;

      return (
        <div className="fiat-selected-info">
          <img
            src={`https://flagcdn.com/w80/${
              selectedFiat.code === 'EUR' ? 'eu' :
              selectedFiat.code === 'USD' ? 'us' :
              selectedFiat.code === 'GBP' ? 'gb' :
              selectedFiat.code === 'CAD' ? 'ca' :
              selectedFiat.code === 'AUD' ? 'au' :
              selectedFiat.code === 'SGD' ? 'sg' :
              selectedFiat.code === 'CHF' ? 'ch' :
              selectedFiat.code === 'JPY' ? 'jp' :
              selectedFiat.code === 'CNY' ? 'cn' :
              selectedFiat.code === 'HKD' ? 'hk' :
              selectedFiat.code === 'INR' ? 'in' :
              selectedFiat.code === 'BDT' ? 'bd' :
              selectedFiat.code === 'NZD' ? 'nz' :
              selectedFiat.code === 'SEK' ? 'se' :
              selectedFiat.code === 'NOK' ? 'no' :
              selectedFiat.code === 'DKK' ? 'dk' :
              selectedFiat.code === 'PLN' ? 'pl' :
              selectedFiat.code === 'CZK' ? 'cz' :
              selectedFiat.code === 'HUF' ? 'hu' :
              selectedFiat.code === 'RON' ? 'ro' :
              selectedFiat.code === 'TRY' ? 'tr' :
              selectedFiat.code === 'RUB' ? 'ru' :
              selectedFiat.code === 'UAH' ? 'ua' :
              selectedFiat.code === 'KRW' ? 'kr' :
              selectedFiat.code === 'THB' ? 'th' :
              selectedFiat.code === 'MYR' ? 'my' :
              selectedFiat.code === 'IDR' ? 'id' :
              selectedFiat.code === 'PHP' ? 'ph' :
              selectedFiat.code === 'VND' ? 'vn' :
              selectedFiat.code === 'PKR' ? 'pk' :
              selectedFiat.code === 'LKR' ? 'lk' :
              selectedFiat.code === 'NPR' ? 'np' :
              selectedFiat.code === 'AED' ? 'ae' :
              selectedFiat.code === 'SAR' ? 'sa' :
              selectedFiat.code === 'QAR' ? 'qa' :
              selectedFiat.code === 'KWD' ? 'kw' :
              selectedFiat.code === 'BHD' ? 'bh' :
              selectedFiat.code === 'OMR' ? 'om' :
              selectedFiat.code === 'JOD' ? 'jo' :
              selectedFiat.code === 'ILS' ? 'il' :
              selectedFiat.code === 'ZAR' ? 'za' :
              selectedFiat.code === 'NGN' ? 'ng' :
              selectedFiat.code === 'KES' ? 'ke' :
              selectedFiat.code === 'EGP' ? 'eg' :
              selectedFiat.code === 'MAD' ? 'ma' :
              selectedFiat.code === 'TND' ? 'tn' :
              selectedFiat.code === 'BRL' ? 'br' :
              selectedFiat.code === 'MXN' ? 'mx' :
              selectedFiat.code === 'ARS' ? 'ar' : 'cl'
            }.png`}
            alt={`${selectedFiat.name} flag`}
          />
          <div>
            <strong>{selectedFiat.code}</strong>
            <small>{selectedFiat.name}</small>
          </div>
        </div>
      );
    })()}
  </div>
)}
        <label className="field-label">Deposit Amount</label>
        <div className="buy-amount-box">
         <span>
  {fiatCurrencies.find(c => c.code === fiatCurrency)?.symbol || '$'} {fiatCurrency}
</span>
          <input
            type="number"
            min="1"
            value={fiatAmount}
            onChange={e => setFiatAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <label className="field-label">Payment Method</label>
        <div className="fiat-payment-grid">
          {['Bank Transfer', 'Card'].map(method => (
            <button
              type="button"
              key={method}
              className={`fiat-choice-btn ${
                fiatPaymentMethod === method ? 'deposit-choice-active' : ''
              }`}
              onClick={() => setFiatPaymentMethod(method)}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="buy-summary">
          <div>
            <span>Currency</span>
            <strong>{fiatCurrency}</strong>
          </div>
          <div>
            <span>Deposit Amount</span>
            <strong>
              {fiatCurrency} {Number(fiatAmount || 0).toFixed(2)}
            </strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>{fiatPaymentMethod}</strong>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-gold btn-full"
          disabled={!fiatAmount || Number(fiatAmount) <= 0}
          onClick={() => setFiatDepositReview(true)}
        >
          Confirm deposit
        </button>
      </>
    ) : (
      <div className="buy-order-review">
        <div className="eyebrow">DEPOSIT REVIEW</div>
        <h3>Review Your Deposit</h3>

        <div className="buy-review-row">
          <span>Currency</span>
          <strong>{fiatCurrency}</strong>
        </div>

        <div className="buy-review-row">
          <span>Deposit Amount</span>
          <strong>
            {fiatCurrency} {Number(fiatAmount).toFixed(2)}
          </strong>
        </div>

        <div className="buy-review-row">
          <span>Payment Method</span>
          <strong>{fiatPaymentMethod}</strong>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-full"
          onClick={() => setFiatDepositReview(false)}
        >
          ← Back to Edit
        </button>
      </div>
    )}
  </div>
)}


    {depositMode === 'crypto' && (
      <>
        <button
          type="button"
          className="btn btn-outline deposit-back-btn"
          onClick={() => setDepositMode('home')}
        >
          ← Back to Deposit
        </button>
        <h1>Deposit <span className="gold-text">Wallets</span></h1> 
       {depositAssetsLoading ? (
          <div className="panel">
            Loading available deposit assets...
          </div>
        ) : depositCurrencies.length === 0 ? (
          <div className="panel notice">
          
          </div>
        ) : (
          <div className="panel form-panel deposit-crypto-panel">
          {depositCoinStep === 'select' && (
  <>
            <div className="deposit-coin-list">
{depositCurrencies.map(coin => (
  <button
    type="button"
    key={coin.symbol}
    className={`deposit-coin-btn ${
      selectedDepositCurrency === coin.symbol
        ? 'deposit-choice-active'
        : ''
    }`}
    onClick={() => {
  setSelectedDepositCurrency(coin.symbol);

  const firstNetwork = depositAssets.find(
    item => item.currency?.toUpperCase() === coin.symbol
  );

  if (firstNetwork) {
    setSelectedDepositAssetId(String(firstNetwork.id));
    setDepositMethod(firstNetwork.network);
  }

  setDepositCoinStep('details');
}}
  >
    <span className="deposit-coin-logo-wrap">
      <img
        className="deposit-coin-logo"
        src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${coin.logo}.png`}
        alt={`${coin.name} logo`}
        onError={e => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
        }}
      />
    </span>

    <span className="deposit-coin-info">
      <strong>{coin.symbol}</strong>
      <small>{coin.name}</small>
    </span>
  </button>
))}

            </div>
                      </>
        )}

        {depositCoinStep === 'details' && (
          <>
            <div className="deposit-details-back-wrap">
  <button
    type="button"
    className="btn btn-outline deposit-back-btn"
    onClick={() => setDepositCoinStep('select')}
  >
    ← Back to coins
  </button>
</div>
    
{depositCurrencies
  .filter(coin => coin.symbol === selectedDepositCurrency)
  .map(coin => (
    <div
      className="deposit-selected-coin-card"
      key={coin.symbol}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 20px',
        marginBottom: 24,
        border: '1px solid #2698ff',
        borderRadius: 14,
        background: 'linear-gradient(110deg, #10264d, #111a32)',
        boxShadow: '0 0 16px rgba(38, 152, 255, 0.16)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <img
          src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${coin.logo}.png`}
          alt={`${coin.name} logo`}
          style={{
            width: 62,
            height: 62,
            objectFit: 'contain'
          }}
          onError={e => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
          }}
        />

        <div>
          <strong style={{
            display: 'block',
            fontSize: 25,
            color: '#ffffff'
          }}>
            {coin.symbol}
          </strong>

          <span style={{
            display: 'block',
            color: '#b9c9e5',
            fontSize: 14
          }}>
            {coin.name}
          </span>
        </div>
      </div>

      <span style={{
        background: '#0878f9',
        color: '#ffffff',
        padding: '9px 16px',
        borderRadius: 30,
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap'
      }}>
        ✓ Selected
      </span>
    </div>
  ))}
            <label className="field-label">
              Select network
            </label>

            <div className="deposit-network-list">
              {selectedCurrencyNetworks.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`deposit-network-btn ${
                    String(selectedDepositAssetId) === String(item.id)
                      ? 'deposit-choice-active'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedDepositAssetId(String(item.id));
                    setDepositMethod(item.network);
                  }}
                >
                  
{(() => {
  const network = String(item.network || '').toUpperCase();

  const networkLogo =
    network.includes('TRC20') || network.includes('TRON') ? 'trx' :
    network.includes('BTC') || network.includes('BITCOIN') ? 'btc' :
    network.includes('BEP20') || network.includes('BNB') ? 'bnb' :
    network.includes('ERC20') || network.includes('ETHEREUM') ? 'eth' :
    network.includes('SOLANA') ? 'sol' :
    network.includes('POLYGON') ? 'matic' :
    network.includes('AVALANCHE') ? 'avax' :
    network.includes('ARBITRUM') ? 'arb' :
    network.includes('OPTIMISM') ? 'op' :
    network.includes('XRP') || network.includes('RIPPLE') ? 'xrp' :
    network.includes('CARDANO') ? 'ada' :
    network.includes('LITECOIN') ? 'ltc' :
    String(item.currency || 'btc').toLowerCase();

  return (
    <>
      <img
        src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${networkLogo}.png`}
        alt={`${item.network} logo`}
        className="deposit-network-logo"
      />
      <span className="deposit-network-info">
        <strong>{item.network}</strong>
        <small>{item.currency} network</small>
      </span>
    </>
  );
})()}

                </button>
              ))}
            </div>

            {selectedDepositAsset && (
              <>
                <div className="divider" />

                <label className="field-label">
                  Deposit address
                </label>

                <div className="copy-field">
                  <span>
                    {selectedDepositAsset.wallet_address ||
                      'Admin has not configured this deposit address yet'}
                  </span>

                  <button
                    type="button"
                    disabled={!selectedDepositAsset.wallet_address}
                    onClick={() => copy(selectedDepositAsset.wallet_address)}
                  >
                    Copy
                  </button>
                </div>

                {selectedDepositAsset.qr_url && (
                  <div className="deposit-qr-display">
                    <label className="field-label">
                      Scan to deposit
                    </label>

                    <img
                      src={selectedDepositAsset.qr_url}
                      alt={`${selectedDepositAsset.currency} deposit QR code`}
                      style={{
                        display: 'block',
                        width: 'min(220px, 100%)',
                        maxHeight: 220,
                        objectFit: 'contain',
                        margin: '12px auto 20px',
                        padding: 12,
                        background: '#fff',
                        borderRadius: 12
                      }}
                    />
                  </div>
                )}

                {selectedDepositAsset.instructions && (
                  <div className="notice">
                    <strong>Deposit instructions</strong>
                    <p>{selectedDepositAsset.instructions}</p>
                  </div>
                )}

                <form onSubmit={submitDeposit}>

                
<label className="field-label" htmlFor="deposit-amount">
  Amount (USD)
  {selectedDepositAsset.currency === 'USDT' &&
   selectedDepositAsset.network.toUpperCase().includes('TRC20')
    ? ' · Minimum $50 USD'
    : ''}
</label>

<div className="amount-input deposit-compact-amount">
  <span>$</span>
  <input
    id="deposit-amount"
    type="number"
    min={
      selectedDepositAsset.currency === 'USDT' &&
      selectedDepositAsset.network.toUpperCase().includes('TRC20')
        ? 50
        : 0.01
    }
    step="0.01"
    placeholder="Enter USD amount"
    value={depositAmount}
    onChange={e => setDepositAmount(e.target.value)}
    required
  />
</div>

<div className="notice deposit-compact-estimate">
  <strong>Estimated crypto amount</strong>

  {estimatedDepositCrypto > 0 ? (
    <p>
      {estimatedDepositCrypto.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      })}{' '}
      {selectedDepositAsset.currency}
    </p>
  ) : (
    <p>
      {selectedDepositPrice > 0
        ? 'Enter USD amount to see conversion'
        : 'Live conversion price is currently unavailable'}
    </p>
  )}

  <small>
    Live price: {selectedDepositPrice > 0
      ? `$${selectedDepositPrice.toLocaleString('en-US', {
          maximumFractionDigits: 8
        })}`
      : 'Unavailable'}
  </small>
</div>
                  <label className="field-label" htmlFor="receipt">
                    Payment screenshot
                  </label>

                  <label className="upload-box deposit-compact-upload" htmlFor="receipt">
                    <span className="upload-icon">↑</span>

                    <strong>
                      {depositFile
                        ? depositFile.name
                        : 'Choose screenshot from your device'}
                    </strong>

                    <small>PNG, JPG or WEBP · Max 5 MB</small>

                    <input
                      id="receipt"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={e => {
                        const file = e.target.files?.[0];

                        if (!file) {
                          setDepositFile(null);
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setToast('Screenshot must be under 5 MB.');
                          e.target.value = '';
                          setDepositFile(null);
                          return;
                        }

                        const reader = new FileReader();

                        reader.onload = () => {
                          setDepositFile({
                            name: file.name,
                            file,
                            previewUrl: String(reader.result || '')
                          });
                        };

                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                  <button
                    className="btn btn-gold btn-full deposit-compact-submit"
                    type="submit"
                    disabled={!selectedDepositAsset.wallet_address}
                  >
                    Confirm ↗
                  </button>

                               </form>
              </>
            )}
          </>
        )}
          </div>
        )}
      </>
    )}

  </section>
)}

         
{page === 'Dashboard' && (
  <section className="page-section">
    <div className="eyebrow">IG Trade CRYPTOCURRENCY MARKET</div>
    <h1>Crypto <span className="gold-text">Charts</span></h1>
    <p className="muted">
      IG cryptocurrency market,including Bitcoin dominance, altcoin season, ETF net flows, and real-time market sentiment, all conveniently accessible in one place on IG Trade Platforms
    </p>

    
<div className="market-grid">

  {/* Total Crypto Market Cap */}
  <div className="panel">
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <span className="muted">Total Crypto Market Cap</span>
      <span style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(212,175,55,0.14)',
        color: '#D4AF37',
        fontSize: '23px'
      }}>◈</span>
    </div>

    <h2 style={{ margin: '12px 0' }}>
      {globalCryptoData
        ? '$' + (Number(globalCryptoData.total_market_cap?.usd) / 1e12).toFixed(3) + 'T'
        : 'Loading...'}
    </h2>

    {globalCryptoData && (() => {
      const change = Number(
        globalCryptoData.market_cap_change_percentage_24h_usd || 0
      );

      return (
        <span style={{
          color: change >= 0 ? '#00c087' : '#f6465d',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {change >= 0 ? '▲' : '▼'}
          {Math.abs(change).toFixed(2)}% (24h)
        </span>
      );
    })()}
  </div>

  {/* BTC Dominance */}
  <div className="panel">
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <span className="muted">BTC Dominance</span>
      <img
        src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png"
        alt="Bitcoin"
        width="40"
        height="40"
        style={{ borderRadius: '50%' }}
      />
    </div>

    <h2 style={{ color: '#f7931a', margin: '12px 0' }}>
      {globalCryptoData
        ? Number(globalCryptoData.market_cap_percentage?.btc).toFixed(2) + '%'
        : 'Loading...'}
    </h2>

    <small style={{ color: '#f7931a', fontWeight: 600 }}>
      Bitcoin Market Share
    </small>
  </div>

  {/* ETH Dominance */}
  <div className="panel">
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <span className="muted">ETH Dominance</span>
      <img
        src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png"
        alt="Ethereum"
        width="40"
        height="40"
        style={{ borderRadius: '50%' }}
      />
    </div>

    <h2 style={{ color: '#627eea', margin: '12px 0' }}>
      {globalCryptoData
        ? Number(globalCryptoData.market_cap_percentage?.eth).toFixed(2) + '%'
        : 'Loading...'}
    </h2>

    <small style={{ color: '#627eea', fontWeight: 600 }}>
      Ethereum Market Share
    </small>
  </div>

  {/* Active Cryptocurrencies */}
  <div className="panel">
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <span className="muted">Active Cryptocurrencies</span>
      <span style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,192,135,0.13)',
        color: '#00c087',
        fontSize: '23px'
      }}>◉</span>
    </div>

    <h2 style={{ color: '#00c087', margin: '12px 0' }}>
      {globalCryptoData
        ? Number(globalCryptoData.active_cryptocurrencies).toLocaleString()
        : 'Loading...'}
    </h2>

    <small style={{ color: '#00c087', fontWeight: 600 }}>
      Tracked Digital Assets
    </small>
  </div>

</div>


    <div className="panel">
     <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px'
}}>
  <span style={{
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.15)',
    color: '#D4AF37',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '25px'
  }}>◉</span>
  <div>
    <h2 style={{ margin: 0 }}>Fear & Greed Index</h2>
    <small className="muted">Crypto Market Sentiment</small>
  </div>
</div>
      {fearGreedData ? (
        <>
          <h1>{fearGreedData.value} / 100</h1>
          <p>{fearGreedData.value_classification}</p>
         <div className="fear-greed-history">
  {fearGreedHistory.length > 1 ? (() => {
    const latest = fearGreedHistory[fearGreedHistory.length - 1];
    const previous = fearGreedHistory[fearGreedHistory.length - 2];
    const change = latest.value - previous.value;

    const chartData = fearGreedHistory.map((item, index) => {
  const btc = btcDailyHistory.find(coin =>
    new Date(coin.timestamp).toDateString() ===
    new Date(item.timestamp).toDateString()
  );

  return {
    ...item,
    btcPrice: btc?.price ?? null,
    btcOpen: btc?.open ?? null,
    btcVolume: btc?.volume ?? null,
    x: 40 + (index / (fearGreedHistory.length - 1)) * 660,
    y: 170 - (item.value / 100) * 140
  };
});

const points = chartData
  .map(item => `${item.x},${item.y}`)
  .join(' ');

const latestY = 170 - (latest.value / 100) * 140;

const [selectedFearGreed, setSelectedFearGreed] = [null, () => {}];

    return (
      <>
        <div className="history-chart-header">
          <div>
            <span className="muted">Current Fear & Greed</span>
            <h2>{latest.value} / 100</h2>
            <strong>{latest.classification}</strong>
          </div>

          <div style={{
            textAlign: 'right',
            color: change >= 0 ? '#70c99a' : '#ef7777'
          }}>
            <strong>
              {change >= 0 ? '+' : ''}{change} points
            </strong>
            <p className="muted">Change from previous reading</p>
          </div>
        </div>

        <div className="history-chart-header">
          <strong>IG Historical Index</strong>
          <span>{fearGreedHistory.length} readings</span>
        </div>

        <svg
          viewBox="0 0 760 260"
          width="100%"
          role="img"
          aria-label="Fear and Greed historical index chart"
         onPointerMove={event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (760 / rect.width);

  const index = Math.round(
    ((x - 40) / 660) * (chartData.length - 1)
  );

  const safeIndex = Math.max(
    0,
    Math.min(chartData.length - 1, index)
  );

  setSelectedFearGreed(chartData[safeIndex]);
}}

onPointerDown={event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (760 / rect.width);
  const index = Math.round(
    ((x - 40) / 660) * (chartData.length - 1)
  );

  const safeIndex = Math.max(
    0,
    Math.min(chartData.length - 1, index)
  );

  setSelectedFearGreed(chartData[safeIndex]);
}}
style={{ touchAction: 'pan-y', cursor: 'crosshair' }}
        >
          {[30, 65, 100, 135, 170].map((y, i) => (
            <g key={y}>
              <line
                x1="40"
                y1={y}
                x2="700"
                y2={y}
                stroke="#777"
                opacity=".25"
                strokeDasharray="4 5"
              />
              <text
                x="5"
                y={y + 4}
                fill="#aaa08a"
                fontSize="11"
              >
                {100 - i * 25}
              </text>
            </g>
          ))}
          {(() => {
  const maxVolume = Math.max(
    ...chartData.map(item => item.btcVolume || 0),
    1
  );

  return chartData.map((item, index) => {
    if (item.btcVolume == null) return null;

    const barHeight = (item.btcVolume / maxVolume) * 38;

    return (
      <rect
        key={item.timestamp}
        x={item.x - 1}
        y={215 - barHeight}
        width="2"
        height={barHeight}
        fill={
          item.btcPrice >= item.btcOpen
            ? '#00c087'
            : '#f6465d'
        }
        opacity=".8"
      />
    );
  });
})()}
<polyline
  className="fear-greed-line"
  fill="none"
  stroke="#D4AF37"
  strokeWidth="3"
  strokeLinejoin="round"
  strokeLinecap="round"
  strokeDasharray="2000"
  strokeDashoffset="2000"
  points={points}
>
  <animate
    attributeName="stroke-dashoffset"
    from="2000"
    to="0"
    dur="2.5s"
    fill="freeze"
  />
</polyline>

<circle
  cx="700"
  cy={latestY}
  r="5"
  fill="#D4AF37"
>
  <animate
    attributeName="r"
    values="5;8;5"
    dur="1.8s"
    repeatCount="indefinite"
  />
  <animate
    attributeName="opacity"
    values="1;0.55;1"
    dur="1.8s"
    repeatCount="indefinite"
  />
</circle>
         <text x="40" y="250" fill="#aaa08a" fontSize="11">
            {new Date(fearGreedHistory[0].timestamp).toLocaleDateString()}
          </text>

          <text
            x="700"
            y="250"
            textAnchor="end"
            fill="#aaa08a"
            fontSize="11"
          >
            {new Date(latest.timestamp).toLocaleDateString()}
          </text>
        </svg>
      
        {selectedFearGreed && (
  <div
  className="fear-greed-tooltip"
  style={{
    display: 'block',
    position: 'relative',
    zIndex: 20,
    background: '#20242c',
    color: '#ffffff',
    border: '1px solid #D4AF37',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '10px',
    minHeight: '100px'
  }}
>
    <strong>
      {new Date(selectedFearGreed.timestamp).toLocaleDateString()}
    </strong>
    <p>Fear & Greed: {selectedFearGreed.value}</p>
    <p>
      BTC Price: {selectedFearGreed.btcPrice == null
        ? 'Unavailable'
        : '$' + selectedFearGreed.btcPrice.toLocaleString()}
    </p>
    <p>
      BTC Volume: {selectedFearGreed.btcVolume == null
        ? 'Unavailable'
        : selectedFearGreed.btcVolume.toFixed(2) + ' BTC'}
    </p>
  </div>
)}
        <p className="muted">
          Latest reading: {new Date(latest.timestamp).toLocaleString()}
        </p>
      </>
    );
  })() : (
    <p className="muted">Historical chart data unavailable.</p>
  )}
</div>
        </>
      ) : (
        <p className="muted">Loading Fear & Greed Index...</p>
      )}
    </div>
    <div className="panel">
 <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px'
}}>
  <span style={{
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(0,192,135,0.14)',
    color: '#00c087',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '25px'
  }}>✦</span>
  <div>
    <h2 style={{ margin: 0 }}>Altcoin Season Index</h2>
    <small className="muted">Altcoin Market Performance</small>
  </div>
</div>

  {altcoinSeasonLoading ? (
    <p className="muted">Loading Altcoin Season Index...</p>
  ) : altcoinSeasonData ? (
    <>
      <h1>{altcoinSeasonData.altcoin_index} / 100</h1>

      <strong>
        {altcoinSeasonData.altcoin_index > 75
          ? 'Altcoin Season'
          : altcoinSeasonData.altcoin_index < 25
            ? 'Bitcoin Season'
            : 'Neutral Market'}
      </strong>

      <p className="muted">
        Updated: {new Date(
          altcoinSeasonData.snapshot_time
        ).toLocaleString()}
      </p>

      <div className="altcoin-season-history">
        {altcoinSeasonHistory.length > 1 ? (() => {
          const points = altcoinSeasonHistory.map((item, index) => {
            const x = 40 + (index / (altcoinSeasonHistory.length - 1)) * 660;
            const y = 170 - (item.value / 100) * 140;
            return `${x},${y}`;
          }).join(' ');

          return (
            <svg
              viewBox="0 0 760 260"
              width="100%"
              role="img"
              aria-label="90 day Altcoin Season historical chart"
            >
              {[30, 65, 100, 135, 170].map((y, i) => (
                <g key={y}>
                  <line
                    x1="40"
                    y1={y}
                    x2="700"
                    y2={y}
                    stroke="#777"
                    opacity=".25"
                    strokeDasharray="4 5"
                  />
                  <text
                    x="5"
                    y={y + 4}
                    fill="#aaa08a"
                    fontSize="11"
                  >
                    {100 - i * 25}
                  </text>
                </g>
              ))}

              <polyline
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
            </svg>
          );
        })() : (
          <p className="muted">Historical data unavailable.</p>
        )}
      </div>

      <p className="muted">
        90 Day Historical Index · CoinMarketCap
      </p>
    </>
  ) : (
    <p className="muted">Market data is being updated. Please check back shortly.</p>
  )}
</div>
<div className="panel">

<div className="panel">
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <span style={{
    width: '42px', height: '42px', borderRadius: '50%',
    background: 'rgba(212,175,55,0.14)', color: '#D4AF37',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '24px'
  }}>◈</span>
  <div>
    <h2 style={{ margin: 0 }}>Market Cap Breakdown</h2>
  </div>
</div>

  {globalCryptoData?.total_market_cap?.usd != null &&
   globalCryptoData?.total_volume?.usd != null &&
   globalCryptoData?.market_cap_percentage ? (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '18px',
        marginTop: '16px'
      }}>
        <div>
          <small>Total Crypto Market Cap</small>
          <h2>
            ${Number(globalCryptoData.total_market_cap.usd).toLocaleString(
              'en-US',
              { maximumFractionDigits: 0 }
            )}
          </h2>
        </div>

        <div>
          <small>24h Trading Volume</small>
          <h2>
            ${Number(globalCryptoData.total_volume.usd).toLocaleString(
              'en-US',
              { maximumFractionDigits: 0 }
            )}
          </h2>
        </div>
      </div>

      {(() => {
        const btc = Number(globalCryptoData.market_cap_percentage.btc || 0);
        const eth = Number(globalCryptoData.market_cap_percentage.eth || 0);
        const others = Math.max(0, 100 - btc - eth);

        return (
          <>
            <h3 style={{ marginTop: '22px' }}>Market Share</h3>

            <div style={{
              display: 'flex',
              width: '100%',
              height: '14px',
              overflow: 'hidden',
              borderRadius: '8px',
              background: '#292929',
              marginTop: '12px'
            }}>
              <div style={{ width: `${btc}%`, background: '#f7931a' }} />
              <div style={{ width: `${eth}%`, background: '#627eea' }} />
              <div style={{ width: `${others}%`, background: '#00c087' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '10px',
              marginTop: '16px'
            }}>
              <div>
                <small style={{ color: '#f7931a' }}>Bitcoin</small>
                <h3>{btc.toFixed(2)}%</h3>
              </div>

              <div>
                <small style={{ color: '#627eea' }}>Ethereum</small>
                <h3>{eth.toFixed(2)}%</h3>
              </div>

              <div>
                <small style={{ color: '#00c087' }}>Others</small>
                <h3>{others.toFixed(2)}%</h3>
              </div>
            </div>
          </>
        );
      })()}

      <p className="muted">
        Live IG Trade cryptocurrency market data
      </p>
    </>
  ) : (
    <p className="muted">Loading IG market data...</p>
  )}
</div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <img
    src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png"
    alt="Bitcoin"
    width="42"
    height="42"
  />
  <div>
    <h2 style={{ margin: 0 }}>BTC Futures Market</h2>
    <small className="muted">Bitcoin Derivatives & Funding</small>
  </div>
</div>

  {btcDerivativesLoading ? (
    <p className="muted">Loading BTC Futures data...</p>
  ) : btcDerivativesData ? (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '18px',
        marginTop: '16px'
      }}>
        <div>
          <small>Open Interest (BTC)</small>
          <h2>
            {btcDerivativesData.openInterestBTC.toLocaleString(
              'en-US',
              { maximumFractionDigits: 2 }
            )}
          </h2>
        </div>

        <div>
          <small>Open Interest (USD)</small>
          <h2>
            ${btcDerivativesData.openInterestUSD.toLocaleString(
              'en-US',
              { maximumFractionDigits: 0 }
            )}
          </h2>
        </div>

        <div>
          <small>Funding Rate</small>
          <h2 style={{
            color: btcDerivativesData.fundingRate >= 0
              ? '#00c087'
              : '#f6465d'
          }}>
            {(btcDerivativesData.fundingRate * 100).toFixed(4)}%
          </h2>
        </div>

        <div>
          <small>BTC Mark Price</small>
          <h2>
            ${btcDerivativesData.markPrice.toLocaleString(
              'en-US',
              { maximumFractionDigits: 2 }
            )}
          </h2>
        </div>
      </div>

      <p className="muted">
        Next Funding:
        {' '}
        {new Date(
          btcDerivativesData.nextFundingTime
        ).toLocaleString()}
      </p>
    </>
  ) : (
    <p className="muted">
      BTC Futures data temporarily unavailable.
    </p>
  )}
</div>
    <div className="panel">

<div className="panel">
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <img
    src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png"
    alt="Bitcoin"
    width="42"
    height="42"
  />
  <div>
    <h2 style={{ margin: 0 }}>BTC Futures Historical Data</h2>
    <small className="muted">Bitcoin Open Interest & Funding History</small>
  </div>
</div>

  {btcHistoryLoading ? (
    <p className="muted">Loading historical futures data...</p>
  ) : btcOpenInterestHistory.length > 0 ? (
    <>
      <h3 style={{ marginTop: '16px' }}>
        Open Interest (BTC)
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'end',
        gap: '5px',
        height: '130px',
        marginTop: '16px',
        padding: '8px 0'
      }}>
        {btcOpenInterestHistory.map((item, index) => {
          const value = Number(item.sumOpenInterest || 0);
          const values = btcOpenInterestHistory.map(
            row => Number(row.sumOpenInterest || 0)
          );
          const max = Math.max(...values, 1);
          const min = Math.min(...values);
          const height = Math.max(
            5,
            ((value - min) / Math.max(max - min, 1)) * 100
          );

          return (
            <div
              key={item.timestamp || index}
              title={`${new Date(item.timestamp).toLocaleString()} — ${value.toFixed(2)} BTC`}
              style={{
                flex: 1,
                height: `${height}%`,
                minWidth: '3px',
                background: '#f7931a',
                borderRadius: '3px 3px 0 0'
              }}
            />
          );
        })}
      </div>

      <p className="muted">
        Last 30 hourly data points
      </p>

      <h3 style={{ marginTop: '22px' }}>
        Funding Rate History
      </h3>

      {btcFundingHistory.length > 0 ? (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '12px'
        }}>
          {btcFundingHistory.slice(-12).map((item, index) => {
            const rate = Number(item.fundingRate) * 100;

            return (
              <div
                key={item.fundingTime || index}
                title={new Date(item.fundingTime).toLocaleString()}
                style={{
                  flex: '1 1 75px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#20242c'
                }}
              >
                <small className="muted">
                  {new Date(item.fundingTime).toLocaleDateString()}
                </small>
                <h3 style={{
                  color: rate >= 0 ? '#00c087' : '#f6465d'
                }}>
                  {rate.toFixed(4)}%
                </h3>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">Funding history unavailable.</p>
      )}
    </>
  ) : (
    <p className="muted">
      Historical futures data temporarily unavailable.
    </p>
  )}
</div>  

<div className="panel">
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <img
      src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png"
      alt="Bitcoin"
      width="38"
      height="38"
    />
    <img
      src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png"
      alt="Ethereum"
      width="38"
      height="38"
      style={{ marginLeft: '-8px' }}
    />
  </div>
  <div>
    <h2 style={{ margin: 0 }}>Spot ETF Net Flow</h2>
    <small className="muted">Bitcoin & Ethereum ETF Flows</small>
  </div>
</div>

  {etfFlowLoading ? (
    <p className="muted">Loading BTC and ETH ETF flows...</p>
  ) : (
    <>
      {[
        { name: 'Bitcoin ETF', symbol: 'BTC', rows: etfFlowData.btc, color: '#f7931a' },
        { name: 'Ethereum ETF', symbol: 'ETH', rows: etfFlowData.eth, color: '#627eea' }
      ].map(asset => {
        const latest = asset.rows[0];

        return (
          <div key={asset.symbol} style={{ marginTop: '20px' }}>
            <h3 style={{ color: asset.color }}>
              {asset.name}
            </h3>

            {latest ? (
              <>
                <h2 style={{
                  color: latest.flowUsd >= 0 ? '#00c087' : '#f6465d'
                }}>
                  {latest.flowUsd >= 0 ? '+' : '-'}$
                  {Math.abs(latest.flowUsd).toLocaleString('en-US', {
                    maximumFractionDigits: 0
                  })}
                </h2>

                <small className="muted">
                  {latest.flowUsd >= 0 ? 'Net Inflow' : 'Net Outflow'}
                </small>

                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '5px',
                  height: '75px',
                  marginTop: '14px'
                }}>
                  {asset.rows.slice(0, 14).reverse().map((item, index, arr) => {
                    const max = Math.max(
                      ...arr.map(row => Math.abs(row.flowUsd)),
                      1
                    );

                    const height = Math.max(
                      5,
                      (Math.abs(item.flowUsd) / max) * 100
                    );

                    return (
                      <div
                        key={item.date}
                        title={`${item.date}: ${item.flowUsd >= 0 ? '+' : '-'}$${Math.abs(item.flowUsd).toLocaleString('en-US')}`}
                        style={{
                          flex: 1,
                          height: `${height}%`,
                          minWidth: '3px',
                          background: item.flowUsd >= 0 ? '#00c087' : '#f6465d',
                          borderRadius: '3px 3px 0 0'
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="muted">
                No reported ETF flow data available.
              </p>
            )}
          </div>
        );
      })}

      <p className="muted" style={{ marginTop: '18px' }}>
        Green = Inflow | Red = Outflow
      </p>
    </>
  )}
</div>

<div className="panel">
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <span style={{
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'rgba(246,70,93,0.13)',
    color: '#f6465d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  }}>⇅</span>
  <div>
    <h2 style={{ margin: 0 }}>Liquidations & Volatility</h2>
    <small className="muted">BTC Market Risk & Liquidation Activity</small>
  </div>
</div>

  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px'
  }}>
    <span style={{
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      background: liquidationStreamStatus === 'Connected'
        ? '#00c087'
        : '#f6465d'
    }} />

    <small className="muted">
      Liquidation Stream: {liquidationStreamStatus}
    </small>
  </div>

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    marginTop: '20px'
  }}>
    <div>
      <small>24h Realized Volatility</small>

      {btcVolatilityLoading ? (
        <p className="muted">Loading...</p>
      ) : btcVolatilityData ? (
        <h2>{btcVolatilityData.volatility.toFixed(2)}%</h2>
      ) : (
        <p className="muted">Unavailable</p>
      )}
    </div>

    <div>
      <small>BTC 24h Price Change</small>

      {btcVolatilityData ? (
        <h2 style={{
          color: btcVolatilityData.priceChange >= 0
            ? '#00c087'
            : '#f6465d'
        }}>
          {btcVolatilityData.priceChange >= 0 ? '+' : ''}
          {btcVolatilityData.priceChange.toFixed(2)}%
        </h2>
      ) : (
        <p className="muted">Unavailable</p>
      )}
    </div>
  </div>

  <p className="muted">
    Recent BTC Liquidation Events
  </p>

  {btcLiquidations.length > 0 ? (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '12px'
    }}>
      {btcLiquidations.slice(0, 10).map(item => {
        const isLong = item.side === 'SELL';

        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              background: '#20242c',
              borderRadius: '8px'
            }}
          >
            <div>
              <strong style={{
                color: isLong ? '#f6465d' : '#00c087'
              }}>
                {isLong ? 'Long Liquidation' : 'Short Liquidation'}
              </strong>

              <p className="muted">
                {new Date(item.time).toLocaleTimeString()}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong>
                ${item.value.toLocaleString('en-US', {
                  maximumFractionDigits: 0
                })}
              </strong>

              <p className="muted">
                BTC: {item.quantity.toFixed(4)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="muted">
      No recent BTC liquidation events
    </p>
  )}

  <p className="muted" style={{ marginTop: '16px' }}>
  
  </p>

</div>

      <h2>Market Data Status</h2>
      <div className="panel">
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <img
      src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png"
      alt="Bitcoin"
      width="38"
      height="38"
    />
    <img
      src="https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png"
      alt="Ethereum"
      width="38"
      height="38"
      style={{ marginLeft: '-8px' }}
    />
  </div>
  <div>
    <h2 style={{ margin: 0 }}>BTC & ETH Dominance</h2>
    <small className="muted">IG Market Share</small>
  </div>
</div>

  {globalCryptoData?.market_cap_percentage ? (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '15px'
      }}>
        <div>
          <small>Bitcoin Dominance</small>
          <h2 style={{ color: '#f7931a' }}>
            {Number(globalCryptoData.market_cap_percentage.btc).toFixed(2)}%
          </h2>
        </div>

        <div>
          <small>Ethereum Dominance</small>
          <h2 style={{ color: '#627eea' }}>
            {Number(globalCryptoData.market_cap_percentage.eth).toFixed(2)}%
          </h2>
        </div>
      </div>

      <div style={{
        display: 'flex',
        width: '100%',
        height: '12px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '12px',
        background: '#292929'
      }}>
        <div style={{
          width: `${Number(globalCryptoData.market_cap_percentage.btc)}%`,
          background: '#f7931a'
        }} />

        <div style={{
          width: `${Number(globalCryptoData.market_cap_percentage.eth)}%`,
          background: '#627eea'
        }} />

        <div style={{ flex: 1, background: '#777' }} />
      </div>

      <p className="muted">
        Live IG cryptocurrency market dominance
      </p>
    </>
  ) : (
    <p className="muted">Loading live dominance data...</p>
  )}
</div>
      <p className="muted">
        {globalCryptoLoading
          ? 'Connecting to market data providers...'
          : globalCryptoData
            ? 'IG market data loaded here BUY/SELL'
            : 'Market data temporarily unavailable'}
      </p>
    </div>

    <div className="panel form-panel">
      <h2>Deposit Assets</h2>
      <p className="muted">Deposit cryptocurrency into your IGtrade account.</p>
      <button
        className="btn btn-gold"
        onClick={() => setPage('Deposit')}
      >
        Deposit
      </button>
    </div>
  </section>
)}

        {page === 'Withdraw' && (
          <section className="page-section narrow-page">
            <div className="eyebrow">WALLET SERVICES</div>
            <h1>Withdraw <span className="gold-text">request</span></h1>
            <p className="muted">Please ensure that your address is entered correctly before submitting.</p>

            <div className="panel form-panel">
              <form
                onSubmit={(e) => {
                  submitWithdraw(e);
                }}
              >
                
<div className="available-balance">
  <span>Available balance</span>
  <strong>
    {withdrawMethod === 'TRC20'
      ? money(balance)
      : Number(coinWallets.Funding?.[withdrawMethod] || 0).toLocaleString('en-US', {
          maximumFractionDigits: 8
        })}
    <small> {withdrawMethod === 'TRC20' ? 'USDT' : withdrawMethod}</small>
  </strong>
</div>


                <label className="field-label">Select network</label>
                <div className="network-options">
                  {['TRC20', 'BTC', 'ETH'].map(n => (
                    <button
                      type="button"
                      key={n}
                      className={withdrawMethod === n ? 'network-active' : ''}
                      onClick={() => {
  setWithdrawMethod(n)
  setWithdrawAddress(walletAddresses[n] || '')
}}
                    >
                      <span className="network-symbol">
                        {n === 'TRC20' ? '₮' : n === 'BTC' ? '₿' : '◆'}
                      </span>
                      <strong>{n}</strong>
                      <small>
                        {n === 'TRC20'
                          ? 'USDT · Tron'
                          : n === 'BTC'
                            ? 'Bitcoin'
                            : 'Ethereum'}
                      </small>
                    </button>
                  ))}
                </div>

                <label className="field-label" htmlFor="withdraw-address">
                  Destination wallet address
                </label>
                <input
  className="text-input"
  id="withdraw-address"
  value={withdrawAddress}
  onChange={e => setWithdrawAddress(e.target.value)}
  placeholder={
    walletAddresses[withdrawMethod]
      ? 'Saved address loaded'
      : 'No saved address. Add one in My Profile'
  }
  required
/>

               
<label className="field-label" htmlFor="withdraw-amount">
  Amount ({withdrawCurrency}) · Available:{' '}
  {withdrawAvailableBalance.toLocaleString('en-US', {
    maximumFractionDigits: 8
  })} {withdrawCurrency}
</label>

<div className="amount-input">
  <span>
    {withdrawCurrency === 'USDT'
      ? '$'
      : withdrawCurrency === 'BTC'
        ? '₿'
        : 'Ξ'}
  </span>

  <input
    id="withdraw-amount"
    type="number"
    min={withdrawCurrency === 'USDT' ? '1' : '0.00000001'}
    max={withdrawAvailableBalance}
    step="any"
    value={withdrawAmount}
    onChange={e => setWithdrawAmount(e.target.value)}
    placeholder="0.00"
    required
  />
</div>

                <button
                  className="btn btn-gold btn-full btn-large"
                  type="submit"
                >
                  Submit withdrawal request ↗
                </button>
              </form>
            </div>

            <div className="notice deposit-compact-notice">
              <strong>IG</strong>
              <p>
                Please ensure that your address is entered
              </p>
            </div>
          </section>
        )}

       
{page === 'Assets' && (
  <section className="page-section assets-page">
    <div className="eyebrow">WALLET OVERVIEW</div>
    <h1>Your <span className="gold-text">Assets</span></h1>

    <div className="assets-total-card panel">
      <div className="assets-total-heading">
        <span>Estimated Total Value</span>
        <select
          value={selectedAsset}
          onChange={e => setSelectedAsset(e.target.value)}
          className="wallet-currency-select"
        >
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
          <option value="SOL">SOL</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      <h1>{money(fundingTotalUSDT)} <small>USDT</small></h1>
      <p className="muted">● Available funds</p>

      <div className="assets-pnl">
        <span>Today's PNL</span>
        <strong className={todaysPNL >= 0 ? 'positive' : 'negative'}>
          {todaysPNL >= 0 ? '+' : '-'}
          {money(Math.abs(todaysPNL))} USDT
          ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
        </strong>
      </div>
    </div>

    <div className="assets-actions">
      <button onClick={() => setPage('Deposit')}>
        <span>＋</span><small>Add funds</small>
      </button>
      
      <button onClick={() => setPage('Withdraw')}>
        <span>↑</span><small>Send</small>
      </button>
  
      <button onClick={() => setAssetsAction('Transfer')}>
        <span>⇄</span><small>Transfer</small>
      </button>
      <button onClick={() => setAssetsAction('Convert')}>
  <span>⇄</span><small>Convert</small>
</button>
     
<button onClick={() => {
  setAssetsAction('');
  setPage('Earn');
}}>
  <span>◇</span><small>Earn</small>
</button>
<button onClick={() => {
  setAssetsAction('');
  setPage('Withdraw');
}}>
  <span>↑</span><small>Withdraw</small>
</button>
    </div>
   {assetsAction === 'Transfer' && (
  <div className="panel form-panel">
    <div className="section-heading">
      <h2>Transfer</h2>
      <button onClick={() => setAssetsAction('')}>✕</button>
    </div>

    <div className="transfer-wallet-select">
  <div className="transfer-wallet-box">
    <label className="field-label">From</label>
    <select
      className="text-input"
      value={transferFrom}
      onChange={e => {
        const value = e.target.value;
        setTransferFrom(value);
        setTransferTo(value === 'Spot' ? 'Funding' : 'Spot');
      }}
    >
      <option value="Spot">Spot Wallet</option>
      <option value="Funding">Funding Wallet</option>
    </select>
  </div>

  <div className="transfer-swap-center">
    <button
      type="button"
      className="transfer-swap-btn"
      onClick={() => {
        setTransferFrom(transferTo);
        setTransferTo(transferFrom);
      }}
      title="Swap wallets"
    >
      ⇅
    </button>
  </div>

  <div className="transfer-wallet-box">
    <label className="field-label">To</label>
    <select
      className="text-input"
      value={transferTo}
      onChange={e => setTransferTo(e.target.value)}
    >
      <option value="Spot">Spot Wallet</option>
      <option value="Funding">Funding Wallet</option>
    </select>
  </div>
</div>

    <label className="field-label">Coin</label>
    <select className="text-input" value={transferCoin}
      onChange={e => setTransferCoin(e.target.value)}>
      {['USDT','BTC','ETH','SOL','USDC','EUR','GOLD'].map(c =>
        <option key={c} value={c}>{c}</option>
      )}
    </select>

    <label className="field-label">
  Amount
  <button
    type="button"
    className="max-btn"
    onClick={() => {
      const available = getWalletBalance(transferFrom, transferCoin);
setTransferAmount(String(available));
    }}
  >
    MAX
  </button>
</label>

<input
  className="text-input"
  type="number"
  min="0"
  value={transferAmount}
  onChange={e => setTransferAmount(e.target.value)}
  placeholder="Enter amount"
/>

   <button
  type="button"
  className="btn btn-gold btn-full"
  onClick={handleTransfer}
>
  Confirm Transfer
</button>
  </div>
)}

{assetsAction === 'Convert' && (
  <div className="panel form-panel">
    <div className="section-heading">
      <h2>Convert</h2>
      <button onClick={() => setAssetsAction('')}>✕</button>
    </div>

    <label className="field-label">From</label>
    <select className="text-input" value={convertFrom}
      onChange={e => setConvertFrom(e.target.value)}>
      {['USDT','BTC','ETH','SOL','USDC','EUR','GOLD'].map(c =>
        <option key={c} value={c}>{c}</option>
      )}
    </select>

    <div className="convert-swap-row">
  <button
    type="button"
    className="convert-swap-btn"
    onClick={() => {
      setConvertFrom(convertTo);
      setConvertTo(convertFrom);
    }}
  >
    ⇅
  </button>
</div>

    <label className="field-label">To</label>
    <select className="text-input" value={convertTo}
      onChange={e => setConvertTo(e.target.value)}>
      {['USDT','BTC','ETH','SOL','USDC','EUR','GOLD']
        .filter(c => c !== convertFrom)
        .map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    <label className="field-label">Amount</label>

<div className="amount-input-wrap">
  <input
    className="text-input"
    type="number"
    min="0"
    value={convertAmount}
   onChange={e => {
  setConvertAmount(e.target.value);
  setConvertPreview(null);
}}
    placeholder="Enter amount"
  />

  <button
    type="button"
    className="amount-max-btn"
    onClick={() => {
  const available = getWalletBalance('Funding', convertFrom);
  setConvertAmount(String(available));
  setConvertPreview(null);
}}
  >
    MAX
  </button>
</div>

    <p className="muted">
      Conversion will use the live market exchange rate.
      Converted coins will go to your Funding Wallet.
    </p>

    <button className="btn btn-gold btn-full"
  onClick={handleConvert}>
  Preview Conversion
</button>
{convertPreview &&
  convertPreview.from === convertFrom &&
  convertPreview.to === convertTo &&
  convertPreview.amount === Number(convertAmount) && (
    <div className="panel">
      <p>Conversion Preview</p>
      <strong>
        {convertPreview.amount} {convertPreview.from}
      </strong>
      <p>↓</p>
      <strong>
        {convertPreview.receiveAmount} {convertPreview.to}
      </strong>
      <p className="muted">
        Estimated live market conversion rate
      </p>
    </div>
)}
  </div>
)}
    <div className="panel assets-wallet-panel">
      <div className="assets-tabs">
        <button
          className={assetsWalletTab === 'Spot' ? 'selected' : ''}
          onClick={() => setAssetsWalletTab('Spot')}
        >
          Spot
        </button>
        <button
          className={assetsWalletTab === 'Funding' ? 'selected' : ''}
          onClick={() => setAssetsWalletTab('Funding')}
        >
          Funding
        </button>
      </div>

     {selectedAsset ? (
  <div className="coin-details">
    <div className="coin-details-header">
      <button
        type="button"
        onClick={() => setSelectedAsset('')}
      >
        ← Back
      </button>
      <span>{selectedAssetWallet} Wallet</span>
    </div>

    <div className="coin-details-balance">
  <div className="coin-balance-title">
    <span className={`coin-logo coin-${selectedAsset.toLowerCase()}`}>
      {selectedAsset === 'USDT' ? '₮' :
       selectedAsset === 'BTC' ? '₿' :
       selectedAsset === 'ETH' ? '◆' :
       selectedAsset === 'SOL' ? '◎' :
       selectedAsset === 'USDC' ? '$' :
       selectedAsset === 'EUR' ? '€' : 'Au'}
    </span>
    <small>{selectedAsset} Balance</small>
  </div>
      <h2>
        {getWalletBalance(selectedAssetWallet, selectedAsset).toLocaleString('en-US', {
          maximumFractionDigits: 8
        })} {selectedAsset}
      </h2>
      <p>
        ≈ {money(
          getWalletBalance(selectedAssetWallet, selectedAsset) *
          Number(assetRates[selectedAsset] || 0)
        )} USD
      </p>
    </div>

    <div className="coin-market-grid">
      {[
        { key: 'BTC', label: 'BTC/USDT' },
        { key: 'XAU', label: 'XAU/USD' },
        { key: 'ETH', label: 'ETH/USDT' }
      ].map(item => {
        const market = livePrices[item.key] || {};
        const change = Number(market.change || 0);

        return (
          <div className="coin-market-card" key={item.key}>
            <small>{item.label}</small>
            <strong>{Number(market.price || 0).toLocaleString('en-US')}</strong>
            <span style={{
              color: change > 0 ? '#0ecb81' : change < 0 ? '#f6465d' : 'inherit'
            }}>
              {change > 0 ? '+' : ''}{change.toFixed(3)}%
            </span>
          </div>
        );
      })}
    </div>

   <div className="coin-details-actions">
  <button onClick={() => setAssetsAction('Deposit')}>
    <span>＋</span> Add USDT
  </button>

  <button onClick={() => setAssetsAction('Withdraw')}>
    <span>↑</span> Send
  </button>

  <button onClick={() => setAssetsAction('Transfer')}>
    <span>⇄</span> Transfer
  </button>
</div>
  </div>
) : (

<div className="assets-coin-list">
  {['USDT', 'BTC', 'ETH', 'SOL', 'USDC', 'EUR', 'GOLD'].map(coin => {
    const wallet = assetsWalletTab;
    const amount = getWalletBalance(wallet, coin);

    if (amount <= 0) return null;

    const usdValue = amount * Number(assetRates[coin] || 0);
    const marketSymbol = coin === 'GOLD' ? 'XAU' : coin;
    const marketData = livePrices[marketSymbol];
    const change = Number(marketData?.change ?? 0);

    const logoNames = {
      USDT: 'usdt',
      BTC: 'btc',
      ETH: 'eth',
      SOL: 'sol',
      USDC: 'usdc',
      EUR: 'eur',
      GOLD: 'gold'
    };

   return (
  <button
    type="button"
    className="assets-balance-row"
    key={coin}
    onClick={() => {
      setSelectedAsset(coin);
      setSelectedAssetWallet(wallet);
    }}
  >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img
            src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${logoNames[coin]}.png`}
            alt={coin}
            width="36"
            height="36"
            style={{ borderRadius: '50%' }}
            onError={e => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />

          <div style={{
            display: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#30343b',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {coin.slice(0, 1)}
          </div>

          <div>
            <strong>{coin}</strong>
            <small>{wallet}</small>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <strong>
            {amount.toLocaleString('en-US', {
              maximumFractionDigits: 8
            })} {coin}
          </strong>

          <small>≈ {money(usdValue)} USD</small>

          <small style={{
            color: change > 0
              ? '#0ecb81'
              : change < 0
                ? '#f6465d'
                : 'inherit',
            fontWeight: 600
          }}>
            {change > 0 ? '+' : ''}
            {change.toFixed(3)}%
          </small>
        </div>
           </button>
    );
  })}
</div>
)}

</div>
<div className="stat-grid">
  <div className="panel stat-card">
    <small>USDT Balance</small>
    <strong>{money(balance)}</strong>
    <span className="muted">USDT funds</span>
  </div>

  <div className="panel stat-card">
    <small>BTC Balance</small>
    <strong>{btcBalance.toFixed(8)} BTC</strong>
    <span className="muted">
      {livePrices.BTC?.price
        ? money(btcBalance * livePrices.BTC.price)
        : 'Market price loading'}
    </span>
  </div>

  <div className="panel stat-card">
    <small>ETH Balance</small>
    <strong>{ethBalance.toFixed(8)} ETH</strong>
    <span className="muted">
      {livePrices.ETH?.price
        ? money(ethBalance * livePrices.ETH.price)
        : 'Market price loading'}
    </span>
  </div>

  <div className="panel stat-card">
    <small>Trades</small>
    <strong>{tradeHistory.length}</strong>
    <span className="muted">Completed trades</span>
  </div>

  <div className="panel stat-card">
    <small>Wallet requests</small>
    <strong>{requests.length}</strong>
    <span className="muted">Deposit / Withdraw</span>
  </div>
</div>

    <div className="panel history-panel">
      <div className="history-tabs">
        {['Trade History', 'Deposit History', 'Withdraw History'].map(tab => (
          <button
            key={tab}
            className={profileTab === tab ? 'selected' : ''}
            onClick={() => setProfileTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {profileTab === 'Trade History' ? (
        tradeHistory.length ? (
          tradeHistory.map((t, i) => (
            <div className="history-trade-wrap" key={t.id || i}>
              <button
                className="history-row history-row-button"
                onClick={() =>
                  setExpandedTradeId(
                    expandedTradeId === (t.id || i) ? null : (t.id || i)
                  )
                }
              >
                <span className="history-icon">↗</span>
                <div className="history-main">
                  <strong>{t.direction} {t.assetName || t.symbol} · {t.symbol}</strong>
                  <small>{t.resultAt} · {t.duration}s trade · click for details</small>
                </div>
                <div className="history-amount">
                  <strong className={t.profit < 0 ? 'negative' : 'positive'}>
                    {t.profit < 0 ? '-' : '+'}{money(Math.abs(t.profit))}
                  </strong>
                  <small>
                    {expandedTradeId === (t.id || i) ? 'Hide details ↑' : 'View details ↓'}
                  </small>
                </div>
              </button>

              {expandedTradeId === (t.id || i) && (
                <div className="history-detail">
                  <div>
                    <small>Opening price</small>
                    <strong>{quotePrice(t.openPrice ?? t.price, t.symbol)}</strong>
                  </div>
                  <div>
                    <small>Target price</small>
                    <strong>{quotePrice(t.targetPrice, t.symbol)}</strong>
                  </div>
                  <div>
                    <small>Closing price</small>
                    <strong>{quotePrice(t.endPrice, t.symbol)}</strong>
                  </div>
                  <div>
                    <small>Trade amount</small>
                    <strong>{money(t.amount)}</strong>
                  </div>
                  <div>
                    <small>{t.profit < 0 ? 'Loss' : 'Profit'}</small>
                    <strong className={t.profit < 0 ? 'negative' : 'positive'}>
                      {t.profit < 0 ? '-' : '+'}{money(Math.abs(t.profit))}
                    </strong>
                  </div>
                  <div>
                    <small>Rate</small>
                    <strong>{Math.round(t.virtualRate * 100)}%</strong>
                  </div>
                  <div className="history-chart-full">
                    <Candles compact candles={t.endCandles || t.startCandles || []} />
                  </div>
                  <p>Opened: {t.openTime || t.startedAt} · Closed: {t.closeTime || t.resultAt}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span>◌</span>
            <strong>No trades yet</strong>
            <p>Completed trades will appear here.</p>
          </div>
        )
      ) : (
        requests.filter(r =>
          r.type === (profileTab === 'Deposit History' ? 'Deposit' : 'Withdraw')
        ).length ? (
          requests.filter(r =>
            r.type === (profileTab === 'Deposit History' ? 'Deposit' : 'Withdraw')
          ).map(r => (
            <div className="history-row" key={r.id}>
              <span className="history-icon">
                {r.type === 'Deposit' ? '↓' : '↑'}
              </span>
              <div className="history-main">
                <strong>{r.type} · {r.method}</strong>
                <small>{r.created}</small>
                {r.type === 'Withdraw' && (
                  <small className="history-wallet-address">
                    Wallet Address: {r.address || 'Address unavailable'}
                  </small>
                )}
                {r.adminNote && (
                  <div className="history-detail">
                    <small>Dear user</small>
                    <p>{r.adminNote}</p>
                  </div>
                )}
              </div>
              <div className="history-amount">
                <strong className={r.type === 'Withdraw' ? 'negative' : 'positive'}>
                  {r.type === 'Withdraw' ? '-' : '+'}{money(Math.abs(Number(r.amount)))}
                </strong>
                <small>Status: {r.status}</small>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span>◌</span>
            <strong>No {profileTab.toLowerCase()} yet</strong>
            <p>Your requests will appear here.</p>
          </div>
        )
      )}
    </div>

    <div className="profile-hero panel">
      <div className="profile-avatar">IG</div>
      <div className="profile-info">
        <h2>
          {profileName ||
            authSession?.user?.user_metadata?.full_name ||
            authSession?.user?.email?.split('@')[0] ||
            authSession?.user?.phone ||
            'IGtrade Official Platforms Account'}
        </h2>
{authSession?.user ? (
  <>
    <button
      className="btn btn-outline"
      onClick={() => setShowPasswordChange(true)}
    >
      Change Password
    </button>

    <button
      className="btn btn-outline"
      onClick={async () => {
        const { error } = await supabase.auth.signOut();
        if (error) return setToast(error.message);
        setAuthSession(null);
        setProfileName('');
        setProfileEmail('');
        setIsAdmin(false);
        setToast('Signed out successfully.');
      }}
    >
      Sign out
    </button>
  </>
) : (
  <button
            className="btn btn-outline"
            onClick={() => {
              setAuthMode('login');
              setLoginOpen(true);
            }}
          >
            Sign in
          </button>
        )}

        <p className="muted">Account</p>
        <span className="status-pill status-on">IGtrade Account</span>
      </div>
    </div>
<div className="panel assets-profile-card">
  <button
    type="button"
    className="assets-profile-button"
    onClick={() => setAssetsAction('MyProfile')}
  >
    <span className="assets-profile-icon">♙</span>

    <span className="assets-profile-text">
      <strong>My Profile</strong>
      <small>Manage your personal information</small>
    </span>

    <span className="assets-profile-arrow">›</span>
  </button>
</div>


{assetsAction === 'MyProfile' && (
  <div className="myprofile-popup-overlay">
    <div className="myprofile-popup">
      <div className="myprofile-popup-header">
        <div className="myprofile-popup-title">
          <span className="myprofile-popup-logo">♙</span>
          <div>
            <h2>My Profile</h2>
            <p>Manage your personal information</p>
          </div>
        </div>

        <button
          type="button"
          className="myprofile-popup-close"
          onClick={() => setAssetsAction('')}
          aria-label="Close profile"
        >
          ✕
        </button>
      </div>

      <div className="myprofile-popup-content">
        <MyProfile
          session={authSession}
          supabase={supabase}
        />
      </div>
    </div>
  </div>
)}

{showPasswordChange && (
  <div className="password-modal-overlay">
    <div className="password-modal panel">
      <div className="section-heading">
        <div>
          <div className="eyebrow">ACCOUNT SECURITY</div>
          <div className="password-security-icon">
  <span>♙</span>
</div>
<h2>Change Password</h2>
<p className="muted">Protect your account with a new password</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswordChange(false)}
        >
          ✕
        </button>
      </div>
<label className="field-label">Current Password</label>

<div className="password-input-wrap">
  <input
    className="text-input"
    type={showCurrentPassword ? 'text' : 'password'}
    value={currentPassword}
    onChange={e => setCurrentPassword(e.target.value)}
    placeholder="Enter current password"
  />
<small className="password-hint">Enter your current password</small>
  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
  >
    {showCurrentPassword ? '🙈' : '👁'}
  </button>
</div>
     <label className="field-label">New Password</label>

<div className="password-input-wrap">
  <input
    className="text-input"
    type={showNewPassword ? 'text' : 'password'}
    value={newPassword}
    onChange={e => setNewPassword(e.target.value)}
    placeholder="Enter new password"
  />
<small className="password-hint">Minimum 6 characters</small>
  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowNewPassword(!showNewPassword)}
  >
    {showNewPassword ? '🙈' : '👁'}
  </button>
</div>

      <label className="field-label">Confirm New Password</label>

<div className="password-input-wrap">
  <input
    className="text-input"
    type={showConfirmPassword ? 'text' : 'password'}
    value={confirmPassword}
    onChange={e => setConfirmPassword(e.target.value)}
    placeholder="Confirm new password"
  />
<small className="password-hint">Re-enter your new password (minimum 6 characters)</small>
  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  >
    {showConfirmPassword ? '🙈' : '👁'}
  </button>
</div>

      <button
        type="button"
        className="btn btn-gold btn-full"
        disabled={passwordBusy}
        onClick={handlePasswordChange}
      >
        {passwordBusy ? 'Updating...' : 'Update Password'}
      </button>

      <button
        type="button"
        className="btn btn-outline btn-full"
        onClick={() => setShowPasswordChange(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

  </section>
)}


{page === 'Earn' && (
  <section className="page-section ig-earn-page">
    <div className="ig-earn-heading">
      <div>
        <div className="eyebrow">IGTRADE EARN</div>
        <h1>Earn <span className="gold-text">Rewards</span></h1>
        <p className="muted">
        </p>
      </div>
      <span className="ig-earn-demo-label">EARN</span>
    </div>

    <div className="ig-earn-summary">
  <div className="ig-earn-overview">
    <div className="ig-earn-overview-header">
      <span>Earn Overview</span>
      <small></small>
    </div>

    <div className="ig-earn-balance">
      <span>Total Earn Balance</span>
      <strong>
        {earnTotal.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} <small>USDT</small>
      </strong>
    </div>

    <div className="ig-earn-overview-stats">
      <div>
        <span>Estimated Daily Rewards</span>
        <strong className="ig-earn-profit">
          +{earnEstimatedIncome.toFixed(4)} USDT
        </strong>
      </div>

      <div>
        <span>Active Products</span>
        <strong>{earnPositions.length}</strong>
      </div>
    </div>
  </div>
</div>

    <div className="ig-earn-tabs">
      {['Simple Earn', 'My Positions', 'Advanced'].map(tab => (
        <button
          key={tab}
          type="button"
          className={earnTab === tab ? 'active' : ''}
          onClick={() => setEarnTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>

    {earnTab === 'Simple Earn' && (
      <>
        <div className="ig-earn-intro">
          <div>
            <h2>Simple Earn</h2>
            <p className="muted">
            </p>
          </div>
          <div className="ig-earn-type-tabs">
            {['Flexible', 'Locked'].map(type => (
              <button
                key={type}
                type="button"
                className={earnType === type ? 'active' : ''}
                onClick={() => setEarnType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        
<div className="ig-earn-product-grid">
  {earnProducts.map(product => {
    const isSubscribed = earnPositions.some(
      position => position.coin === product.coin
    );

    return (
      <div
        key={product.coin}
        className={`ig-earn-product ${
          earnCoin === product.coin ? 'selected' : ''
        }`}
      >
        <button
          type="button"
          className="ig-earn-product-select"
          onClick={() => setEarnCoin(product.coin)}
        >
          <span className="ig-earn-coin">
            <img
              src={product.logo}
              alt={product.coin}
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </span>

          <span className="ig-earn-product-name">
            <strong>{product.coin}</strong>
            <small>{product.name}</small>
          </span>

          <span className="ig-earn-product-apr">
  <strong className="ig-earn-apr-green">
    {(earnType === 'Flexible'
      ? product.flexible
      : product.locked).toFixed(2)}%
  </strong>
  <small className="ig-earn-apr-green">APR</small>
          </span>
        </button>

        {isSubscribed ? (
          <span className="ig-earn-subscribed">Subscribed</span>
        ) : (
          <button
            type="button"
            className="ig-earn-subscribe-btn"
           onClick={() => {
  setToast(`Subscribe clicked: ${product.coin}`);
  setEarnCoin(product.coin);
  setEarnAmount('');
  setShowEarnSubscribe(true);
}}
          >
            Subscribe
          </button>
        )}
      </div>
    );
  })}
</div>


{showEarnSubscribe && (
  <div className="ig-earn-subscribe panel">
    <div className="ig-earn-subscribe-heading">
      <div>
        <div className="eyebrow">SUBSCRIPTION</div>
        <h2>Subscribe to {earnCoin}</h2>
        <p className="muted">
          {selectedEarnProduct.name} · {earnType}
        </p>
      </div>

      <div className="ig-earn-apr-box">
        <strong>{selectedEarnApr.toFixed(2)}%</strong>
        <small>Illustrative APR</small>
      </div>
    </div>

    <div className="ig-earn-details">
      <div>
        <span>Product</span>
        <strong>{earnType} {earnCoin}</strong>
      </div>
      <div>
        <span>APR</span>
        <strong>{selectedEarnApr.toFixed(2)}%</strong>
      </div>
      <div>
        <span>Duration</span>
        <strong>
          {earnType === 'Flexible'
            ? 'Flexible'
            : `${selectedEarnProduct.days} days`}
        </strong>
      </div>
      <div>
        <span>Minimum</span>
       <strong>10 USDT</strong>
      </div>
    </div>

    <label className="field-label" htmlFor="ig-earn-amount">
     Subscription amount (USDT)
    </label>

    
<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
  <input
    id="ig-earn-amount"
    className="text-input"
    type="number"
    min="0"
    step="any"
    placeholder="Enter USDT amount"
    value={earnAmount}
    onChange={event => setEarnAmount(event.target.value)}
    style={{ flex: 1, minWidth: 0 }}
  />
  <button
    type="button"
    className="btn btn-gold"
    onClick={() => setEarnAmount(String(Number(balance || 0)))}
  >
    MAX
  </button>
</div>

    

<div className="ig-earn-estimate">
  {(() => {
    const usdtPrice = Number(assetRates.USDT || 0);
    const marketRate = earnCoin === 'XAU'
      ? Number(assetRates.GOLD || 0)
      : earnCoin === 'USDT'
        ? usdtPrice
        : Number(assetRates[earnCoin] || 0);

    const inputAmount = Number(earnAmount || 0);
    const convertedAmount =
      usdtPrice > 0 && marketRate > 0
        ? inputAmount * usdtPrice / marketRate
        : 0;

    const daily = convertedAmount * selectedEarnApr / 100 / 365;
    const monthly = daily * 30;
    const yearly = daily * 365;

    const rewardUSD = reward =>
      usdtPrice > 0
        ? (reward * marketRate / usdtPrice).toFixed(4)
        : '—';

    return (
      <>
        <span>Converted {earnCoin} Amount</span>
        <strong>
          {convertedAmount.toFixed(8)} {earnCoin}
        </strong>

        <span>Estimated Daily Reward</span>
        <strong>+{daily.toFixed(8)} {earnCoin}</strong>
        <small>USDT equivalent: {rewardUSD(daily)} USDT</small>

        <span>Estimated Monthly Reward (30 days)</span>
        <strong>+{monthly.toFixed(8)} {earnCoin}</strong>
        <small>USDT equivalent: {rewardUSD(monthly)} USDT</small>

        <span>Estimated Yearly Reward (365)</span>
        <strong>+{yearly.toFixed(8)} {earnCoin}</strong>
        <small>USDT equivalent: {rewardUSD(yearly)} USDT</small>
      </>
    );
  })()}
</div>


    <button
      type="button"
      className="btn btn-gold btn-full"
      onClick={subscribeToEarn}
    >
      Subscribe
    </button>

    <button
      type="button"
      className="ig-earn-redeem-btn"
      onClick={() => setShowEarnSubscribe(false)}
    >
      Cancel
    </button>

    
  </div>
)}

      </>
    )}
    {earnTab === 'My Positions' && (
      <div className="panel ig-earn-positions">
        <div className="ig-earn-intro">
          <div>
            <h2>My Earn Positions</h2>
            <p className="muted">Your locally stored subscriptions</p>
          </div>
          <span className="ig-earn-demo-label">Subscriptions</span>
        </div>

        {earnPositions.length === 0 ? (
          <div className="ig-earn-empty">
            <div className="ig-earn-empty-icon">◇</div>
            <h3>No active positions</h3>
            <p className="muted">
              Your subscriptions will appear here
            </p>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setEarnTab('Simple Earn')}
            >
              Explore Products
            </button>
          </div>
      ) : (
  <>
  <div className="ig-earn-position-tools">
  <input
    className="text-input"
    type="search"
    placeholder="Search asset..."
    value={earnSearch}
    onChange={event => setEarnSearch(event.target.value)}
  />

  <select
    className="text-input"
    value={earnFilter}
    onChange={event => setEarnFilter(event.target.value)}
  >
    <option value="All">All products</option>
    <option value="Flexible">Flexible</option>
    <option value="Locked">Locked</option>
  </select>
</div>

<div className="ig-earn-table-wrap">
  <table className="ig-earn-table">
    <thead>
      <tr>
        <th>Asset</th>
        <th>Type</th>
        <th>Amount</th>
        <th>APR</th>
        <th>Duration</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {filteredEarnPositions.length === 0 ? (
        <tr>
          <td colSpan="7" className="ig-earn-no-results">
            No matching positions found
          </td>
        </tr>
      ) : (
        filteredEarnPositions.map(position => (
          <tr key={position.id}>
            <td>
              <strong>{position.coin}</strong>
              <small>{position.name}</small>
            </td>
            <td>{position.type}</td>
            <td>{position.amount.toLocaleString('en-US')}</td>
            <td>{position.apr.toFixed(2)}%</td>
            <td>
              {position.days === 0
                ? 'Flexible'
                : `${position.days} days`}
            </td>
            <td>
              <span className="ig-earn-status">
  Active
</span>
            </td>
            <td>
              <button
                type="button"
                className="ig-earn-redeem-btn"
                onClick={() => redeemEarnPosition(position.id)}
              >
                Redeem
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  </>
        )}
      </div>
    )}

    
{earnTab === 'Advanced' && (
  <div className="ig-advanced">

    <div className="ig-advanced-heading">
      <div>
        <p>Explore yield, investment, staking and borrowing Coin</p>
      </div>
      {advancedSelection && (
        <button
          className="ig-advanced-back"
          onClick={() => {
            setAdvancedSelection('');
            setAdvancedNotice('');
            setAdvancedAmount('');
            setAdvancedCollateral('');
            setAdvancedAgreed(false);
          }}
        >
          ← All Products
        </button>
      )}
    </div>

    {!advancedSelection && (
      <>
        <div className="ig-advanced-feature-grid">

          <button className="ig-advanced-feature gold-feature"
            onClick={() => setAdvancedSelection('Gold Yield')}>
            <img src={advancedGoldLogo} alt="PAX Gold" />
            <span className="ig-feature-tag">GOLD</span>
            <h3>Gold Yield</h3>
            <p>Explore illustrative yield opportunities linked to gold</p>
            <strong>Explore Gold →</strong>
          </button>

          <button className="ig-advanced-feature dual-feature"
            onClick={() => setAdvancedSelection('Dual Investment')}>
            <span className="ig-feature-symbol">⇄</span>
            <span className="ig-feature-tag">INVESTMENT</span>
            <h3>Dual Investment</h3>
            <p>Choose a target price and review a sample settlement</p>
            <strong>Explore Dual Investment →</strong>
          </button>

          <button className="ig-advanced-feature staking-feature"
            onClick={() => setAdvancedSelection('Staking')}>
            <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040" alt="Ethereum" />
            <span className="ig-feature-tag">REWARDS</span>
            <h3>Staking</h3>
            <p>Review ETH and SOL staking examples and rewards</p>
            <strong>Explore Staking →</strong>
          </button>

          <button className="ig-advanced-feature borrow-feature"
            onClick={() => setAdvancedSelection('Borrow Assets')}>
            
<span className="ig-feature-symbol borrow-symbol">
  <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="14" rx="2" />
    <path d="M7 7V5a2 2 0 0 1 2-2h8M14 3h3v3M17 3l-5 5M15 14h3" />
  </svg>
</span>

            <span className="ig-feature-tag">LOANS</span>
            <h3>Borrow Assets</h3>
            <p>Review flexible, fixed and VIP loan examples</p>
            <strong>Explore Loans →</strong>
          </button>

        </div>

        <div className="ig-advanced-summary">
          <div>
            <span>Products</span>
            <strong>4</strong>
          </div>
          <div>
            <span> Positions</span>
            <strong>{advancedPositions.length}</strong>
          </div>
          <div>
            <span>Account</span>
            <strong></strong>
          </div>
        </div>
      </>
    )}

    {advancedSelection === 'Gold Yield' && (
      <div className="ig-advanced-panel">
        <div className="ig-advanced-product-title">
          <img src={advancedGoldLogo} alt="PAX Gold logo" />
          <div>
            <h3>Gold Yield</h3>
            <p>Gold-linked illustrative yield product</p>
          </div>
          <span className="ig-product-label">GOLD</span>
        </div>

        <div className="ig-advanced-stats">
          <div><span>APR</span><strong>3.50%</strong></div>
          <div><span>Product</span><strong>Gold</strong></div>
          <div><span>Term</span><strong>Flexible</strong></div>
        </div>

        <label className="ig-advanced-label">Investment Amount</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="0" placeholder="Enter amount"
            value={advancedAmount}
            onChange={e => setAdvancedAmount(e.target.value)} />
          <span>XAU/USDT</span>
        </div>

        <p className="ig-advanced-hint">Minimum amount: 0.01 PAXG</p>

        <button className="ig-advanced-primary"
          onClick={() => {
            if (advancedAmountNumber < 0.01) {
              setAdvancedNotice('Enter at least 0.01 PAXG');
              return;
            }
            setAdvancedPositions(p => [...p, {
              id: Date.now(), product: 'Gold Yield',
              asset: 'XAU/USDT', amount: advancedAmount,
              rate: '3.50%', status: 'Active'
            }]);
            setAdvancedNotice('Gold Yield position created successfully');
            setAdvancedAmount('');
          }}>
          Subscribe to Gold Yield
        </button>
      </div>
    )}

    {advancedSelection === 'Dual Investment' && (
      <div className="ig-advanced-panel">
        <div className="ig-advanced-product-title">
          <span className="ig-large-symbol">⇄</span>
          <div>
            <h3>Dual Investment</h3>
            <p>Illustrative target-price investment</p>
          </div>
        </div>

        <div className="ig-advanced-stats">
          <div><span>APR</span><strong>8.00%</strong></div>
          <div><span>Settlement</span><strong></strong></div>
          <div><span>Duration</span><strong>7 Days</strong></div>
        </div>

        <label className="ig-advanced-label">Investment Direction</label>
        <div className="ig-advanced-choice">
          <button className={advancedDirection === 'Up' ? 'selected' : ''}
            onClick={() => setAdvancedDirection('Up')}>Buy Low</button>
          <button className={advancedDirection === 'Down' ? 'selected' : ''}
            onClick={() => setAdvancedDirection('Down')}>Sell High</button>
        </div>

        <label className="ig-advanced-label">Investment Amount</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="0" placeholder="Enter amount"
            value={advancedAmount}
            onChange={e => setAdvancedAmount(e.target.value)} />
          <span>USDT</span>
        </div>

        <label className="ig-advanced-label">Target Price</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="0" placeholder="Enter target price"
            id="advanced-target-price" />
          <span>USDT</span>
        </div>

        <div className="ig-advanced-info">
          <span>Estimated APR</span><strong>8.00%</strong>
          <span>Investment period</span><strong>7 Days</strong>
        </div>

        <button className="ig-advanced-primary"
          onClick={() => {
            const target = Number(document.getElementById('advanced-target-price')?.value);
            if (advancedAmountNumber <= 0 || target <= 0) {
              setAdvancedNotice('Enter a valid amount and target price');
              return;
            }
            setAdvancedPositions(p => [...p, {
              id: Date.now(), product: 'Dual Investment',
              asset: 'USDT', amount: advancedAmount,
              rate: '8.00%', status: 'Active'
            }]);
            setAdvancedNotice('Dual Investment position created successfully');
            setAdvancedAmount('');
          }}>
          Confirm Investment
        </button>
      </div>
    )}

    {advancedSelection === 'Staking' && (
      <div className="ig-advanced-panel">
        <h3 className="ig-panel-heading">Staking Products</h3>
        <p className="ig-panel-description">Select an asset</p>

        <div className="ig-advanced-asset-list">
          {advancedStakingProducts.map(product => (
            <div className="ig-advanced-asset-row" key={product.asset}>
              <div className="ig-advanced-asset-name">
                <img src={product.logo} alt={product.name} />
                <div><strong>{product.asset}</strong><small>{product.name}</small></div>
              </div>
              <div className="ig-advanced-rate">
                <strong>{product.rate}</strong><small> APR</small>
              </div>
              <button onClick={() => {
                setAdvancedAmount('');
                setAdvancedSelection('Stake ' + product.asset);
                setAdvancedNotice('');
              }}>Stake</button>
            </div>
          ))}
        </div>
      </div>
    )}

    {advancedSelection.startsWith('Stake ') && (
      <div className="ig-advanced-panel">
        <h3>Stake {advancedSelection.replace('Stake ', '')}</h3>
        <p className="ig-panel-description">Create an illustrative staking position</p>

        <div className="ig-advanced-stats">
          <div><span>Asset</span><strong>{advancedSelection.replace('Stake ', '')}</strong></div>
          <div><span> APR</span><strong>{advancedSelection.includes('ETH') ? '3.20%' : '5.50%'}</strong></div>
          <div><span>Term</span><strong>Flexible</strong></div>
        </div>

        <label className="ig-advanced-label">Stake Amount</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="0" placeholder="Enter amount"
            value={advancedAmount}
            onChange={e => setAdvancedAmount(e.target.value)} />
          <span>{advancedSelection.replace('Stake ', '')}</span>
        </div>

        <button className="ig-advanced-primary"
          onClick={() => {
            if (advancedAmountNumber <= 0) {
              setAdvancedNotice('Enter a valid staking amount');
              return;
            }
            setAdvancedPositions(p => [...p, {
              id: Date.now(), product: 'Staking',
              asset: advancedSelection.replace('Stake ', ''),
              amount: advancedAmount,
              rate: advancedSelection.includes('ETH') ? '3.20%' : '5.50%',
              status: 'Active'
            }]);
            setAdvancedNotice('Staking position created successfully');
            setAdvancedAmount('');
          }}>
          Confirm Stake
        </button>
      </div>
    )}

    {advancedSelection === 'Borrow Assets' && (
      <div className="ig-advanced-panel">
        <h3 className="ig-panel-heading">Borrow Assets</h3>
        <p className="ig-panel-description">Choose a loan</p>

        {['Flexible Rate Loan', 'Fixed Rate Loan', 'VIP Loan'].map(group => (
          <div className="ig-loan-group" key={group}>
            <h4>{group}</h4>
            {advancedLoanProducts.filter(loan => loan.type === group).map(loan => (
              <div className="ig-advanced-asset-row" key={loan.type + loan.asset}>
                <div className="ig-advanced-asset-name">
                  <img src={loan.logo} alt={loan.asset} />
                  <div><strong>{loan.asset}</strong><small>{loan.type}</small></div>
                </div>
                <div className="ig-advanced-rate">
                  <strong>{loan.rate}</strong><small>Annualized Rate</small>
                </div>
                <button onClick={() => {
                  setAdvancedAmount('');
                  setAdvancedCollateral('');
                  setAdvancedAgreed(false);
                  setAdvancedSelection('Borrow ' + loan.asset + ' ' + loan.type);
                  setAdvancedNotice('');
                }}>Borrow</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    )}

    {advancedSelection.startsWith('Borrow ') && (
      <div className="ig-advanced-panel">
        <h3>{advancedSelection}</h3>
        <p className="ig-panel-description">Review the loan details</p>

        <div className="ig-advanced-stats">
          <div><span>Annualized Interest</span><strong>7.98%</strong></div>
          <div><span>Maximum LTV</span><strong>10%</strong></div>
          <div><span>Minimum Amount</span><strong>1</strong></div>
        </div>

        <label className="ig-advanced-label">I want to borrow</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="1" placeholder="Enter amount"
            value={advancedAmount}
            onChange={e => setAdvancedAmount(e.target.value)} />
          <span>{advancedSelection.split(' ')[1]}</span>
          <button onClick={() => setAdvancedAmount(String(advancedMaxBorrow))}>MAX</button>
        </div>

        <label className="ig-advanced-label">Collateral Asset</label>
        <select className="ig-advanced-select"
          value={advancedCollateralAsset}
          onChange={e => setAdvancedCollateralAsset(e.target.value)}>
          <option value="BNB">BNB</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
          <option value="USDT">USDT</option>
        </select>

        <label className="ig-advanced-label">Collateral Value (USDT equivalent)</label>
        <div className="ig-advanced-input-wrap">
          <input type="number" min="0" placeholder="Enter collateral value"
            value={advancedCollateral}
            onChange={e => setAdvancedCollateral(e.target.value)} />
          <span>USDT</span>
        </div>

        <div className="ig-advanced-info">
          <span>Maximum  Borrow</span><strong>{advancedMaxBorrow.toFixed(2)} USDT</strong>
          <span>Current LTV</span><strong>{advancedLTV.toFixed(2)}%</strong>
        </div>

        {advancedLTV > 70 && (
          <div className="ig-advanced-warning">
            Your borrow amount is above the illustrative 10% LTV limit
          </div>
        )}

        <label className="ig-advanced-agreement">
          <input type="checkbox" checked={advancedAgreed}
            onChange={e => setAdvancedAgreed(e.target.checked)} />
        </label>

       
<button
  className="ig-advanced-primary"
  onClick={submitAdvancedBorrow}
  disabled={advancedBorrowBusy}
>
  {advancedBorrowBusy ? 'Submitting...' : 'Submit Borrow Request'}
</button>

      </div>
    )}

    {advancedNotice && (
      <div className="ig-advanced-notice">{advancedNotice}</div>
    )}

    {(advancedPositions.length > 0 || myAdvancedRequests.length > 0) && (
  <div className="ig-advanced-panel ig-advanced-positions">
    <h3>My Advanced Positions & Borrow History</h3>

    {advancedPositions.map(position => (
      <div className="ig-position-row" key={position.id}>
        <div>
          <strong>{position.product} · {position.asset}</strong>
          <small>
            {position.amount} {position.asset} · {position.rate} · {position.status}
          </small>
        </div>
        <span></span>
      </div>
    ))}

    {myAdvancedRequests.map(request => {
      const status = request.status?.toLowerCase();
      const statusClass =
        status === 'approved' ? 'borrow-approved' :
        status === 'rejected' ? 'borrow-rejected' :
        'borrow-pending';

      return (
        <div className="ig-position-row" key={request.id}>
          <div>
            <strong>
              Borrow · {request.asset === 'GOLD' ? 'XAU/USDT' : request.asset}
            </strong>

            <small>
              Collateral: {request.collateral_amount} USDT equivalent
              {' · '}
              {request.collateral_asset}
            </small>

            <small className={`borrow-history-status ${statusClass}`}>
              {request.status}
            </small>
          </div>

          <strong className={`borrow-history-amount ${statusClass}`}>
            {status === 'approved' ? '+' : status === 'rejected' ? '−' : ''}
            {Number(request.amount).toLocaleString()} {request.asset}
          </strong>
        </div>
      );
    })}
  </div>
)}
  </div>
)}
  </section>
)}

        {isAdmin && authSession && adminOpen && <AdminPanel
          adminOpen={adminOpen} setAdminOpen={setAdminOpen}
          tradeEnabled={tradeEnabled} setTradeEnabled={setTradeEnabled}
          requests={requests} approveRequest={approveRequest}
          advancedRequests={advancedRequests}
reviewAdvancedRequest={reviewAdvancedRequest}
          memberEmail={memberEmail} setMemberEmail={setMemberEmail}
          memberAmount={memberAmount} setMemberAmount={setMemberAmount}
          memberAction={memberAction} setMemberAction={setMemberAction}
          adjustMemberBalance={adjustMemberBalance} members={members}
          walletAddresses={walletAddresses}
setWalletAddresses={setWalletAddresses}
walletQrCodes={walletQrCodes}
saveWalletSettings={saveWalletSettings}
setToast={setToast}
telegramUrl={telegramUrl}
setTelegramUrl={setTelegramUrl}
        />}

        {loginOpen && <div className="modal-backdrop" onClick={() => { if (!isAdminRoute) setLoginOpen(false) }}><div className="modal panel" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => { if (!isAdminRoute) setLoginOpen(false) }} aria-label="Close">×</button><Logo /><h2>{isAdminRoute ? (isAdmin ? 'Admin Panel' : 'Admin sign in') : (authMode === 'register' ? 'Create your IGtrade account' : 'Welcome to IGtrade')}</h2><p className="muted">{isAdminRoute ? 'Only an account approved as admin can continue.' : (authMode === 'register' ? 'Register using your email address or phone number.' : 'Sign in using your email address or phone number.')}</p>{isAdminRoute && isAdmin ? <><p className="fine-print">Admin access verified.</p><button className="btn btn-gold btn-full" onClick={() => { setLoginOpen(false); setAdminOpen(true) }}>Open Admin Panel</button></> : <form onSubmit={handleAuthSubmit}>{!isAdminRoute && <div className="history-tabs" style={{ display: 'flex', width: '100%', gap: 8, marginTop: 16 }}><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')} style={{ flex: 1 }}>Sign in</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => setAuthMode('register')} style={{ flex: 1 }}>Register</button></div>}{authMode === 'register' && !isAdminRoute && <><label className="field-label">{t('Full name')}</label><input className="text-input" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={t('Full name')} autoComplete="name" required /></>}<label className="field-label">{t('Email or phone')}</label><div className="phone-entry-row"><select className="text-input country-code-select" aria-label="Country code" value={countryCode} onChange={e => setCountryCode(e.target.value)}><option value="">{t('Country code')}</option>{countryCallingCodes.map(([iso, country, code]) => <option key={iso} value={code}>{country} ({code})</option>)}</select><input className="text-input phone-number-input" value={authIdentifier} onChange={e => setAuthIdentifier(e.target.value)} placeholder={t('Phone number') + ' / email'} autoComplete="username" required /></div><label className="field-label">{t('Password')}</label><div className="password-input-wrap">
  <input
    className="text-input"
    type={showAuthPassword ? 'text' : 'password'}
    value={authPassword}
    onChange={e => setAuthPassword(e.target.value)}
    placeholder="At least 6 characters"
    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
    required
  />
  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowAuthPassword(!showAuthPassword)}
  >
    {showAuthPassword ? '🙈' : '👁'}
  </button>
</div>{authMode === 'register' && !isAdminRoute && <><label className="field-label">{t('Confirm password')}</label><div className="password-input-wrap">
  <input
    className="text-input"
    type={showAuthConfirm ? 'text' : 'password'}
    value={authConfirm}
    onChange={e => setAuthConfirm(e.target.value)}
    placeholder="Repeat password"
    autoComplete="new-password"
    required
  />
  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowAuthConfirm(!showAuthConfirm)}
  >
    {showAuthConfirm ? '🙈' : '👁'}
  </button>
</div></>}<button className="btn btn-gold btn-full" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : (authMode === 'register' && !isAdminRoute ? 'Create account' : t('Continue'))}</button>{!isAdminRoute && authMode === 'login' && <button type="button" className="text-button" onClick={async () => { if (!supabase) return setToast('Connect Supabase first to reset a password.'); if (!authIdentifier.includes('@')) return setToast('Password reset currently requires the email address.'); const { error } = await supabase.auth.resetPasswordForEmail(authIdentifier.trim()); setToast(error ? error.message : 'Password reset email sent if the account exists.') }}>Forgot password?</button>}{!supabase && <p className="fine-print">Warning: only tick this box if you are using a trusted computer

.</p>}</form>}</div></div>}

        {toast && <div className="toast"><span>✦</span>{toast}<button onClick={() => setToast('')}>×</button></div>}
       

<nav className="mobile-nav">
  {['Home', 'Trade', 'Dashboard', 'Assets', 'Earn'].map((item) => (
    <button
      key={item}
      onClick={() => setPage(item)}
      className={page === item ? 'mobile-active' : ''}
    >
      <span className="mobile-nav-icon">
        {item === 'Home' && (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
          </svg>
        )}

        {item === 'Trade' && (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7h13l-3-3M17 17H4l3 3" />
          </svg>
        )}

        {item === 'Dashboard' && (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="10" width="8" height="11" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </svg>
)}

        {item === 'Assets' && (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="15" rx="2" />
            <path d="M3 9h18M16 14h2" />
          </svg>
        )}

        {item === 'Earn' && (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7M9 10h6" />
          </svg>
        )}
      </span>
      <small>{item}</small>
    </button>
  ))}
</nav>


        <footer className="footer"><div className="footer-brand"><span className="ig-square-logo">IG</span><span>© 1998 IGtrade</span></div><div className="footer-links"><a href="https://www.ig.com/en/terms-and-agreements" target="_blank" rel="noreferrer">Terms and agreements</a><a href="https://www.ig.com/en/privacy" target="_blank" rel="noreferrer">Privacy</a><a href="https://www.ig.com/en/fund-your-account" target="_blank" rel="noreferrer">How to fund</a><a href="https://www.ig.com/en/client-vulnerability" target="_blank" rel="noreferrer">Vulnerability</a><a href="https://www.ig.com/en/cookies" target="_blank" rel="noreferrer">Cookies</a><a href="https://www.ig.com/en/about-us" target="_blank" rel="noreferrer">About IG</a></div><div className="footer-social"><strong>Follow us online</strong><a href="https://www.facebook.com/IGInternational2" target="_blank" rel="noreferrer">Facebook</a><a href="https://twitter.com/IGInternational" target="_blank" rel="noreferrer">X</a><a href="https://www.youtube.com/channel/UCZj-ae-S_X-mocAH3xQnpUw" target="_blank" rel="noreferrer">YouTube</a><a href="https://www.linkedin.com/showcase/35901904/admin/" target="_blank" rel="noreferrer">LinkedIn</a></div><p className="footer-disclaimer">G International Limited is part of the IG Group and its ultimate parent company is IG Group Holdings Plc.</p>
           </footer>
        </main>
      </div>
    </div>
      
}

export default App;