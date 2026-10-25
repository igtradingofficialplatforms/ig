import React from 'react';

export default function CustomerService({ telegramUrl = 'https://t.me/igtrading_platforms93' }) {
  return (
    <div className="care-banner">
      <div className="care-icon">✈</div>
      <div><strong>Need help?</strong><p className="muted">Telegram customer care: @igtrading_platforms93</p></div>
      <a className="btn btn-outline" href={telegramUrl} target="_blank" rel="noreferrer">Telegram support ↗</a>
    </div>
  );
}
