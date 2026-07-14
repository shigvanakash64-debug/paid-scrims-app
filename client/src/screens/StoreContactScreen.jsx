export const StoreContactScreen = () => {
  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">Contact Us</h1>
        <p className="screen-sub">Need help? We're here to assist you.</p>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ color: '#F4F2EA', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>How We Can Help</h3>
          <p className="screen-sub" style={{ marginTop: 0 }}>
            You can contact us for:
          </p>
          <ul style={{ marginLeft: 16, color: '#F4F2EA' }}>
            <li>Purchase issues</li>
            <li>Download problems</li>
            <li>Refund requests</li>
            <li>Account assistance</li>
            <li>General inquiries</li>
          </ul>
        </div>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ color: '#FF6A00', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Email Support</h3>
          <p className="screen-sub" style={{ marginTop: 0 }}>
            <strong>supportclutchzone@gmail.com</strong>
          </p>
          <p className="screen-sub" style={{ marginTop: 8 }}>
            Typically responds within 24–48 business hours.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16, border: '1px solid #FF6A00' }}>
          <h3 style={{ color: '#F4F2EA', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Response Time</h3>
          <p className="screen-sub" style={{ marginTop: 0 }}>
            We strive to respond to all inquiries within 24–48 business hours.
          </p>
        </div>
      </div>
    </div>
  );
};
