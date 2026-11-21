export const ContactsScreen = ({ onNavigate }) => {
  return (
    <div id="screen-contacts" className="screen-contacts">
      <div className="section">
        <div className="section-label">Contact Us</div>
        <div className="card">
          <p className="card-text"><strong>Clutch Zone</strong></p>
          <p className="card-text">Operated by: Akash Dinesh Shigvan</p>
          <p className="card-text">GSTIN: 27SQJPS2378E1Z0</p>
          <p className="card-text">Website: <a className="contact-inline-link" href="https://www.clutchzone.in">https://www.clutchzone.in</a></p>

          <div className="contact-section">
            <h3 className="contact-section-title">General and account support</h3>
            <div className="contact-row">
              <div>
                <div className="contact-label">Support Email</div>
                <div className="contact-value">supportclutchzone@gmail.com</div>
              </div>
              <div className="contact-actions"><a className="contact-btn" href="mailto:supportclutchzone@gmail.com">Send Email</a></div>
            </div>
          </div>

          {[
            ['Payment complaints', 'Payments, deposits, duplicates or withdrawal status. Include the order ID or withdrawal reference.'],
            ['Tournament complaints', 'Registrations, cancellations, lobby details, results or prize eligibility. Include the match or tournament ID.'],
            ['Privacy concerns', 'Access, correction or deletion requests. Include your account identifier and the relevant information.'],
            ['Host enquiries', 'Published tournament, room, participant or evidence questions. Include the tournament ID.'],
            ['Legal and compliance enquiries', 'Policy, regulatory or notice questions. Do not send passwords or payment secrets.'],
          ].map(([title, description]) => (
            <div className="contact-section" key={title}>
              <h3 className="contact-section-title">{title}</h3>
              <p className="card-text">{description}</p>
            </div>
          ))}

          <div className="contact-section">
            <h3 className="contact-section-title">Grievance Redressal</h3>
            <p className="card-text">
              Use the grievance process for unresolved account, payment, tournament, refund, fairness or privacy complaints.
            </p>
            <div className="contact-actions">
              <button type="button" className="contact-btn" onClick={() => onNavigate?.('grievanceredressal')}>
                Open Grievance Policy
              </button>
            </div>
          </div>

          <div className="contact-section">
            <h3 className="contact-section-title">Grievance officer</h3>
            <p className="card-text">Name, designation and direct contact details are pending publication by the actual appointed officer. Until then, submit complaints to supportclutchzone@gmail.com.</p>
          </div>

          <div className="contact-section">
            <h3 className="contact-section-title">Community</h3>
            <div className="contact-row">
              <div>
                <div className="contact-label">Instagram</div>
                <div className="contact-value">@clutch_zoneofficial</div>
              </div>
              <div className="contact-actions">
                <a className="contact-btn" href="https://www.instagram.com/clutch_zoneofficial/" target="_blank" rel="noreferrer">
                  Open Instagram
                </a>
              </div>
            </div>
            <div className="contact-row">
              <div>
                <div className="contact-label">Discord</div>
                <div className="contact-value">discord.gg/7RnDzZknpV</div>
              </div>
              <div className="contact-actions">
                <a className="contact-btn" href="https://discord.gg/7RnDzZknpV" target="_blank" rel="noreferrer">
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};