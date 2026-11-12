
import React, { useEffect, useMemo, useState } from 'react'

const products = [
  { coin: 'USDT', name: 'Tether', flexible: 3.2, locked: 5.1, days: 30 },
  { coin: 'USDC', name: 'USD Coin', flexible: 3.0, locked: 4.8, days: 30 },
  { coin: 'BTC', name: 'Bitcoin', flexible: 0.8, locked: 1.5, days: 60 },
  { coin: 'ETH', name: 'Ethereum', flexible: 1.2, locked: 2.1, days: 60 },
  { coin: 'SOL', name: 'Solana', flexible: 2.4, locked: 4.2, days: 30 }
]

const money = value =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })

export default function EarnPage() {
  const [tab, setTab] = useState('Simple Earn')
  const [type, setType] = useState('Flexible')
  const [coin, setCoin] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [positions, setPositions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('igtrade-earn-positions') || '[]')
    } catch {
      return []
    }
  })
  const [message, setMessage] = useState('')

  const selected = products.find(p => p.coin === coin) || products[0]
  const apr = type === 'Flexible' ? selected.flexible : selected.locked

  const totalInvested = positions
    .filter(p => p.status === 'Active')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalEarned = positions
    .filter(p => p.status === 'Active')
    .reduce((sum, p) => sum + p.earned, 0)

  useEffect(() => {
    localStorage.setItem('igtrade-earn-positions', JSON.stringify(positions))
  }, [positions])

  useEffect(() => {
    const timer = setInterval(() => {
      setPositions(current =>
        current.map(position => {
          if (position.status !== 'Active') return position

          const elapsed = Math.max(
            0,
            (Date.now() - position.lastAccrual) / 86400000
          )

          const earned = position.amount * position.apr / 100 * elapsed

          return {
            ...position,
            earned: position.earned + earned,
            lastAccrual: Date.now()
          }
        })
      )
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  const subscribe = () => {
    const value = Number(amount)

    if (!Number.isFinite(value) || value < 10) {
      setMessage('Minimum demo subscription is 10')
      return
    }

    const position = {
      id: Date.now(),
      coin,
      name: selected.name,
      amount: value,
      apr,
      type,
      days: type === 'Locked' ? selected.days : 0,
      createdAt: Date.now(),
      lastAccrual: Date.now(),
      earned: 0,
      status: 'Active'
    }

    setPositions(current => [position, ...current])
    setAmount('')
    setTab('My Positions')
    setMessage('Demo subscription successful')
  }

  const redeem = id => {
    setPositions(current =>
      current.map(position =>
        position.id === id
          ? { ...position, status: 'Redeemed', redeemedAt: Date.now() }
          : position
      )
    )
    setMessage('Demo redemption completed')
  }

  const formatDate = date =>
    new Date(date).toLocaleDateString()

  return (
    <div className="earn-page" style={{
      color: '#f5f5f5',
      background: '#111315',
      padding: 20,
      borderRadius: 12
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Earn</h2>
          <p style={{ color: '#999' }}>Grow your demo assets with Earn products</p>
        </div>
        <span style={{
          color: '#e5bd62',
          border: '1px solid #80652e',
          padding: '6px 12px',
          borderRadius: 20,
          fontSize: 12
        }}>DEMO MODE</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
        gap: 12,
        margin: '20px 0'
      }}>
        <div style={cardStyle}>
          <small style={muted}>Total Active Principal</small>
          <h2>{money(totalInvested)}</h2>
          <small>Demo assets</small>
        </div>
        <div style={cardStyle}>
          <small style={muted}>Total Earned</small>
          <h2 style={{ color: '#16c784' }}>+{money(totalEarned)}</h2>
          <small>Simulated rewards</small>
        </div>
        <div style={cardStyle}>
          <small style={muted}>Active Positions</small>
          <h2>{positions.filter(p => p.status === 'Active').length}</h2>
          <small>Current subscriptions</small>
        </div>
      </div>

      <div style={tabsStyle}>
        {['Simple Earn', 'My Positions', 'History'].map(item => (
          <button
            key={item}
            onClick={() => setTab(item)}
            style={tab === item ? activeTab : normalTab}
          >
            {item}
          </button>
        ))}
      </div>

      {message && (
        <div style={{
          padding: 12,
          margin: '12px 0',
          background: '#242820',
          color: '#16c784',
          borderRadius: 8
        }}>
          {message}
          <button
            onClick={() => setMessage('')}
            style={{ float: 'right', background: 'none', color: 'white', border: 0 }}
          >×</button>
        </div>
      )}

      {tab === 'Simple Earn' && (
        <>
          <h3>Subscribe to Earn</h3>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['Flexible', 'Locked'].map(item => (
              <button
                key={item}
                onClick={() => setType(item)}
                style={type === item ? activeTab : normalTab}
              >
                {item}
              </button>
            ))}
          </div>

          <label style={muted}>Select Asset</label>
          <select
            value={coin}
            onChange={e => setCoin(e.target.value)}
            style={inputStyle}
          >
            {products.map(p => (
              <option key={p.coin} value={p.coin}>
                {p.coin} — {p.name}
              </option>
            ))}
          </select>

          <div style={cardStyle}>
            <div style={muted}>Estimated APR</div>
            <h1 style={{ color: '#16c784', margin: '8px 0' }}>
              {apr.toFixed(2)}%
            </h1>
            <div style={muted}>
              {type === 'Flexible'
                ? 'Flexible redemption'
                : `Locked period: ${selected.days} days`}
            </div>
          </div>

          <label style={muted}>Subscription Amount ({coin})</label>
          <input
            type="number"
            min="10"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (minimum 10)"
            style={inputStyle}
          />

          <button onClick={subscribe} style={subscribeStyle}>
            Subscribe
          </button>

          <p style={muted}>
            Demo only: no real funds are transferred and APR is illustrative
          </p>

          <h3>Available Products</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Flexible APR</th>
                  <th>Locked APR</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.coin}>
                    <td>{p.coin}</td>
                    <td style={{ color: '#16c784' }}>{p.flexible}%</td>
                    <td style={{ color: '#16c784' }}>{p.locked}%</td>
                    <td>{p.days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'My Positions' && (
        <>
          <h3>My Earn Positions</h3>
          {positions.filter(p => p.status === 'Active').length === 0 && (
            <p style={muted}>You do not have any active demo positions</p>
          )}

          {positions.filter(p => p.status === 'Active').map(p => (
            <div key={p.id} style={positionStyle}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <strong>{p.coin} — {p.name}</strong>
                <span style={greenBadge}>● Active</span>
              </div>

              <div style={detailsGrid}>
                <span>Principal</span>
                <strong>{money(p.amount)} {p.coin}</strong>
                <span>APR</span>
                <strong style={{ color: '#16c784' }}>{p.apr}%</strong>
                <span>Product</span>
                <strong>{p.type}</strong>
                <span>Estimated rewards</span>
                <strong style={{ color: '#16c784' }}>+{money(p.earned)} {p.coin}</strong>
                <span>Started</span>
                <strong>{formatDate(p.createdAt)}</strong>
                <span>Duration</span>
                <strong>{p.days ? `${p.days} days` : 'Flexible'}</strong>
              </div>

              <button onClick={() => redeem(p.id)} style={redeemStyle}>
                Redeem Demo Position
              </button>
            </div>
          ))}
        </>
      )}

      {tab === 'History' && (
        <>
          <h3>Earn History</h3>
          {positions.length === 0 && (
            <p style={muted}>No demo Earn history yet</p>
          )}
          {positions.map(p => (
            <div key={p.id} style={positionStyle}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10
              }}>
                <strong>{p.coin} — {p.type}</strong>
                <span style={p.status === 'Active' ? greenBadge : redBadge}>
                  {p.status}
                </span>
              </div>
              <p>Principal: {money(p.amount)} {p.coin}</p>
              <p>APR: {p.apr}%</p>
              <p>Created: {formatDate(p.createdAt)}</p>
              <p style={{
                color: p.status === 'Active' ? '#16c784' : '#ef5350'
              }}>
                {p.status === 'Active' ? '● Earning' : '● Redeemed'}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const cardStyle = {
  background: '#1c2024',
  border: '1px solid #30363d',
  borderRadius: 10,
  padding: 16
}

const muted = { color: '#929aa3', fontSize: 13 }

const tabsStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  borderBottom: '1px solid #30363d',
  paddingBottom: 12,
  marginBottom: 18
}

const activeTab = {
  background: '#f0b90b',
  color: '#111',
  border: 0,
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 700
}

const normalTab = {
  background: '#252a30',
  color: '#ddd',
  border: '1px solid #383f46',
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer'
}

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  margin: '8px 0 16px',
  borderRadius: 6,
  border: '1px solid #444',
  background: '#20252a',
  color: 'white'
}

const subscribeStyle = {
  width: '100%',
  padding: 14,
  border: 0,
  borderRadius: 7,
  background: '#f0b90b',
  color: '#111',
  fontWeight: 700,
  cursor: 'pointer'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  minWidth: 450
}

const positionStyle = {
  background: '#1c2024',
  border: '1px solid #30363d',
  borderRadius: 10,
  padding: 16,
  margin: '12px 0'
}

const detailsGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  margin: '18px 0',
  fontSize: 13
}

const greenBadge = {
  color: '#16c784',
  background: '#123528',
  padding: '5px 9px',
  borderRadius: 20,
  fontSize: 12
}

const redBadge = {
  color: '#ef5350',
  background: '#3a2020',
  padding: '5px 9px',
  borderRadius: 20,
  fontSize: 12
}

const redeemStyle = {
  background: '#30363d',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: 6,
  padding: '10px 14px',
  cursor: 'pointer'
}
