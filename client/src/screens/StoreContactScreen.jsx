export const StoreContactScreen = () => {
  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">Contact Us</h1>
        <p className="screen-sub">Need help? We're here to assist you.</p>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ color: '#FF6A00', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Business Details</h3>
          <div className="screen-sub" style={{ marginTop: 0, display: 'grid', gap: 10 }}>
            <div><strong>Business Name</strong><br />Clutch Zone</div>
            <div><strong>GSTIN</strong><br />27SQJPS2378E1Z0</div>
            <div>
              <strong>Business Email</strong><br />
              <a href="mailto:support@clutchzone.in" style={{ color: '#FF6A00' }}>support@clutchzone.in</a> <span style={{ color: '#F4F2EA' }}>(preferred)</span>
            </div>
            <div><strong>Support Hours</strong><br />Monday - Saturday<br />10:00 AM - 7:00 PM IST</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ color: '#FF6A00', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>How We Can Help</h3>
          <ul style={{ marginLeft: 16, color: '#F4F2EA' }}>
            <li>Purchase issues</li>
            <li>Download problems</li>
            <li>Refund requests</li>
            <li>Account assistance</li>
            <li>General inquiries</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
