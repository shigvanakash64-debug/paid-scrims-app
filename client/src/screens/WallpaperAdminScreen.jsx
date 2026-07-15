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
};

export const WallpaperAdminScreen = () => {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
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
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('resolution', form.resolution);
      if (file) formData.append('file', file);

      await axios.post(`${API_BASE}/wallpapers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(initialForm);
      setFile(null);
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
          <label style={{ color: '#fff', marginBottom: 8 }}>Upload Image (PNG/JPG/WebP)</label>
          <input className="auth-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
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
