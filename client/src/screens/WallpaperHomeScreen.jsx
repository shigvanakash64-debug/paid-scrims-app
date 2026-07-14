import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WallpaperHomeScreen = ({ user, onScreenChange, onOpenConfirmExit }) => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallpapers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/wallpapers`);
        setWallpapers((response.data.wallpapers || []).slice(0, 4));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadWallpapers();
  }, []);

  const featured = useMemo(() => wallpapers.slice(0, 3), [wallpapers]);

  return (
    <div className="screen-home" style={{ paddingBottom: 20 }}>
      <div className="section hero">
        <div className="game-pill"><span className="game-dot" /> <span>Digital Wallpaper Store</span></div>
        <h1 className="screen-title">Fresh wallpapers for your setup</h1>
        <p className="screen-sub">A simple storefront built on top of Clutch Zone. Browse, buy, and download premium wallpapers.</p>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div className="section-label">Featured wallpapers</div>
        {loading ? (
          <div className="loading-state">Loading wallpapers...</div>
        ) : featured.length === 0 ? (
          <div className="empty-state">
            <h3>No wallpapers yet</h3>
            <p>Upload wallpapers from the admin panel to start the store.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {featured.map((wallpaper) => (
              <div key={wallpaper._id} className="card" style={{ overflow: 'hidden' }}>
                <img src={wallpaper.previewImage} alt={wallpaper.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{wallpaper.title}</strong>
                    <span style={{ color: '#FF6A00' }}>₹{wallpaper.price}</span>
                  </div>
                  <p className="screen-sub" style={{ marginTop: 6 }}>{wallpaper.category}</p>
                  <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 10 }}>
                    <button className="btn-primary" type="button" onClick={() => onScreenChange('wallpaper-collection')}>Browse Collection</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-label">Categories</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {['Anime', 'Gaming', 'Nature', 'Minimal'].map((item) => (
            <button key={item} className="btn-outline" type="button" onClick={() => onScreenChange('wallpaper-collection')} style={{ width: '100%', textTransform: 'none' }}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Quick access</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="btn-primary" type="button" onClick={() => onScreenChange('wallpaper-collection')}>View All Wallpapers</button>
          {user ? (
            <button className="btn-outline" type="button" onClick={() => onScreenChange('wallpaper-library')}>My Library</button>
          ) : (
            <button className="btn-outline" type="button" onClick={() => onScreenChange('wallpaper-collection')}>Login to Purchase</button>
          )}
        </div>
      </div>
    </div>
  );
};
