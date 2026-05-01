import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const pageConfig = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: [
      {
        heading: 'Privacy Policy – Clutch Zone',
        body: 'We respect your privacy and are committed to protecting your data.',
      },
      {
        heading: '1. Information We Collect',
        body: '* Basic account info (username, email, phone if provided)\n* Gameplay activity (matches played, results, wallet transactions)\n* Device/browser data (for security and analytics)',
      },
      {
        heading: '2. How We Use Your Data',
        body: '* To operate and improve the platform\n* To manage matches, payments, and results\n* To prevent fraud, cheating, and abuse\n* To send important notifications (match updates, wallet alerts)',
      },
      {
        heading: '3. Data Sharing',
        body: 'We do NOT sell your personal data.\nWe may share data only:\n\n* With payment providers (for transactions)\n* When required by law',
      },
      {
        heading: '4. Data Security',
        body: 'We use industry-standard security practices. However, no system is 100% secure.',
      },
      {
        heading: '5. User Responsibility',
        body: 'You are responsible for keeping your account credentials safe.',
      },
      {
        heading: '6. Cookies & Tracking',
        body: 'We may use cookies or similar technologies for performance and analytics.',
      },
      {
        heading: '7. Updates',
        body: 'This policy may change over time. Continued use = acceptance of updates.',
      },
      {
        heading: '8. Contact',
        body: 'For privacy concerns, contact support via the app.\n\nBy using Clutch Zone, you agree to this Privacy Policy.',
      },
    ],
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    content: [
      {
        heading: 'Agreement to use the service',
        body: 'By using the platform, you agree to follow all rules, pay entry fees on time, and respect opponents. You are responsible for the accuracy of your profile and UID details.',
      },
      {
        heading: 'Match conduct',
        body: 'Matches must be played fairly within the selected kill type and skill settings. Any violation may result in penalties, disputes, or account restrictions.',
      },
      {
        heading: 'Platform rights',
        body: 'We reserve the right to modify rules, suspend accounts, or cancel matches to protect users and the integrity of the platform.',
      },
    ],
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    content: [
      {
        heading: 'Deposit and wallet funds',
        body: 'Wallet deposits are non-refundable once processed. Funds can be used for match entry fees and withdrawals subject to platform rules.',
      },
      {
        heading: 'Match cancellation',
        body: 'If a match is canceled by the platform or due to opponent issues, the entry fee may be refunded or returned to your wallet depending on the situation.',
      },
      {
        heading: 'Disputes',
        body: 'Refunds for disputed matches are evaluated on a case-by-case basis after review. Please raise a ticket promptly if you believe a refund is warranted.',
      },
    ],
  },
  'raise-ticket': {
    title: 'Raise Ticket',
    content: [
      {
        heading: 'Need help?',
        body: 'Use this page to raise an issue with your match, payment, or account. Provide clear details so our admin team can respond quickly.',
      },
      {
        heading: 'Response time',
        body: 'Raised tickets are typically reviewed by admins within 24-48 hours. Urgent issues will be prioritized based on severity.',
      },
      {
        heading: 'What to include',
        body: 'Include your UID, match ID, and a concise description of the problem. The more detail you provide, the faster we can resolve it.',
      },
    ],
  },
  'fair-play': {
    title: 'Fair Play Policy',
    content: [
      {
        heading: 'Play honestly',
        body: 'Fair play is required in every match. Cheating, exploiting bugs, or using unauthorized tools is strictly prohibited and may lead to account suspension or bans.',
      },
      {
        heading: 'Respect opponents',
        body: 'Treat other users with respect. Harassment, abuse, or disruptive behavior is not tolerated.',
      },
      {
        heading: 'Match rules compliance',
        body: 'Follow the selected kill type, skill setting, and any match-specific rules. Violations may result in penalties or match forfeiture.',
      },
    ],
  },
};

export const InfoScreen = ({ page }) => {
  const pageData = pageConfig[page] || pageConfig['privacy-policy'];
  const [subject, setSubject] = useState('Issue with my match');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: false, success: '', error: '' });

  const isRaiseTicket = page === 'raise-ticket';

  const handleRaiseTicket = async () => {
    if (!message.trim()) {
      setStatus({ loading: false, success: '', error: 'Please describe your issue before raising a ticket.' });
      return;
    }

    setStatus({ loading: true, success: '', error: '' });

    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(
        `${API_BASE}/tickets`,
        {
          subject: subject.trim() || 'Issue with my match',
          message: message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStatus({ loading: false, success: 'Ticket raised successfully. Admin will review it shortly.', error: '' });
      setMessage('');
    } catch (error) {
      setStatus({
        loading: false,
        success: '',
        error: error.response?.data?.error || 'Unable to raise ticket. Please try again later.',
      });
    }
  };

  return (
    <div id="screen-info" className="screen-home info-page">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="game-pill">
              <div className="game-dot"></div>
              <span>{pageData.title}</span>
            </div>
            <div className="screen-title">{pageData.title}</div>
          </div>
        </div>
      </div>
      <div className="section">
        {pageData.content.map((section) => (
          <div key={section.heading} className="info-section">
            <h2 className="info-heading">{section.heading}</h2>
            <p className="info-text">{section.body}</p>
          </div>
        ))}
        {isRaiseTicket && (
          <div className="info-ticket-form">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                className="form-input"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Briefly describe your issue"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Issue details</label>
              <textarea
                className="form-input"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Explain your issue here, including match ID, UID, or payment details."
              />
            </div>
            {status.error && <div className="error-message">{status.error}</div>}
            {status.success && <div className="success-message">{status.success}</div>}
            <button
              className="btn-primary"
              type="button"
              onClick={handleRaiseTicket}
              disabled={status.loading}
            >
              {status.loading ? 'Raising Ticket...' : 'Raise Ticket'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
