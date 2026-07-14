import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

const initialForm = {
  title: '',
  description: '',
  category: 'Gaming',
  price: '',
  resolution: '',
  previewImage: '',
  originalFile: '',
};

export const WallpaperAdminScreen = () => {
  const [form, setForm] = useState(initialForm);
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWallpapers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/wallpapers`);
      setWallpapers(response.data.wallpapers || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallpapers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await axios.post(`${API_BASE}/wallpapers`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(initialForm);
      await loadWallpapers();
      alert('Wallpaper uploaded');
    } catch (error) {
      alert(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await axios.delete(`${API_BASE}/wallpapers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadWallpapers();
    } catch (error) {
      alert(error.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">Wallpaper Manager</h1>
        <p className="screen-sub">Upload, view, and remove wallpapers.</p>
      </div>

      <div className="section">
        <form className="auth-form" onSubmit={handleSubmit}>
          <input className="auth-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
          <textarea className="auth-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows="3" />
          <input className="auth-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" required />
          <input className="auth-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" required />
          <input className="auth-input" value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} placeholder="Resolution" />
          <input className="auth-input" value={form.previewImage} onChange={(e) => setForm({ ...form, previewImage: e.target.value })} placeholder="Preview Image URL" required />
          <input className="auth-input" value={form.originalFile} onChange={(e) => setForm({ ...form, originalFile: e.target.value })} placeholder="Original Wallpaper URL" required />
          <button className="btn-primary" type="submit">Upload Wallpaper</button>
        </form>
      </div>

      <div className="section">
        <div className="section-label">Uploaded wallpapers</div>
        {loading ? <div className="loading-state">Loading...</div> : wallpapers.length === 0 ? <div className="empty-state"><h3>No wallpapers</h3></div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {wallpapers.map((wallpaper) => (
              <div key={wallpaper._id} className="card" style={{ overflow: 'hidden' }}>
                <img src={wallpaper.previewImage} alt={wallpaper.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                <div style={{ padding: 12 }}>
                  <strong>{wallpaper.title}</strong>
                  <p className="screen-sub" style={{ marginTop: 6 }}>{wallpaper.category}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-outline" type="button" onClick={() => handleDelete(wallpaper._id)} style={{ width: 'auto', padding: '10px 12px' }}>Delete</button>
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
