import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

export const WallpaperLibraryScreen = ({ user, onScreenChange }) => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLibrary = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await axios.get(`${API_BASE}/wallpapers/me/library`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWallpapers(response.data.wallpapers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, [user]);

  const downloadWallpaper = (item) => {
    const source = item.wallpaperId?.originalFile || item.originalFile || item.previewImage;
    const link = document.createElement('a');
    link.href = source;
    link.download = `${(item.wallpaperId?.title || item.title || 'wallpaper').replace(/\s+/g, '-')}.jpg`;
    link.click();
  };

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">My Library</h1>
        <p className="screen-sub">Access every wallpaper you have purchased.</p>
      </div>

      <div className="section">
        {loading ? (
          <div className="loading-state">Loading library...</div>
        ) : !user ? (
          <div className="empty-state">
            <h3>Please sign in</h3>
            <p>You need an account to view your purchased wallpapers.</p>
          </div>
        ) : wallpapers.length === 0 ? (
          <div className="empty-state">
            <h3>No wallpapers yet</h3>
            <p>Buy wallpapers from the collection to start building your library.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {wallpapers.map((item) => (
              <div key={item._id || item.wallpaperId?._id} className="card" style={{ overflow: 'hidden' }}>
                <img src={item.previewImage || item.wallpaperId?.previewImage} alt={item.title || item.wallpaperId?.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{item.title || item.wallpaperId?.title}</strong>
                    <span style={{ color: '#FF6A00' }}>₹{item.price || item.wallpaperId?.price}</span>
                  </div>
                  <p className="screen-sub" style={{ marginTop: 6 }}>{item.category || item.wallpaperId?.category}</p>
                  <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8 }}>
                    <button className="btn-primary" type="button" onClick={() => downloadWallpaper(item)}>Download</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
