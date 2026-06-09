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
        heading: '8. Contact Email',
        body: 'Support Email: supportclutchzone@gmail.com\n\nFor privacy concerns, contact support via the app or email us directly.',
      },
      {
        heading: '9. Agreement',
        body: 'By using Clutch Zone, you agree to this Privacy Policy.',
      },
    ],
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    content: [
      {
        heading: 'Terms & Conditions – Clutch Zone',
        body: '',
      },
      {
        heading: '1. Platform Use',
        body: 'Clutch Zone is a skill-based competitive platform. Users participate at their own risk.',
      },
      {
        heading: '2. Eligibility',
        body: 'You must be legally allowed to participate in online skill-based competitions in your region.',
      },
      {
        heading: 'Age Requirement',
        body: 'Users must be at least 18 years old or the minimum legal age required in their jurisdiction to participate on Clutch Zone.',
      },
      {
        heading: 'Skill-Based Disclaimer',
        body: 'Clutch Zone is a skill-based competitive platform. Match outcomes are determined by player performance, strategy, and skill.',
      },
      {
        heading: 'Wallet Clause',
        body: 'Wallet balances are platform credits. Clutch Zone reserves the right to verify transactions, suspend suspicious activity, and review withdrawals before processing.',
      },
      {
        heading: '3. User Conduct',
        body: '* No cheating, hacking, or unfair play\n* No abusive behavior\n* No manipulation of results\n\nViolation may result in permanent ban.',
      },
      {
        heading: '4. Match Rules',
        body: 'Each match follows predefined rules (mode, weapon restrictions, etc.).\nPlayers must follow them strictly.',
      },
      {
        heading: '5. Payments',
        body: '* Entry fees are paid before matches\n* Winnings are credited after match verification\n* Platform may hold funds temporarily for dispute resolution',
      },
      {
        heading: '6. Disputes',
        body: 'All disputes are reviewed by Clutch Zone.\nFinal decision is binding.',
      },
      {
        heading: '7. Account Suspension',
        body: 'We reserve the right to suspend or terminate accounts for violations.',
      },
      {
        heading: '8. Limitation of Liability',
        body: 'We are not responsible for:\n\n* Network issues\n* Device performance\n* Player behavior outside platform',
      },
      {
        heading: '9. Changes',
        body: 'We may update these terms anytime.\n\nBy using Clutch Zone, you agree to these Terms.',
      },
    ],
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    content: [
      {
        heading: 'Refund & Cancellation Policy – Clutch Zone',
        body: '',
      },
      {
        heading: '1. Entry Fees',
        body: 'All match entry fees are final once the match is joined.',
      },
      {
        heading: '2. Refund Eligibility',
        body: 'Refunds may be issued only if:\n\n* Match did not start due to system failure\n* Opponent did not join (as per rules)\n* Verified technical issue from platform side',
      },
      {
        heading: '3. No Refund Cases',
        body: '* Player leaves match voluntarily\n* Rule violation or disqualification\n* Loss of match',
      },
      {
        heading: '4. Cancellation',
        body: '* Matches cannot be cancelled once started\n* Pre-match cancellation depends on lobby status',
      },
      {
        heading: '5. Withdrawal Processing',
        body: 'Withdrawal requests are typically processed within 1–7 business days after verification.',
      },
      {
        heading: '6. Minimum Withdrawal',
        body: 'Clutch Zone may set minimum withdrawal limits and verification requirements.',
      },
      {
        heading: '7. Withdrawal Notes',
        body: '* Users can withdraw available wallet balance\n* Processing time may vary',
      },
      {
        heading: '8. Dispute-Based Refunds',
        body: 'Refunds in disputes are subject to admin review.\n\nAll decisions are final.\n\nBy using Clutch Zone, you agree to these.',
      },
    ],
  },
  'raise-ticket': {
    title: 'Raise Ticket',
    content: [
      {
        heading: 'Support – Raise a Ticket',
        body: 'Need help? We’ve got you.',
      },
      {
        heading: 'When to Contact Support',
        body: '* Match disputes\n* Payment issues\n* Withdrawal problems\n* Bug reports',
      },
      {
        heading: 'How It Works',
        body: '1. Submit your issue with details\n2. Attach proof (screenshots/video if required)\n3. Our team reviews and responds',
      },
      {
        heading: 'Required Details',
        body: '* Match ID\n* Issue description\n* Relevant proof',
      },
      {
        heading: 'Response Time',
        body: 'Usually within 24–48 hours.',
      },
      {
        heading: 'Important',
        body: 'False or misleading reports may lead to account action.\n\nWe’re here to ensure fair and smooth gameplay.\n\nBy using Clutch Zone, you agree to these.',
      },
    ],
  },
  'fair-play': {
    title: 'Fair Play Policy',
    content: [
      {
        heading: 'Fair Play Policy – Clutch Zone',
        body: 'Clutch Zone is built on skill, not shortcuts.',
      },
      {
        heading: '1. Zero Tolerance for Cheating',
        body: '* Hacks, scripts, mods = permanent ban\n* Exploits or bugs abuse = strict action',
      },
      {
        heading: '2. Match Integrity',
        body: '* Follow selected mode rules (headshot, weapon restrictions, etc.)\n* Invalid kills may lead to disqualification',
      },
      {
        heading: '3. No Collusion',
        body: '* Teaming in solo matches\n* Match fixing\n  = immediate ban',
      },
      {
        heading: '4. Respect Opponents',
        body: '* No abuse, harassment, or toxic behavior',
      },
      {
        heading: '5. Evidence Clause',
        body: 'Screenshots, screen recordings, match results, and other supporting evidence may be required during disputes.',
      },
      {
        heading: '6. Admin Authority',
        body: 'Clutch Zone reserves the right to:\n\n* Review matches\n* Reverse results\n* Suspend accounts',
      },
      {
        heading: '7. Repeated Violations',
        body: 'May lead to permanent removal from platform.\n\nPlay fair. Win real.\n\nBy using Clutch Zone, you agree to these.',
      },
    ],
  },
  'responsible-gaming': {
    title: 'Responsible Gaming Policy',
    content: [
      {
        heading: 'Responsible Gaming Policy',
        body: 'Play responsibly.\n\nDo not spend more than you can afford to lose.\nTake regular breaks.\nDo not participate under pressure or financial stress.\nUsers may request account restrictions or account closure.',
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
