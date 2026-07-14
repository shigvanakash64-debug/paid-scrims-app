import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

export const WallpaperDetailScreen = ({ wallpaper, user, onScreenChange, onStartPurchase, onPurchaseSuccess }) => {
  const [detail, setDetail] = useState(wallpaper || null);
  const [loading, setLoading] = useState(!wallpaper);

  useEffect(() => {
    if (wallpaper?._id) {
      setDetail(wallpaper);
      return;
    }

    const loadWallpaper = async () => {
      try {
        const response = await axios.get(`${API_BASE}/wallpapers/${window.location.pathname.split('/').pop()}`);
        setDetail(response.data.wallpaper);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadWallpaper();
  }, [wallpaper]);

  const handleBuyNow = async () => {
    if (!user) {
      onStartPurchase?.(detail);
      onScreenChange('login');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(`${API_BASE}/wallpapers/${detail._id}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        onPurchaseSuccess?.(detail);
        onScreenChange('wallpaper-library');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Purchase failed');
    }
  };

  if (loading || !detail) {
    return <div className="loading-state">Loading wallpaper...</div>;
  }

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">{detail.title}</h1>
        <p className="screen-sub">{detail.description || 'A clean wallpaper for your desktop.'}</p>
      </div>

      <div className="section">
        <img src={detail.previewImage} alt={detail.title} style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 280 }} />
      </div>

      <div className="section">
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Category:</strong> {detail.category}</div>
            <div><strong>Resolution:</strong> {detail.resolution || 'Unknown'}</div>
            <div><strong>Price:</strong> ₹{detail.price}</div>
          </div>
          <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 12 }}>
            <button className="btn-primary" type="button" onClick={handleBuyNow}>Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};
