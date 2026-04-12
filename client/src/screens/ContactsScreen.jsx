export const ContactsScreen = () => {
  return (
    <div id="screen-contacts" className="screen-contacts">
      <div className="section">
        <div className="section-label">Contact Us</div>
        <div className="card">
          <p className="card-text">Need help or want to connect with Clutch Zone? Use the buttons below.</p>
          <div className="contact-row">
            <div>
              <div className="contact-label">WhatsApp</div>
              <div className="contact-value">+91 82610 47808</div>
            </div>
            <div className="contact-actions">
              <a className="contact-btn" href="https://wa.me/918261047808" target="_blank" rel="noreferrer">
                Message
              </a>
            </div>
          </div>
          <div className="contact-row">
            <div>
              <div className="contact-label">Instagram</div>
              <div className="contact-value">@clutch_zone_ff</div>
            </div>
            <div className="contact-actions">
              <a className="contact-btn" href="https://instagram.com/clutch_zone_ff" target="_blank" rel="noreferrer">
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
          <div className="contact-row">
            <div>
              <div className="contact-label">Telegram</div>
              <div className="contact-value">t.me/clutchzoneff</div>
            </div>
            <div className="contact-actions">
              <a className="contact-btn" href="https://t.me/clutchzoneff" target="_blank" rel="noreferrer">
                Open Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};