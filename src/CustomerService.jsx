
import React from 'react';

export default function CustomerService({
  telegramUrl = 'https://t.me/igtrading_platforms93'
}) {
  return (
    <a
      className="customer-service-float"
      href={telegramUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Customer Service"
      title="Customer Service"
    >
      <span className="customer-service-pulse" />
      <span className="customer-service-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.5 3.5 18.3 20c-.24 1.17-.87 1.46-1.76.91l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.03-8.16c.39-.35-.08-.55-.6-.2L5.96 13.9l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.55L20.15 3.3c.86-.32 1.62.2 1.35 1.2Z" />
        </svg>
      </span>
      <span className="customer-service-label">
        Customer Service
      </span>
    </a>
  );
}
