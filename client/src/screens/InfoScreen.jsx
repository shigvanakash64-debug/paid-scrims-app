import React from 'react';

const pageConfig = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: [
      {
        heading: 'Your privacy matters',
        body: 'We collect only the data necessary to operate the platform, manage your wallet, and ensure safe match-making. Your information is stored securely and is never shared with third parties without your consent.',
      },
      {
        heading: 'Data usage',
        body: 'We use your profile information and match history to provide personalized services, process payments, and resolve disputes. Logged data may also be used for fraud prevention and support.',
      },
      {
        heading: 'Security',
        body: 'We follow industry-standard practices to protect user data and do not store sensitive payment credentials directly. For questions, contact support through the app.',
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
        body: 'Refunds for disputed matches are evaluated on a case-by-case basis after review. Please raise support tickets promptly if you believe a refund is warranted.',
      },
    ],
  },
  'support-ticket': {
    title: 'Support Ticket',
    content: [
      {
        heading: 'Need help?',
        body: 'Use the support ticket page to report match issues, payment questions, or account problems. Provide clear details and any relevant screenshots so we can respond faster.',
      },
      {
        heading: 'Response time',
        body: 'Support requests are typically reviewed within 24-48 hours. Urgent issues are prioritized, but resolution may take longer if additional information is required.',
      },
      {
        heading: 'What to include',
        body: 'Include your UID, match ID, and a brief description of the problem. The more detail you provide, the quicker we can investigate and resolve the issue.',
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

  return (
    <div id="screen-info" className="screen-home">
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
            <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
            <p className="text-gray-700 leading-7">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
