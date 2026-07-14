import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WallpaperCollectionScreen = ({ onScreenChange }) => {
  const [wallpapers, setWallpapers] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallpapers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/wallpapers`, { params: { search, category } });
        setWallpapers(response.data.wallpapers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadWallpapers();
  }, [search, category]);

  const categories = useMemo(() => ['Gaming', 'Anime', 'Nature', 'Minimal'], []);

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">Collection</h1>
        <p className="screen-sub">Search wallpapers and open details.</p>
      </div>

      <div className="section">
        <input className="auth-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wallpaper name" />
        <select className="auth-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginTop: 8 }}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="section">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : wallpapers.length === 0 ? (
          <div className="empty-state">
            <h3>No wallpapers found</h3>
            <p>Try another search term or category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {wallpapers.map((wallpaper) => (
              <div key={wallpaper._id} className="card" style={{ overflow: 'hidden' }}>
                <img src={wallpaper.previewImage} alt={wallpaper.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{wallpaper.title}</strong>
                    <span style={{ color: '#FF6A00' }}>₹{wallpaper.price}</span>
                  </div>
                  <p className="screen-sub" style={{ marginTop: 6 }}>{wallpaper.category}</p>
                  <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8 }}>
                    <button className="btn-primary" type="button" onClick={() => onScreenChange('wallpaper-details', wallpaper)}>View Details</button>
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
