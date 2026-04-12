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
          <div className="contact-row">
            <div className="contact-label">Discord</div>
            <div className="contact-value">
              <a href="https://discord.gg/7RnDzZknpV" target="_blank" rel="noreferrer">
                discord.gg/7RnDzZknpV
              </a>
            </div>
          </div>
          <div className="contact-row">
            <div className="contact-label">Telegram</div>
            <div className="contact-value">
              <a href="https://t.me/clutchzoneff" target="_blank" rel="noreferrer">
                t.me/clutchzoneff
              </a>
            </div>
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
            <li>Share your Discord invite and Telegram channel for community trust.</li>
            <li>Show real match history, payouts, and refund policy clearly.</li>
            <li>Use easy payment links like UPI / Google Pay, and support secure transactions.</li>
          </ul>
          <p className="card-text">
            Discord and Telegram are great for building a community, hosting announcements, and answering player questions fast.
          </p>
        </div>
      </div>
    </div>
  );
};
