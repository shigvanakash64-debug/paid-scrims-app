import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

export const WallpaperDetailScreen = ({ wallpaper, user, onScreenChange, onStartPurchase, onPurchaseSuccess }) => {
  const [detail, setDetail] = useState(wallpaper || null);
  const [loading, setLoading] = useState(!wallpaper);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  useEffect(() => {
    const loadCashfreeSdk = async () => {
      if (window.Cashfree || window.cashfree) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadCashfreeSdk();
  }, []);

  const handleBuyNow = async () => {
    if (!user) {
      onStartPurchase?.(detail);
      onScreenChange('login');
      return;
    }

    if (!detail?._id) {
      alert('Wallpaper is not ready to purchase');
      return;
    }

    if (checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(`${API_BASE}/wallpapers/payment/create-order`, {
        wallpaperId: detail._id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = response.data?.data || response.data;
      const paymentSessionId = payload?.paymentSessionId;
      const orderId = payload?.orderId;

      if (!paymentSessionId || !orderId) {
        throw new Error('Cashfree payment session could not be created');
      }

      const cashfreeFactory = typeof window.Cashfree === 'function'
        ? window.Cashfree
        : typeof window.cashfree === 'function'
          ? window.cashfree
          : null;

      if (!cashfreeFactory) {
        throw new Error('Cashfree checkout library is not loaded');
      }

      const sdkMode = payload?.environment === 'TEST' ? 'sandbox' : 'production';
      const checkoutOptions = {
        paymentSessionId,
        mode: sdkMode,
        orderId,
        orderAmount: String(Number(detail.price || payload.amount || 0)),
        orderCurrency: 'INR',
        returnUrl: payload.returnUrl || `${window.location.origin}/wallpaper`,
        redirectTarget: '_self',
      };

      const checkout = cashfreeFactory({ mode: sdkMode });
      const result = await checkout.checkout(checkoutOptions);

      if (result?.redirect) {
        return;
      }

      onPurchaseSuccess?.(detail);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message || 'Purchase failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !detail) {
    return <div className="loading-state">Loading wallpaper...</div>;
  }

  const wallpaperImage = detail.originalFile || detail.previewImage;

  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">{detail.title}</h1>
        <p className="screen-sub">{detail.description || 'A clean wallpaper for your desktop.'}</p>
      </div>

      <div className="section">
        <img
          src={wallpaperImage}
          alt={detail.title}
          style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 280, cursor: 'pointer' }}
          onClick={() => setPreviewOpen(true)}
        />
      </div>

      <div className="section">
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Category:</strong> {detail.category}</div>
            <div><strong>Resolution:</strong> {detail.resolution || 'Unknown'}</div>
            <div><strong>Price:</strong> ₹{detail.price}</div>
          </div>
          <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 12 }}>
            <button className="btn-primary" type="button" onClick={handleBuyNow} disabled={checkoutLoading}>
              {checkoutLoading ? 'Preparing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="wallpaper-lightbox-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="wallpaper-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={wallpaperImage}
              alt={detail.title}
              className="wallpaper-lightbox-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};
