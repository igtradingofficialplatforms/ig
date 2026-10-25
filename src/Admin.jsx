import React, { useMemo, useState } from 'react';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminPanel({
  adminOpen, setAdminOpen, tradeEnabled, setTradeEnabled, requests, approveRequest,
  memberEmail, setMemberEmail, memberAmount, setMemberAmount, memberAction,
  adjustMemberBalance, members, walletAddresses, setWalletAddresses, setToast,
  telegramUrl, setTelegramUrl
}) {
  const [requestFilter, setRequestFilter] = useState('All');
  const [rejectionNotes, setRejectionNotes] = useState({});
  const filteredRequests = useMemo(() => requests.filter(r => requestFilter === 'All' || (requestFilter === 'Pending' ? r.status === 'Pending' : r.type === requestFilter)), [requests, requestFilter]);
  if (!adminOpen) return null;

  return (
    <div className="admin-drawer">
      <div className="drawer-head"><div><span className="eyebrow">LOCAL CONTROLS</span><h2>Admin panel</h2></div><button className="icon-button" onClick={() => setAdminOpen(false)} aria-label="Close admin panel">×</button></div>
      <div className="admin-warning"><strong>Prototype only:</strong> this panel changes virtual available balances in this browser. It has no secure admin login, shared database, blockchain verification, or real-money payment processing. Do not use placeholder addresses for real transfers.</div>

      <div className="admin-section-title">Trade scenario control</div>
      <div className="admin-toggle-row"><div><strong>virtual trading: {tradeEnabled ? 'ON' : 'OFF'}</strong><small>{tradeEnabled ? 'ON shows a simulated positive result.' : 'OFF blocks trade execution and shows a simulated loss preview only.'}</small></div><button aria-label="Toggle virtual trading" className={`toggle ${tradeEnabled ? 'toggle-on' : ''}`} onClick={() => setTradeEnabled(v => !v)}><span /></button></div>
      <p className="muted admin-help">Outcomes are clearly labeled simulations, not market-derived results. OFF does not execute a trade or deduct funds.</p>

      <div className="admin-section-title">Deposit / withdrawal requests ({requests.length})</div>
      <div className="history-tabs admin-request-tabs">{['All', 'Pending', 'Deposit', 'Withdraw'].map(t => <button key={t} className={requestFilter === t ? 'selected' : ''} onClick={() => setRequestFilter(t)}>{t}</button>)}</div>
      {filteredRequests.length ? filteredRequests.map(r => (
        <div className="request-card" key={r.id}>
          <div className="request-top"><strong>{r.type} · {r.method}</strong><span className={`request-status ${(r.status || '').toLowerCase()}`}>{r.status}</span></div>
          <div className="request-amount">{money(r.amount)} <small>USDT virtual value</small></div>
          <small>Submitted: {r.created}</small>
          {r.address && <div className="request-detail"><small>Destination address</small><div className="address-wrap">{r.address}</div></div>}
          {r.fileName && <div className="request-detail"><small>Payment proof: {r.fileName}</small>{r.proofUrl ? <a href={r.proofUrl} target="_blank" rel="noreferrer"><img src={r.proofUrl} alt="Submitted deposit proof" style={{display:'block', width:'100%', maxHeight:240, objectFit:'contain', marginTop:8, borderRadius:10, background:'#111'}} /></a> : <small>No image attached to this request.</small>}</div>}
          {r.reviewedAt && <small>Reviewed: {r.reviewedAt}</small>}
          {r.adminNote && <div className="request-detail"><small>Admin message</small><p>{r.adminNote}</p></div>}
          {r.status === 'Pending' && <><label className="field-label">Rejection reason / message (required to reject)</label><textarea className="text-input" rows={3} value={rejectionNotes[r.id] || ''} onChange={e => setRejectionNotes(v => ({...v, [r.id]: e.target.value}))} placeholder="Write why this request is rejected..." /><div className="request-actions"><button onClick={() => approveRequest(r.id, 'Approved', '')} className="btn btn-small btn-gold">Approve</button><button onClick={() => { const note = (rejectionNotes[r.id] || '').trim(); if (!note) { setToast('Write a rejection reason before rejecting this request.'); return; } approveRequest(r.id, 'Rejected', note); }} className="btn btn-small btn-outline">Reject</button></div></>}
        </div>
      )) : <div className="empty-state"><strong>No requests in this filter</strong><p>New submitted requests will appear here.</p></div>}

      <div className="admin-section-title">Member account balance controls</div>
      <p className="muted admin-help">Approving a deposit/withdraw request only changes its status and shows the admin message. It never changes a member balance automatically. Use Add balance / Deduct balance to change the active available balance manually.</p>
      <label className="field-label">Member email / reference</label><input className="text-input" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" />
      <label className="field-label">Amount (USDT virtual value)</label><input className="text-input" type="number" min="0.01" step="0.01" value={memberAmount} onChange={e => setMemberAmount(e.target.value)} placeholder="100.00" />
      <div className="request-actions"><button className="btn btn-small btn-gold" onClick={() => adjustMemberBalance('add')}>＋ Add balance</button><button className="btn btn-small btn-outline" onClick={() => adjustMemberBalance('subtract')}>− Deduct balance</button></div>
      {members.length ? members.map(m => <div className="admin-address" key={m.id}><span>{m.email}</span><code>{money(m.balance)}</code></div>) : <div className="empty-state"><p>No member adjustments yet.</p></div>}

      <div className="admin-section-title">Deposit wallet addresses</div>
      <p className="muted admin-help">Paste only wallet addresses you control and verify the correct network. Saving here affects this browser preview only.</p>
      {['TRC20','BTC','ETH'].map(n => <div className="admin-address admin-address-edit" key={n}><span>{n}</span><input className="text-input" value={walletAddresses[n] || ''} onChange={e => setWalletAddresses(v => ({...v, [n]: e.target.value}))} placeholder={`Paste ${n} address`} /></div>)}
      <button className="btn btn-outline btn-full" onClick={() => setToast('Wallet addresses updated in this browser preview only.')}>Save wallet settings</button>

      <div className="admin-section-title">Customer care</div>
      <label className="field-label">Telegram support URL</label><input className="text-input" value={telegramUrl} onChange={e => setTelegramUrl(e.target.value)} placeholder="https://t.me/your_support" />
      <button className="btn btn-outline btn-full" onClick={() => setToast('Support URL updated in this browser preview only.')}>Save support link</button>
    </div>
  );
}
