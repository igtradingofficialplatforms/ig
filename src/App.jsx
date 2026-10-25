import React, { useEffect, useMemo, useRef, useState } from 'react'
import AdminPanel from './Admin.jsx'
import CustomerService from './CustomerService.jsx'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, isSupabaseConfigured } from './supabase.js'

const supabase = isSupabaseConfigured ? createClient(supabaseConfig.url, supabaseConfig.anonKey) : null
console.log('Supabase URL loaded:', Boolean(import.meta.env.VITE_SUPABASE_URL))
console.log('Supabase key loaded:', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY))
console.log('Supabase configured:', isSupabaseConfigured)

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


const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quotePrice = (n, symbol) => {
  if (n == null || !Number.isFinite(Number(n))) return 'Waiting for live feed'
  const digits = ['GBPUSD', 'EURUSD', 'USDJPY'].includes(symbol) ? 5 : Number(n) < 1 ? 5 : 2
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function Logo() {
  return <div className="brand"><span className="ig-square-logo">IG</span><span><span className="brand-ig-red">IG</span><span className="brand-gold">trade</span></span></div>
}

function Candles({ compact = false, progress = 0, candles = [], targetPrice = null }) {
  const width = Math.max(1, candles.length) * 12
  const values = [...candles.flatMap(c => [c.high, c.low]), ...(targetPrice == null ? [] : [targetPrice])]
  const max = values.length ? Math.max(...values) : 1
  const min = values.length ? Math.min(...values) : 0
  const span = Math.max(max - min, 0.000001)
  const y = value => 94 - ((value - min) / span) * 82
  if (!candles.length) return <div className={`chart ${compact ? 'chart-compact' : ''} chart-empty`}><div className="empty-state"><strong>Waiting for live candle data</strong><p>No sample candles are shown as real market data.</p></div></div>
  return <div className={`chart ${compact ? 'chart-compact' : ''}`}>
    <div className="chart-grid"><i /><i /><i /><i /></div>
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" role="img" aria-label="Live market candlestick chart">
      {candles.map((c, i) => {
        const x = i * 12 + 3
        const top = y(Math.max(c.open, c.close))
        const bottom = y(Math.min(c.open, c.close))
        return <g key={c.time} className={c.up ? 'candle-up' : 'candle-down'}>
          <line x1={x + 3} x2={x + 3} y1={y(c.high)} y2={y(c.low)} stroke="currentColor" strokeWidth="1.2" />
          <rect x={x} y={top} width="6" height={Math.max(1.5, bottom - top)} rx="1" fill="currentColor" />
        </g>
      })}
      {targetPrice != null && <g><line x1="0" x2={width} y1={y(targetPrice)} y2={y(targetPrice)} stroke="#d8b66d" strokeWidth="1.5" strokeDasharray="5 3" /><text x="4" y={Math.max(8, y(targetPrice) - 3)} fill="#d8b66d" fontSize="5">TARGET</text></g>}
      {progress > 0 && <line x1="0" x2={width} y1={35 + (progress % 18)} y2={35 + (progress % 18)} stroke="#d6b56d" strokeDasharray="4 3" opacity=".8" />}
    </svg>
    <div className="chart-labels"><span>Older</span><span>Live · 1m candles</span><span>Now</span></div>
  </div>
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

function App() {
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem('igtrade-language') || 'en' } catch { return 'en' } })
  const t = (key) => uiTranslations[language]?.[key] || key
  const [countryCode, setCountryCode] = useState('')
  const [page, setPage] = useState('Home')
  const [marketFilter, setMarketFilter] = useState('All')
  const [selected, setSelected] = useState('BTC')
  const [amount, setAmount] = useState('100')
  const [duration, setDuration] = useState(30)
  const [direction, setDirection] = useState('BUY')
  const [trade, setTrade] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [balance, setBalance] = useState(0)
  const [tradeHistory, setTradeHistory] = useState([])
  const [depositMethod, setDepositMethod] = useState('TRC20')
  const [depositAmount, setDepositAmount] = useState('50')
  const [depositFile, setDepositFile] = useState(null)
  const [withdrawMethod, setWithdrawMethod] = useState('TRC20')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [requests, setRequests] = useState([])
  const [adminOpen, setAdminOpen] = useState(false)
  const [tradeSettingLoaded, setTradeSettingLoaded] = useState(false)

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
    setToast('Supabase is not configured. Trading remains OFF.')
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
  const [authConfirm, setAuthConfirm] = useState('')
  const [authName, setAuthName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authSession, setAuthSession] = useState(null)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminProfileLoaded, setAdminProfileLoaded] = useState(false)
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const [profileTab, setProfileTab] = useState('Trades')
  const [expandedTradeId, setExpandedTradeId] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [members, setMembers] = useState([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberAmount, setMemberAmount] = useState('100')
  const [memberAction, setMemberAction] = useState('add')
  const [walletAddresses, setWalletAddresses] = useState({ TRC20: '', BTC: '', ETH: '' })

  useEffect(() => {
    if (!supabase) return;

    const loadWalletAddresses = async () => {
      const { data, error } = await supabase
        .from('deposit_addresses')
        .select('currency, network, wallet_address, instructions, is_active')
        .eq('is_active', true);

      if (error) {
        console.error('Wallet loading error:', error.message);
        return;
      }
      console.log('Wallet rows from Supabase:', data);
      const addresses = {
        TRC20: '',
        BTC: '',
        ETH: '',
      };

      for (const item of data || []) {
        const currency = String(item.currency || '')
          .trim()
          .toUpperCase();

        const network = String(item.network || '')
          .trim()
          .toUpperCase();

        if (currency === 'USDT' && network.includes('TRC20')) {
          addresses.TRC20 = item.wallet_address || '';
        } else if (currency === 'BTC') {
          addresses.BTC = item.wallet_address || '';
        } else if (currency === 'ETH') {
          addresses.ETH = item.wallet_address || '';
        }
      }

      setWalletAddresses(addresses);
      console.log('Loaded wallet addresses:', addresses);
    };

    loadWalletAddresses();
  }, []);

  const [telegramUrl, setTelegramUrl] = useState('https://t.me/igtrading_platforms93')

  const [livePrices, setLivePrices] = useState({})
  const [marketConnection, setMarketConnection] = useState({ crypto: 'connecting', other: import.meta.env.VITE_TWELVEDATA_API_KEY ? 'connecting' : 'API key required' })
  const [liveCandles, setLiveCandles] = useState({})

  // Supabase authentication: admin access is granted only by the server-stored profiles.role.
  useEffect(() => {
    if (!supabase) { setAdminProfileLoaded(true); return }
    const loadRole = async (session) => {
      setAuthSession(session || null)
      if (!session?.user?.id) { setIsAdmin(false); setAdminProfileLoaded(true); return }
      const { data, error } = await supabase.from('profiles').select('role,display_name,email,virtual_balance').eq('id', session.user.id).maybeSingle()
      setProfileName(
        data?.display_name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.display_name ||
        ''
      );

      setProfileEmail(session.user.email || session.user.phone || '');
      setIsAdmin(!error && data?.role === 'admin')
      if (!error && data?.role === 'admin') setAdminOpen(true)
      if (!error && data && Number.isFinite(Number(data.virtual_balance))) setBalance(Number(data.virtual_balance))
      setAdminProfileLoaded(true)
    }
    supabase.auth.getSession().then(({ data }) => loadRole(data.session))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session || null)
      // Defer profile read so it runs after the auth callback has completed.
      if (session?.user?.id) setTimeout(() => loadRole(session), 0)
      else { setIsAdmin(false); setAdminOpen(false); setAdminProfileLoaded(true) }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

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
        const { data: profile } = await supabase.from('profiles').select('role,virtual_balance').eq('id', result.data.session.user.id).maybeSingle()
        setIsAdmin(profile?.role === 'admin')
        if (profile?.role === 'admin' && isAdminRoute) setAdminOpen(true)
        if (profile && Number.isFinite(Number(profile.virtual_balance))) setBalance(Number(profile.virtual_balance))
      }
    } catch (error) {
      setToast(error?.message || 'Authentication failed. Check Supabase Auth settings.')
    } finally { setAuthBusy(false) }
  }
  const markets = marketDefinitions.map(m => ({ ...m, ...(livePrices[m.symbol] || {}), price: livePrices[m.symbol]?.price ?? null, change: livePrices[m.symbol]?.change ?? null }))
  const asset = markets.find(m => m.symbol === selected) || markets[0]

  useEffect(() => {
    let retryTimer
    let closed = false
    const streams = ['btcusdt', 'ethusdt', 'solusdt'].flatMap(s => [`${s}@ticker`, `${s}@kline_1m`]).join('/')
    let cryptoSocket
    const connectCrypto = () => {
      if (closed) return
      cryptoSocket = new WebSocket(`wss://stream.binance.com:443/stream?streams=${streams}`)
      cryptoSocket.onopen = () => setMarketConnection(v => ({ ...v, crypto: 'live' }))
      cryptoSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const d = message.data
          if (d.e === '24hrTicker') {
            const symbol = d.s.replace('USDT', '')
            setLivePrices(prev => ({ ...prev, [symbol]: { price: Number(d.c), change: Number(d.P), updatedAt: Date.now(), source: 'Binance live' } }))
          } else if (d.e === 'kline') {
            const symbol = d.s.replace('USDT', '')
            const k = d.k
            setLiveCandles(prev => {
              const next = [...(prev[symbol] || [])]
              const candle = { time: k.t, open: Number(k.o), high: Number(k.h), low: Number(k.l), close: Number(k.c), up: Number(k.c) >= Number(k.o) }
              const last = next[next.length - 1]
              if (last?.time === candle.time) next[next.length - 1] = candle; else next.push(candle)
              return { ...prev, [symbol]: next.slice(-60) }
            })
          }
        } catch { /* ignore malformed feed messages */ }
      }
      cryptoSocket.onerror = () => setMarketConnection(v => ({ ...v, crypto: 'disconnected' }))
      cryptoSocket.onclose = () => { setMarketConnection(v => ({ ...v, crypto: 'reconnecting' })); if (!closed) retryTimer = setTimeout(connectCrypto, 2500) }
    }
    connectCrypto()

    const apiKey = import.meta.env.VITE_TWELVEDATA_API_KEY
    let otherSocket
    if (apiKey) {
      otherSocket = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(apiKey)}`)
      otherSocket.onopen = () => {
        setMarketConnection(v => ({ ...v, other: 'live connection' }))
        otherSocket.send(JSON.stringify({ action: 'subscribe', params: { symbols: 'AAPL,NVDA,TSLA,XAU/USD,GBP/USD,EUR/USD,USD/JPY,SPX,NDX,DAX,DJI' } }))
      }
      otherSocket.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data)
          if (d.status === 'error' || d.event === 'error' || (d.event === 'subscribe-status' && d.status === 'error')) {
            const providerMessage = String(d.message || d.code || 'Twelve Data rejected the subscription')
            setMarketConnection(v => ({ ...v, other: `provider error: ${providerMessage}` }))
            return
          }
          const raw = String(d.symbol || d.event || '').toUpperCase().replaceAll('/', '').replaceAll(' ', '')
          const symbol = raw.includes('XAU') ? 'XAU' : raw.includes('AAPL') ? 'AAPL' : raw.includes('NVDA') ? 'NVDA' : raw.includes('TSLA') ? 'TSLA' : raw.includes('GBPUSD') ? 'GBPUSD' : raw.includes('EURUSD') ? 'EURUSD' : raw.includes('USDJPY') ? 'USDJPY' : raw.includes('SPX') ? 'SPX' : raw.includes('NDX') ? 'NDX' : raw.includes('DAX') ? 'DAX' : raw.includes('DJI') ? 'DJI' : null
          const price = Number(d.price)
          if (symbol && Number.isFinite(price) && price > 0) {
            const now = Date.now()
            setLivePrices(prev => {
              const old = prev[symbol] || {}
              const base = old.sessionStartPrice || price
              const change = base ? ((price - base) / base) * 100 : null
              return { ...prev, [symbol]: { ...old, price, change, sessionStartPrice: base, updatedAt: now, source: 'Twelve Data live' } }
            })
            // Build a candle from actual incoming provider ticks (not fabricated sample data).
            setLiveCandles(prev => {
              const next = [...(prev[symbol] || [])]
              const bucket = Math.floor(now / 60000) * 60000
              const last = next[next.length - 1]
              if (last?.time === bucket) {
                last.close = price; last.high = Math.max(last.high, price); last.low = Math.min(last.low, price); last.up = last.close >= last.open
              } else next.push({ time: bucket, open: price, high: price, low: price, close: price, up: true })
              return { ...prev, [symbol]: next.slice(-60) }
            })
            setMarketConnection(v => ({ ...v, other: 'live' }))
          }
        } catch { /* ignore provider status messages */ }
      }
      otherSocket.onerror = () => setMarketConnection(v => ({ ...v, other: 'disconnected' }))
      otherSocket.onclose = () => setMarketConnection(v => ({ ...v, other: 'disconnected' }))
    }
    return () => { closed = true; clearTimeout(retryTimer); cryptoSocket?.close(); otherSocket?.close() }
  }, [])

  // Load actual historical 1-minute candles for the selected non-crypto market.
  // WebSocket ticks update candles afterward; no sample candles/prices are generated.
  useEffect(() => {
    const apiKey = import.meta.env.VITE_TWELVEDATA_API_KEY
    const market = marketDefinitions.find(m => m.symbol === selected)
    if (!market || market.kind === 'Crypto' || !apiKey) return
    const providerSymbols = { XAU: 'XAU/USD', AAPL: 'AAPL', NVDA: 'NVDA', TSLA: 'TSLA', GBPUSD: 'GBP/USD', EURUSD: 'EUR/USD', USDJPY: 'USD/JPY', SPX: 'SPX', NDX: 'NDX', DAX: 'DAX', DJI: 'DJI' }
    const providerSymbol = providerSymbols[market.symbol]
    if (!providerSymbol) return
    const controller = new AbortController()
    setMarketConnection(v => ({ ...v, other: 'loading candles' }))
    const url = new URL('https://api.twelvedata.com/time_series')
    url.searchParams.set('symbol', providerSymbol)
    url.searchParams.set('interval', '1min')
    url.searchParams.set('outputsize', '60')
    url.searchParams.set('order', 'ASC')
    url.searchParams.set('apikey', apiKey)
    fetch(url.toString(), { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(`Candle API HTTP ${response.status}`); return response.json() })
      .then(data => {
        if (data.status === 'error' || !Array.isArray(data.values)) throw new Error(data.message || 'No candle data returned for this symbol')
        const candles = data.values.map(v => ({
          time: Date.parse(v.datetime.replace(' ', 'T') + (v.datetime.includes('Z') ? '' : 'Z')),
          open: Number(v.open), high: Number(v.high), low: Number(v.low), close: Number(v.close), up: Number(v.close) >= Number(v.open)
        })).filter(c => Number.isFinite(c.time) && [c.open, c.high, c.low, c.close].every(Number.isFinite))
        if (candles.length) {
          setLiveCandles(prev => ({ ...prev, [market.symbol]: candles.slice(-60) }))
          const last = candles[candles.length - 1]
          setLivePrices(prev => { const old = prev[market.symbol] || {}; return { ...prev, [market.symbol]: { ...old, price: old.price ?? last.close, updatedAt: old.updatedAt ?? Date.now(), source: old.source || 'Twelve Data candle history' } } })
          setMarketConnection(v => ({ ...v, other: 'history loaded; waiting for live tick' }))
        }
      })
      .catch(error => { if (error.name !== 'AbortError') { console.warn('Twelve Data candle history unavailable:', error.message); setMarketConnection(v => ({ ...v, other: 'candle API unavailable' })) } })
    return () => controller.abort()
  }, [selected])

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

  const filterMarkets = markets.filter(m => marketFilter === 'All' || m.kind === marketFilter)

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

  const finishTrade = () => {
    if (!trade || trade.done || !trade.awaitingDone) return;

    const tradeId = trade.id;

    // Prevent duplicate completion in this open app session.
    if (settledTradeIds.current.has(tradeId)) return;
    settledTradeIds.current.add(tradeId);

    const closingPrice =
      livePrices[trade.symbol]?.price ??
      trade.endPrice ??
      trade.openPrice;

    const stake = Number(trade.amount);
    const rate = Number(trade.virtualRate);
    const profit = Number((stake * rate).toFixed(2));

    if (
      !Number.isFinite(stake) ||
      stake <= 0 ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isFinite(profit)
    ) {
      settledTradeIds.current.delete(tradeId);
      setToast('Invalid trade amount or profit rate.');
      return;
    }

    const result = {
      ...trade,
      done: true,
      awaitingDone: false,
      endPrice: closingPrice,
      closeTime: new Date().toLocaleString(),
      profit,
      resultAt: new Date().toLocaleTimeString(),
      endCandles: [
        ...(liveCandles[trade.symbol] || trade.endCandles || [])
      ]
    };

    // Return the original stake and add simulated profit.
    setBalance(current =>
      Number((current + stake + profit).toFixed(2))
    );

    setTrade(result);
    setTradeHistory(history => [result, ...history]);

    setToast(
      `Trade completed.Sprofit: ${money(profit)}.`
    );
  };

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const startTrade = () => {
    const n = Number(amount)
    const limits = duration === 30 ? [20, 10000] : duration === 60 ? [12000, 30000] : [35000, 99000]
    if (n < limits[0] || n > limits[1]) return setToast(`For ${duration}s trades, amount must be ${money(limits[0])}–${money(limits[1])}.`)
    if (!tradeEnabled) { const lossRate = duration === 30 ? 0.20 : duration === 60 ? 0.40 : 0.80; return setToast(`Market voilatile-${Math.round(lossRate * 100)}% (-${money(n * lossRate)}). Becarefull`) }
    if (n > balance) return setToast('Not enough available balance')
    if (trade && !trade.done) return setToast('Finish the current trade first.')
    if (asset.price == null) return setToast('Live price is not connected for this asset. Trade cannot start.');
    const rate = duration === 30 ? 0.20 : duration === 60 ? 0.40 : 0.80
    const targetPrice = Number((asset.price * (direction === 'BUY' ? 1 + rate / 100 : 1 - rate / 100)).toFixed(asset.price < 10 ? 5 : 2))
    setBalance(v => Number((v - n).toFixed(2)))
    setTrade({ id: Date.now(), symbol: asset.symbol, assetName: asset.name, price: asset.price, openPrice: asset.price, targetPrice, endPrice: null, amount: n, duration, direction, virtualRate: rate, startedAt: new Date().toLocaleString(), openTime: new Date().toLocaleString(), done: false, awaitingDone: false, startCandles: [...(liveCandles[asset.symbol] || [])] })
    setRemaining(duration)
    setToast('Trade started')
  }


  const submitDeposit = async (e) => {
    e.preventDefault();

    const n = Number(depositAmount);
    const userId = authSession?.user?.id;

    if (!supabase || !userId) {
      return setToast('Please log in first.');
    }

    if (!Number.isFinite(n) || n < 50) {
      return setToast('Minimum deposit request is $50.');
    }

    if (!depositFile?.file) {
      return setToast('Please attach your deposit screenshot.');
    }

    try {
      setToast('Uploading screenshot...');

      const proofPath = await uploadDepositProof(
        depositFile.file,
        userId
      );

      const { data, error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: userId,
          amount: n,
          method: depositMethod,
          network: depositMethod,
          proof_url: proofPath,
          proof_path: proofPath,
          status: 'Pending'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('SUPABASE INSERT SUCCESS:', data);
      setRequests(r => [
  {
    id: data.id,
    type: 'Deposit',
    method: data.method,
    amount: Number(data.amount),
    status: data.status,
    created: data.created_at,
    proof_path: data.proof_path || data.proof_url
  },
  ...r
]);
      setToast('Please wait a few moments while we process your request.');
      setDepositFile(null);
    } catch (error) {
      console.error('Deposit submission failed:', error);
      setToast(`Deposit failed: ${error.message}`);
    }
  };


  const submitWithdraw = async (e) => {
    e.preventDefault();
    console.log('WITHDRAW BUTTON FUNCTION RUNNING');
    const n = Number(withdrawAmount);
    const address = withdrawAddress.trim();

    if (!address || !n || n <= 0) {
      return setToast('Enter a destination address and valid amount.');
    }

    if (n > balance) {
      return setToast('Insufficient available balance.');
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

    console.log('SUPABASE WITHDRAW INSERT SUCCESS:', data);
  };

  const approveRequest = (id, status, adminNote = '') => {
    const request = requests.find(r => r.id === id)
    if (!request || request.status !== 'Pending') return
    if (status === 'Rejected' && !String(adminNote).trim()) return setToast('Write a rejection reason before rejecting this request.')
    // Review status only: request approval/rejection must never alter balance automatically.
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status, adminNote: String(adminNote || '').trim(), reviewedAt: new Date().toLocaleString() } : r))
    setToast(`${request.type} request ${status.toLowerCase()}. Balance was not changed; adjust it manually in Admin if needed.`)
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast('Copied.') }
    catch { setToast('Copy not available in this browser.') }
  }

  if (isAdminRoute && (!authSession || !isAdmin)) {
    return <div className="app-shell admin-login-shell"><main className="main-content" style={{ maxWidth: 560, margin: '10vh auto', padding: 24 }}><div className="panel form-panel"><Logo /><h1>Restricted access</h1><p className="muted">This address is not linked from the public website. Sign in with an account whose Supabase profile role is admin.</p>{!isSupabaseConfigured && <div className="notice"><strong>Supabase setup required</strong><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and run the SQL schema. Then promote your owner account to role admin in Supabase SQL Editor.</p></div>}</div></main>{loginOpen && <div className="modal-backdrop"><div className="modal panel"><Logo /><h2>Admin sign in</h2><p className="muted">Use the dedicated owner email/phone and password.</p><form onSubmit={handleAuthSubmit}><label className="field-label">Email or phone</label><input className="text-input" value={authIdentifier} onChange={e => setAuthIdentifier(e.target.value)} required /><label className="field-label">{t('Password')}</label><input className="text-input" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required /><button className="btn btn-gold btn-full" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : 'Admin sign in'}</button></form></div></div>}{toast && <div className="toast">{toast}<button onClick={() => setToast('')}>×</button></div>}</div>
  }

  if (isAdminRoute && authSession && isAdmin) {
    return <div className="app-shell admin-only-shell"><main className="main-content" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}><div className="page-title"><div className="eyebrow">RESTRICTED AREA</div><h1>Admin controls</h1><p className="muted">Signed in as an authorized admin.</p><button className="btn btn-outline" onClick={async () => { await supabase?.auth.signOut(); setAuthSession(null); setIsAdmin(false); setAdminOpen(false); window.location.href = '/' }}>Sign out</button></div><AdminPanel adminOpen={true} setAdminOpen={() => { window.location.href = '/' }} tradeEnabled={tradeEnabled} setTradeEnabled={setTradeEnabled} requests={requests} approveRequest={approveRequest} memberEmail={memberEmail} setMemberEmail={setMemberEmail} memberAmount={memberAmount} setMemberAmount={setMemberAmount} memberAction={memberAction} setMemberAction={setMemberAction} adjustMemberBalance={adjustMemberBalance} members={members} walletAddresses={walletAddresses} setWalletAddresses={setWalletAddresses} setToast={setToast} telegramUrl={telegramUrl} setTelegramUrl={setTelegramUrl} />{toast && <div className="toast">{toast}<button onClick={() => setToast('')}>×</button></div>}</main></div>
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
        {['Home', 'Trade', 'Deposit', 'Withdraw', 'Profile'].map((item, i) => <button key={item} onClick={() => setPage(item)} className={`nav-item ${page === item ? 'active' : ''}`}><span className="nav-icon">{['⌂', '↗', '↓', '↑', '◉'][i]}</span>{t(item)}</button>)}
        <div className="side-spacer" />
      </aside>

      <main className="main-content">
        {page === 'Home' && <section className="page-section">
          <div className="welcome-row"><div><div className="eyebrow">LIVE MARKET OVERVIEW</div><h1>Trade smarter with confidence.</h1><p className="hero-subtitle">Trade CFDs with the world’s No.1 provider1</p><p className="muted">Go long or short on 17,000+ markets and earn up to $2,500 in cashback.2</p></div><div className="balance-card"><div className="balance-title"><span className="wallet-icon">＄</span><span>USDT balance</span></div><div className="balance-number">{money(balance)} <span>USDT</span></div><div className="balance-footer"><span className="positive">● Available funds</span><button className="text-button" onClick={() => setPage('Profile')}>View wallet ↗</button></div></div></div>
          <div className="ticker-wrap"><div className="ticker-track">{[...markets, ...markets].map((m, i) => <div className="ticker-item" key={`${m.symbol}-${i}`}><strong>{m.name}</strong><span>{quotePrice(m.price, m.symbol)}</span><small className={m.change == null ? '' : m.change >= 0 ? 'positive' : 'negative'}>{m.change == null ? '—' : `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`}</small></div>)}</div></div>
          <div className="section-heading"><div><h2>Access 17,000+ markets all in one</h2><p className="muted">Market crypto {marketConnection.crypto}; stocks, forex, indices and gold {marketConnection.other}.Explore diversified tools to advance your trading strategy and get direct order execution from charts.</p><p className="muted">Crypto {marketConnection.crypto}. Stocks/Gold {marketConnection.other}.IG International Limited is part of the IG Group and its ultimate parent company is IG Group Holdings Plc. IG International Limited receives services from other members of the IG Group including IG Markets Limited.</p></div><div className="filter-tabs">{['All', 'Crypto', 'Commodity', 'Stock', 'Forex', 'Index'].map(f => <button key={f} onClick={() => setMarketFilter(f)} className={marketFilter === f ? 'selected' : ''}>{f === 'Commodity' ? 'Gold' : f === 'Stock' ? 'Stocks' : f}</button>)}</div></div>
          <div className="market-grid">{filterMarkets.map(m => <button key={m.symbol} className={`market-card ${selected === m.symbol ? 'market-selected' : ''}`} onClick={() => { setSelected(m.symbol); setPage('Trade') }}><div className="coin-row"><span className={`coin coin-${m.symbol}`}>{m.symbol.slice(0, 1)}</span><span><strong>{m.pair}</strong><small>{m.name}</small></span><span className={`change ${m.change >= 0 ? 'positive' : 'negative'}`}>{m.change == null ? '—' : `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`}</span></div><div className="market-price">{quotePrice(m.price, m.symbol)}</div><div className="mini-spark"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><polyline points={m.change >= 0 ? "0,25 12,20 24,23 38,9 52,15 65,7 78,13 91,4 105,8 120,2" : "0,4 12,8 24,3 38,13 52,9 65,20 78,14 91,23 105,18 120,27"} fill="none" stroke={m.change >= 0 ? '#45d3a1' : '#ff6b73'} strokeWidth="2" /></svg></div></button>)}</div>
          <div className="lower-grid"><div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">MARKET CHART</span><h2>{asset.name} <span className="muted">({asset.pair})</span></h2></div><div className="price-stack"><strong>{asset.price == null ? 'Live price unavailable' : quotePrice(asset.price, asset.symbol)}</strong><span className={asset.change >= 0 ? 'positive' : 'negative'}>{asset.change == null ? 'Change since connection unavailable' : `${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}% since connection`}</span></div></div><Candles compact candles={liveCandles[asset.symbol] || []} /></div><div className="panel quick-panel"><span className="eyebrow">QUICK ACTION</span><h2>Ready to trade?</h2><p className="muted">Start a trade with account funds.</p><button className="btn btn-gold btn-full" onClick={() => setPage('Trade')}>Open trading terminal <span>↗</span></button><button className="btn btn-outline btn-full" onClick={() => setPage('Deposit')}>Deposit request <span>＋</span></button><div className="secure-note"><span>✦</span> Account balance.</div></div></div>
          <CustomerService telegramUrl={telegramUrl} />
        </section>}

        {page === 'Trade' && <section className="page-section"><div className="page-title-row"><div><div className="eyebrow">Markets To Trades</div><h1><span className="gold-text">Trade</span></h1><p className="muted">Live market</p></div><span className={`status-pill ${tradeEnabled ? 'status-on' : 'status-off'}`}>{tradeEnabled ? '● Trading' : '● Trading'}</span></div>
          <div className="trade-layout"><div className="panel trade-chart-panel"><div className="panel-head"><div className="asset-select"><span className="coin coin-BTC">{asset.symbol.slice(0, 1)}</span><div><strong>{asset.pair}</strong><small>{asset.name}</small></div><select value={selected} onChange={e => setSelected(e.target.value)}>{markets.map(m => <option key={m.symbol} value={m.symbol}>{m.pair} — {m.name}</option>)}</select></div><div className="price-stack"><strong>{asset.price == null ? 'Live price unavailable' : quotePrice(asset.price, asset.symbol)}</strong><span className={asset.change >= 0 ? 'positive' : 'negative'}>{asset.change == null ? '—' : `${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}%`}</span></div></div><Candles progress={duration - remaining} candles={liveCandles[asset.symbol] || []} targetPrice={trade && !trade.done ? trade.targetPrice : null} /><div className="chart-legend"><span><i className="legend-green" /> Up candle</span><span><i className="legend-red" /> Down candle</span><span className="muted">Live feed · 1-minute candles</span></div>
            {trade && <div className={`trade-result ${trade.done ? 'result-done' : ''}`}><div className="result-top"><span className="eyebrow">{trade.done ? 'TRADE COMPLETED' : trade.awaitingDone ? 'REVIEW TRADE RESULT' : 'TRADE IN PROGRESS'}</span>{trade.done ? <span className="status-pill status-on">Saved ✓</span> : trade.awaitingDone ? <span className="status-pill status-on">Timer ended</span> : <span className="countdown">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>}</div><div className="result-grid"><div><small>Asset</small><strong>{trade.assetName || trade.symbol}</strong></div><div><small>Direction</small><strong>{trade.direction}</strong></div><div><small>Trade amount</small><strong>{money(trade.amount)}</strong></div><div><small>Opening price</small><strong>{quotePrice(trade.openPrice ?? trade.price, trade.symbol)}</strong></div><div><small>Target price</small><strong>{quotePrice(trade.targetPrice, trade.symbol)}</strong></div><div><small>Closing price</small><strong>{trade.endPrice == null ? 'Waiting for close' : quotePrice(trade.endPrice, trade.symbol)}</strong></div><div><small>profit</small><strong className="positive">{trade.done ? '+' : 'Expected +'}{money(trade.profit ?? trade.amount * trade.virtualRate)}</strong></div><div><small>rate</small><strong className="gold-text">{Math.round(trade.virtualRate * 100)}%</strong></div></div><div className="trade-timestamps"><span>Opened: {trade.openTime || trade.startedAt}</span><span>{trade.closeTime ? `Closed: ${trade.closeTime}` : trade.awaitingDone ? 'Timer complete — press Done to record this trade.' : 'Waiting for timer to finish.'}</span></div><Candles compact candles={trade.done || trade.awaitingDone ? (trade.endCandles || liveCandles[trade.symbol] || []) : (liveCandles[trade.symbol] || trade.startCandles || [])} targetPrice={trade.targetPrice} />{trade.awaitingDone && <button className="btn btn-gold btn-full" onClick={finishTrade}>Done — save trade to history</button>}{trade.done && <><p className="result-message">Saved to Profile → Trades with opening price, target price, closing price and chart snapshot.</p><button className="btn btn-gold" onClick={() => { setTrade(null); setRemaining(0) }}>Start another trade</button></>}</div>}
          </div><div className="panel trade-controls"><div className="control-head"><h2>Place trade</h2><span className="tiny-tag">IG</span></div><div className="label-row"><label>Direction</label></div><div className="direction-row"><button className={`direction buy ${direction === 'BUY' ? 'direction-active' : ''}`} onClick={() => setDirection('BUY')}>↗ BUY</button><button className={`direction sell ${direction === 'SELL' ? 'direction-active' : ''}`} onClick={() => setDirection('SELL')}>↘ SELL</button></div><label className="field-label">Trade duration</label><div className="duration-options">{[30, 60, 120].map(d => <button key={d} className={duration === d ? 'duration-active' : ''} onClick={() => { setDuration(d); setAmount(d === 30 ? '100' : d === 60 ? '12000' : '35000') }}><strong>{d}s</strong><small>{d === 30 ? '20% rate' : d === 60 ? '40% rate' : '80% rate'}</small></button>)}</div><label className="field-label" htmlFor="amount">Amount (USDT)</label><div className="amount-input"><span>$</span><input id="amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="amount-hint">{duration === 30 ? 'Amount range: $20 – $10,000' : duration === 60 ? '$12,000 – $30,000' : '$35,000 – $99,000'} · Account balance: {money(balance)}</div><div className="estimate-box"><div><span>Illustrative result if completed</span><strong className="positive">+{money(Number(amount || 0) * (duration === 30 ? .2 : duration === 60 ? .4 : .8))}</strong></div><small>Profit/loss.</small></div><button className="btn btn-gold btn-full btn-large" disabled={!!(trade && !trade.done)} onClick={startTrade}>{!tradeEnabled ? 'Trading' : trade && !trade.done ? `Trade running · ${remaining}s` : 'Start trade'} <span>↗</span></button><p className="fine-print">IG trading platforms</p></div></div>
        </section>}

        {page === 'Deposit' && <section className="page-section narrow-page"><div className="eyebrow">WALLET SERVICES</div><h1>Deposit <span className="gold-text">request</span></h1><p className="muted">Submit a request for review</p><div className="panel form-panel"><form onSubmit={submitDeposit}><label className="field-label">Select network</label><div className="network-options">{['TRC20', 'BTC', 'ETH'].map(n => <button type="button" key={n} className={depositMethod === n ? 'network-active' : ''} onClick={() => setDepositMethod(n)}><span className="network-symbol">{n === 'TRC20' ? '₮' : n === 'BTC' ? '₿' : '◆'}</span><strong>{n}</strong><small>{n === 'TRC20' ? 'USDT · Tron' : n === 'BTC' ? 'Bitcoin' : 'Ethereum'}</small></button>)}</div><label className="field-label">Deposit address</label>

          <div className="copy-field">
            <span>
              {walletAddresses[depositMethod] ||
                `Admin has not configured the ${depositMethod} address yet`}
            </span>
            <button
              type="button"
              disabled={!walletAddresses[depositMethod]}
              onClick={() => copy(walletAddresses[depositMethod])}
            >
              Copy
            </button>
          </div>

          <label className="field-label" htmlFor="deposit-amount">
            Amount (USDT) · Minimum $50
          </label>
          <div className="amount-input">
            <span>$</span>
            <input
              id="deposit-amount"
              type="number"
              min="50"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              required
            />
          </div>

          <label className="field-label" htmlFor="receipt">
            Payment screenshot
          </label>
          <label className="upload-box" htmlFor="receipt">
            <span className="upload-icon">↑</span>
            <strong>
              {depositFile ? depositFile.name : 'Choose screenshot from your device'}
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
              required
            />
          </label>

          <button className="btn btn-gold btn-full btn-large" type="submit">
            Submit deposit request ↗
          </button>
        </form>
        </div>

          <div className="notice">
            <strong>Important</strong>
            <p>
              Please review all information carefully before submitting
            </p>
          </div>
        </section>}


        {page === 'Withdraw' && (
          <section className="page-section narrow-page">
            <div className="eyebrow">WALLET SERVICES</div>
            <h1>Withdraw <span className="gold-text">request</span></h1>
            <p className="muted">Please ensure that your address is entered correctly before submitting.</p>

            <div className="panel form-panel">
              <form
                onSubmit={(e) => {
                  console.log('WITHDRAW FORM SUBMITTED');
                  submitWithdraw(e);
                }}
              >
                <div className="available-balance">
                  <span>Available balance</span>
                  <strong>{money(balance)} <small>USDT</small></strong>
                </div>

                <label className="field-label">Select network</label>
                <div className="network-options">
                  {['TRC20', 'BTC', 'ETH'].map(n => (
                    <button
                      type="button"
                      key={n}
                      className={withdrawMethod === n ? 'network-active' : ''}
                      onClick={() => setWithdrawMethod(n)}
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
                  placeholder="Paste wallet address"
                  required
                />

                <label className="field-label" htmlFor="withdraw-amount">
                  Amount (USDT)
                </label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    id="withdraw-amount"
                    type="number"
                    min="1"
                    max={balance}
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

            <div className="notice">
              <strong>IG</strong>
              <p>
                Please ensure that your address is entered
              </p>
            </div>
          </section>
        )}

        {page === 'Profile' && <section className="page-section"><div className="eyebrow">ACCOUNT CENTRE</div><h1>Your <span className="gold-text">profile</span></h1><div className="profile-hero panel"><div className="profile-avatar">IG</div><div className="profile-info"><h2>
          {profileName ||

            authSession?.user?.user_metadata?.full_name ||
            authSession?.user?.email?.split('@')[0] ||
            authSession?.user?.phone ||
            'IGtrade Official Platforms Account'}
        </h2>

          {authSession?.user ? (
            <button
              className="btn btn-outline"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  setToast(error.message);
                  return;
                }
                setAuthSession(null);
                setProfileName('');
                setProfileEmail('');
                setIsAdmin(false);
                setToast('Signed out successfully.');
              }}
            >
              Sign out
            </button>
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
          <span className="status-pill status-on">crypto & Stock funds</span>
        </div>
        </div>

          <div className="stat-grid">
            <div className="panel stat-card">
              <small>Account balance</small>
              <strong>{money(balance)}</strong>
              <span className="muted">USDT funds</span>
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
              {['Trades', 'Deposits', 'Withdrawals'].map(t => (
                <button
                  key={t}
                  className={profileTab === t ? 'selected' : ''}
                  onClick={() => setProfileTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {profileTab === 'Trades' ? (
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
                        <strong className="positive">+{money(t.profit)}</strong>
                        <small>
                          {expandedTradeId === (t.id || i) ? 'Hide details ↑' : 'View details ↓'}
                        </small>
                      </div>
                    </button>

                    {expandedTradeId === (t.id || i) && (
                      <div className="history-detail">
                        <div><small>Opening price</small><strong>{quotePrice(t.openPrice ?? t.price, t.symbol)}</strong></div>
                        <div><small>Target price</small><strong>{quotePrice(t.targetPrice, t.symbol)}</strong></div>
                        <div><small>Closing price</small><strong>{quotePrice(t.endPrice, t.symbol)}</strong></div>
                        <div><small>Trade amount</small><strong>{money(t.amount)}</strong></div>
                        <div><small>Profit</small><strong className="positive">+{money(t.profit)}</strong></div>
                        <div><small>Rate</small><strong>{Math.round(t.virtualRate * 100)}%</strong></div>
                        <div className="history-chart-full">
                          <Candles compact candles={t.endCandles || t.startCandles || []} />
                        </div>
                        <p>Opened: {t.openTime || t.startedAt} · Closed: {t.closeTime || t.resultAt}</p>
                        <small>Trade data.</small>
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
                r.type === (profileTab === 'Deposits' ? 'Deposit' : 'Withdraw')
              ).length ? (
                requests.filter(r =>
                  r.type === (profileTab === 'Deposits' ? 'Deposit' : 'Withdraw')
                ).map(r => (
                  <div className="history-row" key={r.id}>
                    <span className="history-icon">{r.type === 'Deposit' ? '↓' : '↑'}</span>
                    <div className="history-main">
                      <strong>{r.type} · {r.method}</strong>
                      <small>{r.created}</small>
                    </div>
                    <div className="history-amount">
                      <strong>{money(r.amount)}</strong>
                      <small>{r.status}</small>
                    </div>
                    {r.adminNote && (
                      <div className="history-detail">
                        <small>Admin message / rejection reason</small>
                        <p>{r.adminNote}</p>
                      </div>
                    )}
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
        </section>}

        {isAdmin && authSession && adminOpen && <AdminPanel
          adminOpen={adminOpen} setAdminOpen={setAdminOpen}
          tradeEnabled={tradeEnabled} setTradeEnabled={setTradeEnabled}
          requests={requests} approveRequest={approveRequest}
          memberEmail={memberEmail} setMemberEmail={setMemberEmail}
          memberAmount={memberAmount} setMemberAmount={setMemberAmount}
          memberAction={memberAction} setMemberAction={setMemberAction}
          adjustMemberBalance={adjustMemberBalance} members={members}
          walletAddresses={walletAddresses} setWalletAddresses={setWalletAddresses}
          setToast={setToast} telegramUrl={telegramUrl} setTelegramUrl={setTelegramUrl}
        />}

        {loginOpen && <div className="modal-backdrop" onClick={() => { if (!isAdminRoute) setLoginOpen(false) }}><div className="modal panel" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => { if (!isAdminRoute) setLoginOpen(false) }} aria-label="Close">×</button><Logo /><h2>{isAdminRoute ? (isAdmin ? 'Admin Panel' : 'Admin sign in') : (authMode === 'register' ? 'Create your IGtrade account' : 'Welcome to IGtrade')}</h2><p className="muted">{isAdminRoute ? 'Only an account approved as admin can continue.' : (authMode === 'register' ? 'Register using your email address or phone number.' : 'Sign in using your email address or phone number.')}</p>{isAdminRoute && isAdmin ? <><p className="fine-print">Admin access verified.</p><button className="btn btn-gold btn-full" onClick={() => { setLoginOpen(false); setAdminOpen(true) }}>Open Admin Panel</button></> : <form onSubmit={handleAuthSubmit}>{!isAdminRoute && <div className="history-tabs" style={{ display: 'flex', width: '100%', gap: 8, marginTop: 16 }}><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')} style={{ flex: 1 }}>Sign in</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => setAuthMode('register')} style={{ flex: 1 }}>Register</button></div>}{authMode === 'register' && !isAdminRoute && <><label className="field-label">{t('Full name')}</label><input className="text-input" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={t('Full name')} autoComplete="name" required /></>}<label className="field-label">{t('Email or phone')}</label><div className="phone-entry-row"><select className="text-input country-code-select" aria-label="Country code" value={countryCode} onChange={e => setCountryCode(e.target.value)}><option value="">{t('Country code')}</option>{countryCallingCodes.map(([iso, country, code]) => <option key={iso} value={code}>{country} ({code})</option>)}</select><input className="text-input phone-number-input" value={authIdentifier} onChange={e => setAuthIdentifier(e.target.value)} placeholder={t('Phone number') + ' / email'} autoComplete="username" required /></div><label className="field-label">{t('Password')}</label><input className="text-input" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required />{authMode === 'register' && !isAdminRoute && <><label className="field-label">{t('Confirm password')}</label><input className="text-input" type="password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" required /></>}<button className="btn btn-gold btn-full" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : (authMode === 'register' && !isAdminRoute ? 'Create account' : t('Continue'))}</button>{!isAdminRoute && authMode === 'login' && <button type="button" className="text-button" onClick={async () => { if (!supabase) return setToast('Connect Supabase first to reset a password.'); if (!authIdentifier.includes('@')) return setToast('Password reset currently requires the email address.'); const { error } = await supabase.auth.resetPasswordForEmail(authIdentifier.trim()); setToast(error ? error.message : 'Password reset email sent if the account exists.') }}>Forgot password?</button>}{!supabase && <p className="fine-print">Warning: only tick this box if you are using a trusted computer

.</p>}</form>}</div></div>}

        {toast && <div className="toast"><span>✦</span>{toast}<button onClick={() => setToast('')}>×</button></div>}
        <nav className="mobile-nav">{['Home', 'Trade', 'Deposit', 'Withdraw', 'Profile'].map((item, i) => <button key={item} onClick={() => setPage(item)} className={page === item ? 'mobile-active' : ''}><span>{['⌂', '↗', '↓', '↑', '◉'][i]}</span><small>{item}</small></button>)}</nav>
        <footer className="footer"><div className="footer-brand"><span className="ig-square-logo">IG</span><span>© 1998 IGtrade</span></div><div className="footer-links"><a href="https://www.ig.com/en/terms-and-agreements" target="_blank" rel="noreferrer">Terms and agreements</a><a href="https://www.ig.com/en/privacy" target="_blank" rel="noreferrer">Privacy</a><a href="https://www.ig.com/en/fund-your-account" target="_blank" rel="noreferrer">How to fund</a><a href="https://www.ig.com/en/client-vulnerability" target="_blank" rel="noreferrer">Vulnerability</a><a href="https://www.ig.com/en/cookies" target="_blank" rel="noreferrer">Cookies</a><a href="https://www.ig.com/en/about-us" target="_blank" rel="noreferrer">About IG</a></div><div className="footer-social"><strong>Follow us online</strong><a href="https://www.facebook.com/IGInternational2" target="_blank" rel="noreferrer">Facebook</a><a href="https://twitter.com/IGInternational" target="_blank" rel="noreferrer">X</a><a href="https://www.youtube.com/channel/UCZj-ae-S_X-mocAH3xQnpUw" target="_blank" rel="noreferrer">YouTube</a><a href="https://www.linkedin.com/showcase/35901904/admin/" target="_blank" rel="noreferrer">LinkedIn</a></div><p className="footer-disclaimer">G International Limited is part of the IG Group and its ultimate parent company is IG Group Holdings Plc. IG International Limited receives services from other members of the IG Group including IG Markets Limited.</p>
           </footer>
        </main>
      </div>
    </div>
}

export default App;