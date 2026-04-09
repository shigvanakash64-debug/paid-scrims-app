import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useMatch } from '../contexts/MatchContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const ResultScreen = ({ match, onScreenChange, onUserUpdate }) => {
  const { refreshMatch, clearMatch } = useMatch();
  const fileInputRef = useRef(null);
  const [winner, setWinner] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const matchId = match?.id || match?._id;
  const playersLabel = match?.players?.map((player) => player?.username || player).join(' vs ') || 'Unknown players';
  const statusLabel = match?.status?.toUpperCase() || 'UNKNOWN';

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted. Please upload a screenshot.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!matchId || !selectedFile || !winner) {
      setError('Please select a result and upload your screenshot first.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('clutchzone_token');
      const formData = new FormData();
      formData.append('matchId', matchId);
      formData.append('winner', winner);
      formData.append('screenshot', selectedFile);

      const response = await axios.post(`${API_BASE}/match/submit-result`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        if (response.data.matchStatus === 'completed' && response.data.payoutInfo) {
          try {
            const token = localStorage.getItem('clutchzone_token');
            const meResponse = await axios.get(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (onUserUpdate) onUserUpdate(meResponse.data.user);
          } catch (refreshError) {
            console.error('Failed to refresh user after payout', refreshError);
          }
        }
        await refreshMatch(matchId);
        if (response.data.matchStatus === 'completed') {
          clearMatch();
          setSubmitted(true);
          setTimeout(() => {
            onScreenChange('home');
          }, 1200);
        } else {
          setSubmitted(true);
        }
      } else {
        setError(response.data?.error || 'Unable to submit result.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultDeadline = match?.resultDeadline ? new Date(match.resultDeadline).toLocaleString() : null;

  if (!match) {
    return (
      <div id="screen-result" className="screen-result">
        <div className="hero">
          <div className="screen-title">SUBMIT RESULT</div>
          <div className="screen-sub">No active match available</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div id="screen-result" className="screen-result">
        <div className="hero">
          <div className="screen-title">SUBMITTED</div>
          <div className="screen-sub">Result uploaded successfully. Wait for opponent confirmation.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="screen-result" className="screen-result">
      <div className="hero">
        <div className="screen-title">SUBMIT RESULT</div>
        <div className="screen-sub">Upload proof within 15 minutes</div>
      </div>

      <div className="result-match-card rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#A1A1A1]">Match ID</div>
            <div className="mt-2 text-sm text-[#FFFFFF] font-semibold">#{matchId}</div>
          </div>
          <span className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs text-[#A1A1A1]">{statusLabel}</span>
        </div>
        <div className="space-y-3 text-sm text-[#E5E7EB]">
          <div>
            <span className="text-[#FFFFFF] font-semibold">Match details:</span> {match?.mode} · {match?.type}
          </div>
          <div>
            <span className="text-[#FFFFFF] font-semibold">Entry fee:</span> ₹{match?.entry}
          </div>
          <div>
            <span className="text-[#FFFFFF] font-semibold">Players:</span> {playersLabel}
          </div>
          {resultDeadline && (
            <div>
              <span className="text-[#FFFFFF] font-semibold">Result deadline:</span> {resultDeadline}
            </div>
          )}
        </div>
      </div>

      <div className="upload-zone" role="button" tabIndex={0} onClick={handleChooseFile}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <div className="upload-icon">📸</div>
        <div className="upload-label">Upload Screenshot</div>
        <div className="upload-sub">
          {selectedFile ? selectedFile.name : 'Tap to upload match result'}
        </div>
      </div>

      {previewUrl && (
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-3 mt-4">
          <img src={previewUrl} alt="Selected screenshot preview" className="w-full rounded-xl object-cover" />
        </div>
      )}

      <div className="section mt-6">
        <div className="section-label">Select Outcome</div>
        <div className="winner-sel">
          <button
            type="button"
            className={`winner-btn ${winner === 'win' ? 'active' : ''}`}
            onClick={() => setWinner('win')}
          >
            ✓ I WON
          </button>
          <button
            type="button"
            className={`winner-btn lose ${winner === 'lose' ? 'active' : ''}`}
            onClick={() => setWinner('lose')}
          >
            ✗ I LOST
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-[#EF4444]">{error}</div>}

      <div className="btn-cta-wrap">
        <button
          type="button"
          className="btn-primary"
          disabled={!winner || !selectedFile || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
};
