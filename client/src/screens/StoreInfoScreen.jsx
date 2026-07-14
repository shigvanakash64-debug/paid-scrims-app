export const StoreInfoScreen = ({ page }) => {
  const content = {
    'store-terms': {
      title: 'Terms & Conditions',
      sections: [
        {
          heading: 'Welcome',
          content: 'Welcome to Clutch Zone Store. By accessing or using our website, you agree to comply with these Terms & Conditions.',
        },
        {
          heading: 'Products',
          content: 'We sell digital wallpaper files for personal use. No physical products are shipped.',
        },
        {
          heading: 'Account',
          content: 'You are responsible for maintaining the confidentiality of your account credentials.',
        },
        {
          heading: 'Purchases',
          content: 'All payments must be completed before access to downloadable wallpapers is granted.',
        },
        {
          heading: 'License',
          content: 'Purchasing a wallpaper grants you a non-exclusive, non-transferable license for personal use only.\n\nYou may not:\n• Resell wallpapers.\n• Redistribute wallpapers.\n• Share download links.\n• Claim ownership of our content.\n• Use wallpapers commercially without permission.',
        },
        {
          heading: 'Intellectual Property',
          content: 'All wallpapers, logos, graphics and website content are the intellectual property of Clutch Zone Store unless otherwise stated.',
        },
        {
          heading: 'Termination',
          content: 'We reserve the right to suspend or terminate accounts involved in fraud, abuse, unauthorized redistribution or violations of these terms.',
        },
        {
          heading: 'Changes',
          content: 'These Terms may be updated at any time. Continued use of the website constitutes acceptance of the revised Terms.',
        },
      ],
    },
    'store-privacy': {
      title: 'Privacy Policy',
      sections: [
        {
          heading: 'Information We Collect',
          content: 'We may collect:\n• Username\n• Password (encrypted)\n• Purchase history\n• Device/browser information\n• Download history',
        },
        {
          heading: 'Payment Information',
          content: 'Payments are securely processed through our payment partners. We do not store your card or UPI credentials.',
        },
        {
          heading: 'How We Use Information',
          content: 'We use your information to:\n• Process purchases\n• Deliver wallpapers\n• Maintain your account\n• Improve our services\n• Prevent fraud',
        },
        {
          heading: 'Data Sharing',
          content: 'We do not sell your personal information.\n\nInformation may only be shared when required by law or with trusted payment/service providers.',
        },
        {
          heading: 'Security',
          content: 'We implement reasonable security measures to protect user information.',
        },
      ],
    },
    'store-refund': {
      title: 'Refund & Cancellation Policy',
      sections: [
        {
          heading: 'Overview',
          content: 'Since our products are digital downloads, all purchases are generally final.\n\nRefunds may only be considered if:\n• Duplicate payment occurred.\n• The purchased file cannot be downloaded due to our technical issue.\n• An incorrect product was delivered.',
        },
        {
          heading: 'Refund Process',
          content: 'Refund requests should be submitted within 7 days of purchase.\n\nApproved refunds will be processed to the original payment method.',
        },
      ],
    },
    'store-shipping': {
      title: 'Shipping & Delivery Policy',
      sections: [
        {
          heading: 'Digital Products',
          content: 'All products sold on Clutch Zone Store are digital products.\n\nNo physical shipping is involved.',
        },
        {
          heading: 'Delivery',
          content: 'After successful payment:\n• Purchased wallpapers become available in "My Library".\n• Users can download purchased wallpapers anytime from their account.\n\nIf downloads are unavailable due to technical issues, please contact our support team.',
        },
      ],
    },
    'store-disclaimer': {
      title: 'Disclaimer',
      sections: [
        {
          heading: 'Content Use',
          content: 'The wallpapers available on Clutch Zone Store are intended for personal use unless otherwise specified.\n\nUsers are responsible for ensuring that their use of purchased content complies with applicable laws and any accompanying license terms.\n\nClutch Zone Store is not responsible for misuse of downloaded content by users.',
        },
        {
          heading: 'Intellectual Property',
          content: 'All trademarks, logos, and brand names displayed on the website belong to their respective owners. Where applicable, such use is for identification or descriptive purposes only.',
        },
      ],
    },
    'store-license': {
      title: 'License Agreement',
      sections: [
        {
          heading: 'License Grant',
          content: 'By purchasing a wallpaper from Clutch Zone Store, you are granted a non-exclusive, non-transferable, revocable license to use the wallpaper for personal, non-commercial purposes only.',
        },
        {
          heading: 'Permitted Use',
          content: 'You may:\n• Download and use the wallpaper on your personal devices.\n• Store the wallpaper for personal backup purposes.\n• Use the wallpaper as your device background.',
        },
        {
          heading: 'Prohibited Use',
          content: 'You may not:\n• Modify, adapt, or translate the wallpaper.\n• Reverse engineer or disassemble the wallpaper.\n• Sell, rent, lease, or transfer the wallpaper.\n• Distribute the wallpaper to third parties.\n• Use the wallpaper for commercial purposes without explicit written permission.\n• Remove copyright notices or proprietary markings.',
        },
        {
          heading: 'Termination',
          content: 'This license is effective until terminated. Your rights under this license will terminate automatically without notice if you fail to comply with any terms of this agreement.',
        },
      ],
    },
    'store-dmca': {
      title: 'DMCA / Copyright Policy',
      sections: [
        {
          heading: 'Copyright Protection',
          content: 'Clutch Zone Store respects intellectual property rights. All wallpapers and content on our platform are protected by copyright law.',
        },
        {
          heading: 'DMCA Compliance',
          content: 'If you believe that any content on Clutch Zone Store infringes your copyright, you may submit a DMCA notice to our support team.',
        },
        {
          heading: 'Reporting Infringement',
          content: 'DMCA notices should include:\n• Your name and contact information.\n• Description of the copyrighted work.\n• Location of the infringing content on our site.\n• A statement that you have a good faith belief that the use is not authorized.\n• Your physical or electronic signature.',
        },
        {
          heading: 'Response',
          content: 'We will investigate all valid DMCA notices and take appropriate action, including removal of infringing content if warranted.',
        },
      ],
    },
  };

  const page_content = content[page];

  if (!page_content) {
    return (
      <div className="screen-home" style={{ paddingBottom: 24 }}>
        <div className="section">
          <h1 className="screen-title">Page not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">{page_content.title}</h1>
      </div>

      <div className="section">
        {page_content.sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            {section.heading && (
              <h3 style={{ color: '#F4F2EA', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>
                {section.heading}
              </h3>
            )}
            <p className="screen-sub" style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
