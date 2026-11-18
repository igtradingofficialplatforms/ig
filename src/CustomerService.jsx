
import React from 'react';

export default function CustomerService({
  telegramUrl = 'https://t.me/igtrading_platforms93'
}) {
  return (
    <a
      className="customer-service-float"
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Customer Service"
      title="Customer Service"
    >
      <span className="customer-service-icon">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="goldSupport" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE8A3" />
              <stop offset="45%" stopColor="#D9AC50" />
              <stop offset="100%" stopColor="#A87928" />
            </linearGradient>
          </defs>

          {/* Headset arch */}
          <path
            d="M12 31V27C12 15.95 20.95 7 32 7s20 8.95 20 20v4"
            fill="none"
            stroke="url(#goldSupport)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Left and right ear cups */}
          <rect x="7" y="28" width="11" height="19" rx="5"
            fill="url(#goldSupport)" />
          <rect x="46" y="28" width="11" height="19" rx="5"
            fill="url(#goldSupport)" />

          {/* Agent head */}
          <circle cx="32" cy="26" r="10"
            fill="url(#goldSupport)" />

          {/* Neck */}
          <path
            d="M26 34h12v7H26z"
            fill="url(#goldSupport)"
          />

          {/* Shoulders */}
          <path
            d="M14 53c1-9 8-14 18-14s17 5 18 14v3H14z"
            fill="url(#goldSupport)"
          />

          {/* Microphone */}
          <path
            d="M49 44c0 8-5 12-13 12h-3"
            fill="none"
            stroke="url(#goldSupport)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="31" cy="56" r="3"
            fill="url(#goldSupport)" />
        </svg>
      </span>

      <span className="customer-service-label">
        Customer Service
      </span>
    </a>
  );
}
