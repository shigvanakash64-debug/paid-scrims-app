export const ContactsScreen = () => {
  return (
    <div id="screen-contacts" className="screen-contacts">
      <div className="section">
        <div className="section-label">Contact Us</div>
        <div className="card">
          <p className="card-text">Need help or want to connect with Clutch Zone? Use the info below.</p>
          <div className="contact-row">
            <div className="contact-label">WhatsApp</div>
            <div className="contact-value">+91 82610 47808</div>
          </div>
          <div className="contact-row">
            <div className="contact-label">Instagram</div>
            <div className="contact-value">@clutch_zone_ff</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Build trust on Clutch Zone</div>
        <div className="card">
          <p className="card-text">
            To help users trust your platform, keep your contact info visible, share match results openly, and
            offer fast dispute support.
          </p>
          <ul className="simple-list">
            <li>Keep your WhatsApp and Instagram active for quick support.</li>
            <li>Show real match history, payouts, and refund policy clearly.</li>
            <li>Use easy payment links like UPI / Google Pay, and support secure transactions.</li>
          </ul>
          <p className="card-text">
            You can also add a presence on Telegram or Discord for community support, but WhatsApp and Instagram are great
            starting platforms for direct player communication.
          </p>
        </div>
      </div>
    </div>
  );
};
