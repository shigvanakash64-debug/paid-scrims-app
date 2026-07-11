export const ContactsScreen = () => {
  return (
    <div id="screen-contacts" className="screen-contacts">
      <div className="section">
        <div className="section-label">Contact Us</div>
        <div className="card">
          <p className="card-text">Need help? Our support team is here to assist you.</p>
          <p className="card-text">
            If you have questions regarding payments, withdrawals, matches, account issues, or technical problems, you can contact us through the following channels.
          </p>

          <div className="contact-section">
            <h3 className="contact-section-title">Customer Support</h3>
            <div className="contact-row">
              <div>
                <div className="contact-label">Email</div>
                <div className="contact-value">supportclutchzone@gmail.com</div>
                <div className="contact-meta">Response Time: Within 24–48 hours.</div>
              </div>
              <div className="contact-actions">
                <a className="contact-btn" href="mailto:supportclutchzone@gmail.com">
                  Send Email
                </a>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3 className="contact-section-title">WhatsApp Support</h3>
            <div className="contact-row">
              <div>
                <div className="contact-label">Phone</div>
                <div className="contact-value">+91 82610 47808</div>
                <div className="contact-meta">Available for general support and urgent assistance.</div>
              </div>
              <div className="contact-actions">
                <a className="contact-btn" href="https://wa.me/918261047808" target="_blank" rel="noreferrer">
                  Message
                </a>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3 className="contact-section-title">Community</h3>
            <div className="contact-row">
              <div>
                <div className="contact-label">Instagram</div>
                <div className="contact-value">@clutchzone.in_</div>
              </div>
              <div className="contact-actions">
                <a className="contact-btn" href="https://instagram.com/clutchzone.in_" target="_blank" rel="noreferrer">
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