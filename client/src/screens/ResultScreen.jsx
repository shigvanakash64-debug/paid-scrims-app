import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Timer } from '../components/Timer';
import { useMatch } from '../contexts/MatchContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const ResultScreen = ({ match, onScreenChange, onUserUpdate }) => {
  const { refreshMatch, clearMatch } = useMatch();
  const fileInputRef = useRef(null);
  const [winner, setWinner] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  const matchId = match?.id || match?._id;
  const playersLabel = match?.players?.map((player) => player?.username || player).join(' vs ') || 'Unknown players';
  const statusLabel = match?.status?.toUpperCase() || 'UNKNOWN';
  const canSubmitResult = ['ongoing', 'result_pending', 'disputed'].includes(match?.status);

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
    if (!matchId || !winner) {
      setError('Please choose whether you won or lost first.');
      return;
    }

    if (winner === 'win' && !selectedFile) {
      setError('Please upload your screenshot proof because you chose I WON.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('clutchzone_token');
      const formData = new FormData();
      formData.append('matchId', matchId);
      formData.append('winner', winner);
      if (selectedFile) {
        formData.append('screenshot', selectedFile);
      }

      const response = await axios.post(`${API_BASE}/match/submit-result`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        const status = response.data.matchStatus;
        if (status === 'result_pending') {
          setSubmittedMessage('Result submitted successfully. Conflicting winner claims are now under admin review.');
        } else if (status === 'disputed') {
          setSubmittedMessage('Result submitted successfully. The match has been marked for admin review.');
        } else {
          setSubmittedMessage('Result uploaded successfully. Wait for opponent confirmation.');
        }

        if (status === 'completed' && response.data.payoutInfo) {
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
        if (status === 'completed') {
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

  const resultDeadlineValue = match?.status === 'result_pending'
    ? (match?.resultDeadline || (match?.startedAt
      ? new Date(new Date(match.startedAt).getTime() + 5 * 60 * 1000)
      : null))
    : null;
  const resultDeadline = resultDeadlineValue ? new Date(resultDeadlineValue).toLocaleString() : null;

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
          <div className="screen-sub">{submittedMessage || 'Result uploaded successfully. Wait for opponent confirmation.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="screen-result" className="screen-result">
      <div className="hero">
        <div className="screen-title">SUBMIT RESULT</div>
        <div className="screen-sub">Choose your result first. Screenshot proof is required only when you claim I WON.</div>
      </div>

      {!canSubmitResult && (
        <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-4 text-sm text-[#FDE68A]">
          Result submission is locked until the match status becomes ONGOING. Please wait for the room to start before uploading your proof.
        </div>
      )}

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
            <span className="text-[#FFFFFF] font-semibold">Match details:</span> {match?.mode} - {match?.type}
          </div>
          <div>
            <span className="text-[#FFFFFF] font-semibold">Entry fee:</span> ₹{match?.entry}
          </div>
          <div>
            <span className="text-[#FFFFFF] font-semibold">Players:</span> {playersLabel}
          </div>
          {resultDeadline && (
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-3">
              <div className="text-xs uppercase tracking-[0.22em] text-[#A1A1A1]">Result deadline</div>
              <div className="mt-2 text-sm text-[#E5E7EB]">{resultDeadline}</div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Live countdown</div>
                  <div className="mt-1 text-xs text-[#FDE68A]">Auto-resolution starts after the timer ends if no final result is confirmed.</div>
                </div>
                <Timer
                  deadline={resultDeadlineValue}
                  onExpire={() => refreshMatch(matchId)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section mt-6">
        <div className="section-label">Select Outcome</div>
        <div className="winner-sel">
          <button
            type="button"
            className={`winner-btn ${winner === 'win' ? 'active' : ''}`}
            onClick={() => setWinner('win')}
          >
            I WON
          </button>
          <button
            type="button"
            className={`winner-btn lose ${winner === 'lose' ? 'active' : ''}`}
            onClick={() => setWinner('lose')}
          >
            I LOST
          </button>
        </div>
      </div>

      {winner === 'win' && (
        <>
          <div
            className="upload-zone mt-4"
            role="button"
            tabIndex={canSubmitResult ? 0 : -1}
            onClick={canSubmitResult ? handleChooseFile : undefined}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="upload-icon">+</div>
            <div className="upload-label">Upload Winner Screenshot</div>
            <div className="upload-sub">
              {selectedFile ? selectedFile.name : 'Required proof for your win claim'}
            </div>
          </div>

          {previewUrl && (
            <div className="rounded-3xl border border-[#1F1F1F] bg-[#0B0B0B] p-3 mt-4">
              <img src={previewUrl} alt="Selected screenshot preview" className="w-full rounded-xl object-cover" />
            </div>
          )}
        </>
      )}

      {error && <div className="mt-4 text-sm text-[#EF4444]">{error}</div>}

      <div className="btn-cta-wrap">
        <button
          type="button"
          className="btn-primary"
          disabled={!canSubmitResult || !winner || (winner === 'win' && !selectedFile) || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
};



