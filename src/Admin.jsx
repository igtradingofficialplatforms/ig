
import React, { useMemo, useState } from 'react';
import Monitoring from './Monitoring.jsx';
import './Admin.css';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function AdminPanel({
  supabase,
  adminOpen,
  setAdminOpen,
  tradeEnabled,
  setTradeEnabled,
  requests = [],
  approveRequest,
  memberEmail,
  setMemberEmail,
  memberAmount,
  setMemberAmount,
  adjustMemberBalance,
  members = [],
  setToast,
  telegramUrl,
  setTelegramUrl,
  advancedRequests = [],
  reviewAdvancedRequest
}) {
  const [activePage, setActivePage] = useState('Overview');
  const [requestFilter, setRequestFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [advancedRejectionNotes, setAdvancedRejectionNotes] = useState({});

  const navItems = [
    { name: 'Overview', icon: '⌂' },
    { name: 'Requests', icon: '▤' },
    { name: 'Borrow', icon: '⇄' },
    { name: 'Users', icon: '♙' },
    { name: 'Monitoring', icon: '◉' },
    { name: 'Support', icon: '☏' },
    { name: 'Settings', icon: '⚙' }
  ];

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const pendingBorrow = advancedRequests.filter(r => r.status === 'Pending').length;

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesFilter =
        requestFilter === 'All' ||
        (requestFilter === 'Pending' && r.status === 'Pending') ||
        r.type === requestFilter;

      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        String(r.id || '').toLowerCase().includes(term) ||
        String(r.email || r.user_email || '').toLowerCase().includes(term) ||
        String(r.method || '').toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [requests, requestFilter, search]);

  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return members;

    return members.filter(m =>
      String(m.name || '').toLowerCase().includes(term) ||
      String(m.email || '').toLowerCase().includes(term) ||
      String(m.id || '').toLowerCase().includes(term)
    );
  }, [members, search]);

  const totalVirtualBalance = members.reduce(
    (sum, m) => sum + Number(m.balance || 0), 0
  );

  const totalRequestValue = requests.reduce(
    (sum, r) => sum + Number(r.amount || 0), 0
  );

  if (!adminOpen) return null;

  const goTo = (page) => {
    setActivePage(page);
    setSearch('');
    setRequestFilter('All');
  };

  const renderRequest = (r) => (
    <div className="request-card" key={r.id}>
      <div className="request-top">
        <strong>{r.type} · {r.method || 'Virtual'}</strong>
        <span className={`request-status ${(r.status || '').toLowerCase()}`}>
          {r.status}
        </span>
      </div>

      <div className="request-amount">
        {money(r.amount)}
        <small>Virtual demo value</small>
      </div>

      <div className="request-detail">
        <small>Member</small>
        <p>{r.email || r.user_email || 'Member'}</p>
      </div>

      <div className="request-detail">
        <small>Request ID</small>
        <p>{r.id}</p>
      </div>

      <small>Submitted: {r.created || 'N/A'}</small>

      {r.reviewedAt && <p className="muted">Reviewed: {r.reviewedAt}</p>}

      {r.adminNote && (
        <div className="request-detail">
          <small>Admin message</small>
          <p>{r.adminNote}</p>
        </div>
      )}

      {r.status === 'Pending' && (
        <>
          <label className="field-label">Rejection reason</label>
          <textarea
            className="text-input"
            rows={3}
            value={rejectionNotes[r.id] || ''}
            onChange={e =>
              setRejectionNotes(v => ({ ...v, [r.id]: e.target.value }))
            }
            placeholder="Write rejection reason..."
          />

          <div className="request-actions">
            <button
              className="btn btn-small btn-gold"
              onClick={() => approveRequest(r.id, 'Approved', '')}
            >
              Approve
            </button>

            <button
              className="btn btn-small btn-outline"
              onClick={() => {
                const note = (rejectionNotes[r.id] || '').trim();
                if (!note) {
                  setToast('Write a rejection reason first.');
                  return;
                }
                approveRequest(r.id, 'Rejected', note);
              }}
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderBorrow = (r) => (
    <div className="request-card" key={r.id}>
      <div className="request-top">
        <strong>Borrow · {r.asset || 'Virtual asset'}</strong>
        <span className={`request-status ${(r.status || '').toLowerCase()}`}>
          {r.status}
        </span>
      </div>

      <div className="request-amount">
        {money(r.amount)}
        <small>Virtual demo request</small>
      </div>

      <div className="request-detail">
        <small>Member</small>
        <p>{r.user_email || r.email || 'Member'}</p>
      </div>

      <div className="request-detail">
        <small>Collateral information</small>
        <p>
          {r.collateral_amount || 0} {r.collateral_asset || 'N/A'}
        </p>
      </div>

      <small>
        Submitted: {r.created_at
          ? new Date(r.created_at).toLocaleString()
          : 'N/A'}
      </small>

      {r.admin_note && (
        <div className="request-detail">
          <small>Admin message</small>
          <p>{r.admin_note}</p>
        </div>
      )}

      {r.status === 'Pending' && (
        <>
          <label className="field-label">Rejection reason</label>
          <textarea
            className="text-input"
            rows={3}
            value={advancedRejectionNotes[r.id] || ''}
            onChange={e =>
              setAdvancedRejectionNotes(v => ({
                ...v,
                [r.id]: e.target.value
              }))
            }
            placeholder="Write rejection reason..."
          />

          <div className="request-actions">
            <button
              className="btn btn-small btn-gold"
              onClick={() => reviewAdvancedRequest?.(r.id, 'Approved', '')}
            >
              Approve
            </button>

            <button
              className="btn btn-small btn-outline"
              onClick={() => {
                const note = (advancedRejectionNotes[r.id] || '').trim();

                if (!note) {
                  setToast('Write a rejection reason first.');
                  return;
                }

                reviewAdvancedRequest?.(r.id, 'Rejected', note);
              }}
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="admin-drawer admin-layout">

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">♛</div>
          <div>
            <strong>TradePro</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.name}
              className={`admin-nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => goTo(item.name)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === 'Requests' && pendingCount > 0 && (
                <b>{pendingCount}</b>
              )}

              {item.name === 'Borrow' && pendingBorrow > 0 && (
                <b>{pendingBorrow}</b>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-brand-icon">♛</div>
          <strong>Admin Control</strong>
          <p>Manage demo users, requests and platform settings</p>
          <small>Version 1.0</small>
        </div>
      </aside>

      <main className="admin-main">

        <header className="admin-topbar">
          <div className="admin-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users, requests, email, ID..."
            />
          </div>

          <div className="admin-topbar-right">
            <span className="admin-online-dot" />
            <span>Admin Online</span>
            <button
              className="icon-button"
              onClick={() => setAdminOpen(false)}
              aria-label="Close admin panel"
            >
              ×
            </button>
          </div>
        </header>

        <div className="admin-page-heading">
          <div>
            <span className="eyebrow">TRADEPRO MANAGEMENT</span>
            <h2>{activePage === 'Overview' ? 'Admin Dashboard' : activePage}</h2>
            <p>Manage platform activities and demo records</p>
          </div>
        </div>

        <div className="admin-warning">
          <strong>DEMO ONLY:</strong> This dashboard uses virtual values for
          demonstration. It does not process real payments, crypto transfers,
          or blockchain transactions.
        </div>

        {activePage === 'Overview' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card blue">
                <span>♙</span>
                <small>Total Users</small>
                <strong>{members.length}</strong>
                <p>Registered demo profiles</p>
              </div>

              <div className="admin-stat-card green">
                <span>▣</span>
                <small>Total Requests</small>
                <strong>{requests.length}</strong>
                <p>{pendingCount} pending review</p>
              </div>

              <div className="admin-stat-card purple">
                <span>⇄</span>
                <small>Borrow Requests</small>
                <strong>{advancedRequests.length}</strong>
                <p>{pendingBorrow} pending review</p>
              </div>

              <div className="admin-stat-card gold">
                <span>$</span>
                <small>Total Virtual Balance</small>
                <strong>{money(totalVirtualBalance)}</strong>
                <p>Demo balance only</p>
              </div>
            </div>

            <div className="admin-overview-grid">
              <section className="admin-panel-card">
                <div className="admin-card-heading">
                  <h3>Trade Scenario Control</h3>
                  <span className="admin-demo-label">Demo Only</span>
                </div>

                <div className="admin-toggle-row">
                  <div>
                    <strong>
                      Virtual trading: {tradeEnabled ? 'ON' : 'OFF'}
                    </strong>
                    <small>
                      {tradeEnabled
                        ? 'Shows a simulated positive result.'
                        : 'Trade execution is disabled in this demo.'}
                    </small>
                  </div>

                  <button
                    aria-label="Toggle virtual trading"
                    className={`toggle ${tradeEnabled ? 'toggle-on' : ''}`}
                    onClick={() => setTradeEnabled(v => !v)}
                  >
                    <span />
                  </button>
                </div>

                <p className="admin-help">
                  Outcomes are simulations, not market-derived results.
                  No real trade is executed and no real funds are moved.
                </p>
              </section>

              <section className="admin-panel-card">
                <div className="admin-card-heading">
                  <h3>Recent Requests</h3>
                  <button onClick={() => goTo('Requests')}>View all →</button>
                </div>

                {requests.slice(0, 4).length ? (
                  requests.slice(0, 4).map(r => (
                    <div className="admin-mini-row" key={r.id}>
                      <div>
                        <strong>{r.type} · {r.method || 'Virtual'}</strong>
                        <small>{r.email || r.user_email || 'Member'}</small>
                      </div>
                      <span className={`request-status ${(r.status || '').toLowerCase()}`}>
                        {r.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No requests yet</div>
                )}
              </section>
            </div>

            <div className="admin-overview-grid">
              <section className="admin-panel-card">
                <div className="admin-card-heading">
                  <h3>Advanced Borrow Requests</h3>
                  <button onClick={() => goTo('Borrow')}>View all →</button>
                </div>

                {advancedRequests.slice(0, 3).length ? (
                  advancedRequests.slice(0, 3).map(r => (
                    <div className="admin-mini-row" key={r.id}>
                      <div>
                        <strong>{r.asset || 'Virtual asset'}</strong>
                        <small>{r.user_email || r.email || 'Member'}</small>
                      </div>
                      <span className={`request-status ${(r.status || '').toLowerCase()}`}>
                        {r.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No borrow requests</div>
                )}
              </section>

              <section className="admin-panel-card">
                <div className="admin-card-heading">
                  <h3>Platform Summary</h3>
                </div>
                <div className="admin-summary-line">
                  <span>Total request value</span>
                  <strong>{money(totalRequestValue)}</strong>
                </div>
                <div className="admin-summary-line">
                  <span>Pending requests</span>
                  <strong>{pendingCount}</strong>
                </div>
                <div className="admin-summary-line">
                  <span>Registered users</span>
                  <strong>{members.length}</strong>
                </div>
              </section>
            </div>
          </>
        )}

        {activePage === 'Requests' && (
          <section className="admin-panel-card">
            <div className="admin-card-heading">
              <h3>Deposit / Withdrawal Requests ({requests.length})</h3>
            </div>

            <div className="history-tabs admin-request-tabs">
              {['All', 'Pending', 'Deposit', 'Withdraw'].map(t => (
                <button
                  key={t}
                  className={requestFilter === t ? 'selected' : ''}
                  onClick={() => setRequestFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {filteredRequests.length ? (
              filteredRequests.map(renderRequest)
            ) : (
              <div className="empty-state">No requests found</div>
            )}
          </section>
        )}

        {activePage === 'Borrow' && (
          <section className="admin-panel-card">
            <div className="admin-card-heading">
              <h3>Advanced Borrow Requests ({advancedRequests.length})</h3>
            </div>

            {advancedRequests.length ? (
              advancedRequests
                .filter(r => {
                  const term = search.toLowerCase();
                  return !term ||
                    String(r.user_email || r.email || '').toLowerCase().includes(term) ||
                    String(r.asset || '').toLowerCase().includes(term);
                })
                .map(renderBorrow)
            ) : (
              <div className="empty-state">No borrow requests found</div>
            )}
          </section>
        )}

        {activePage === 'Users' && (
          <>
            <section className="admin-panel-card">
              <div className="admin-card-heading">
                <h3>Registered Users ({members.length})</h3>
              </div>

              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>User ID</th>
                      <th>Virtual Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(m => (
                      <tr key={m.id}>
                        <td>{m.name || 'Student'}</td>
                        <td>{m.email || 'N/A'}</td>
                        <td>{m.id || 'N/A'}</td>
                        <td>{money(m.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!filteredMembers.length && (
                <div className="empty-state">No users found</div>
              )}
            </section>

            <section className="admin-panel-card">
              <div className="admin-card-heading">
                <h3>Manage Virtual Demo Balance</h3>
              </div>

              <label className="field-label">Member email / reference</label>
              <input
                className="text-input"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                placeholder="member@example.com"
              />

              <label className="field-label">Amount (virtual demo value)</label>
              <input
                className="text-input"
                type="number"
                min="0.01"
                step="0.01"
                value={memberAmount}
                onChange={e => setMemberAmount(e.target.value)}
                placeholder="100.00"
              />

              <div className="request-actions">
                <button
                  className="btn btn-small btn-gold"
                  onClick={() => adjustMemberBalance('add')}
                >
                  + Add virtual balance
                </button>

                <button
                  className="btn btn-small btn-outline"
                  onClick={() => adjustMemberBalance('subtract')}
                >
                  − Deduct virtual balance
                </button>
              </div>
            </section>
          </>
        )}

        {activePage === 'Monitoring' && (
          <section className="admin-panel-card">
            <div className="admin-card-heading">
              <h3>User Activity Monitoring</h3>
            </div>
            <Monitoring supabase={supabase} />
          </section>
        )}

        {activePage === 'Support' && (
          <section className="admin-panel-card">
            <div className="admin-card-heading">
              <h3>Customer Care</h3>
            </div>

            <label className="field-label">Telegram support URL</label>
            <input
              className="text-input"
              value={telegramUrl}
              onChange={e => setTelegramUrl(e.target.value)}
              placeholder="https://t.me/your_support"
            />

            <button
              className="btn btn-outline btn-full"
              onClick={() => setToast('Support URL updated in this browser preview only.')}
            >
              Save support link
            </button>
          </section>
        )}

        {activePage === 'Settings' && (
          <section className="admin-panel-card">
            <div className="admin-card-heading">
              <h3>Platform Settings</h3>
            </div>

            <div className="admin-toggle-row">
              <div>
                <strong>Virtual trading scenario</strong>
                <small>Enable or disable the simulated trading display</small>
              </div>

              <button
                className={`toggle ${tradeEnabled ? 'toggle-on' : ''}`}
                onClick={() => setTradeEnabled(v => !v)}
                aria-label="Toggle virtual trading"
              >
                <span />
              </button>
            </div>

            <div className="admin-warning">
              This is a prototype dashboard. Settings here do not enable
              real-money payment processing or crypto transfers.
            </div>
          </section>
        )}

        <footer className="admin-footer">
          TradePro Admin Panel · Demo Environment
        </footer>
      </main>
    </div>
  );
}
