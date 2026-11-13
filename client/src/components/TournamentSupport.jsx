import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const ISSUE_CATEGORIES = [
  'Cheating / Hacking',
  'Abusive Behaviour',
  'Teaming / Unfair Play',
  'Wrong Result / Score Manipulation',
  'Fake Screenshot / Evidence',
  'Host Misconduct',
  'Room ID / Password Issue',
  'Other Tournament Issue',
];

const getErrorMessage = (data, fallback) => data?.error || fallback;

export const TournamentSupport = ({ tournament, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [support, setSupport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingContact, setConfirmingContact] = useState(false);
  const [checkingEscalation, setCheckingEscalation] = useState(false);
  const [issueCategory, setIssueCategory] = useState(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [countdownMs, setCountdownMs] = useState(null);
  const [showEscalationReminder, setShowEscalationReminder] = useState(false);
  const eligibilityCheckStarted = useRef(false);
  const report = support?.report;

  const loadSupport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/support`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to load tournament support'));
      setSupport(data);
      setCountdownMs(data.report?.remainingMs ?? null);
      setError('');
      return data;
    } finally {
      setLoading(false);
    }
  }, [tournament._id]);

  useEffect(() => {
    if (!isOpen || !report?.hostContactConfirmedAt || report.escalationAvailable || countdownMs !== 0) return undefined;
    if (eligibilityCheckStarted.current) return undefined;
    eligibilityCheckStarted.current = true;
    loadSupport().catch((loadError) => setError(loadError.message));
    return undefined;
  }, [countdownMs, isOpen, loadSupport, report?._id, report?.hostContactConfirmedAt, report?.escalationAvailable]);

  useEffect(() => {
    if (!isOpen || !report?.hostContactConfirmedAt || report.escalationAvailable) return undefined;
    const intervalId = setInterval(() => {
      setCountdownMs((current) => current === null ? null : Math.max(0, current - 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isOpen, report]);

  const openSupport = async () => {
    setIsOpen(true);
    setError('');
    try {
      await loadSupport();
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setError('');
    if (!description.trim()) {
      setError('Describe the issue before submitting your report.');
      return;
    }
    if (description.trim().length > 2000) {
      setError('Issue description cannot exceed 2000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueCategory, description: description.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to submit your report'));
      setDescription('');
      await loadSupport();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmHostContact = async () => {
    const reportId = support?.report?._id;
    if (!reportId) return;
    setConfirmingContact(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/reports/${reportId}/host-contact`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to confirm host contact'));
      await loadSupport();
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setConfirmingContact(false);
    }
  };

  const prepareEscalation = async () => {
    setCheckingEscalation(true);
    setError('');
    try {
      const data = await loadSupport();
      if (!data.report?.escalationAvailable) {
        setError('Clutch Zone escalation is available only after six hours have passed since host contact was confirmed.');
        return;
      }
      setShowEscalationReminder(true);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setCheckingEscalation(false);
    }
  };

  const refreshEscalationStatus = async () => {
    setCheckingEscalation(true);
    setError('');
    try {
      await loadSupport();
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setCheckingEscalation(false);
    }
  };

  const hostInstagramUsername = support?.tournament?.hostInstagramUsername || '';
  const hostInstagramUrl = hostInstagramUsername
    ? `https://www.instagram.com/${encodeURIComponent(hostInstagramUsername)}/`
    : '';
  const timeParts = Math.ceil(Math.max(0, countdownMs || 0) / 1000);
  const countdown = `${String(Math.floor(timeParts / 3600)).padStart(2, '0')}:${String(Math.floor((timeParts % 3600) / 60)).padStart(2, '0')}:${String(timeParts % 60).padStart(2, '0')}`;

  return (
    <>
      <button type="button" className="btn btn-sm btn-secondary" onClick={openSupport}>
        Report an Issue / Tournament Support
      </button>

      {isOpen && (
        <div className="tournament-support-dialog fixed inset-0 z-[110] overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby={`tournament-support-title-${tournament._id}`}>
          <div className="mx-auto my-6 w-full max-w-xl min-w-0 rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`tournament-support-title-${tournament._id}`} className="text-xl font-semibold">Tournament Support</h2>
                <p className="mt-1 text-sm text-[#A1A1A1]">{support?.tournament?.name || tournament.name}</p>
              </div>
              <button type="button" className="text-2xl leading-none text-[#A1A1A1] hover:text-white" aria-label="Close tournament support" onClick={() => { setIsOpen(false); setShowEscalationReminder(false); }}>×</button>
            </div>

            {loading && !support ? (
              <p className="mt-5 text-sm text-[#A1A1A1]" role="status">Loading tournament support…</p>
            ) : !support ? (
              <p className="mt-5 text-sm text-[#A1A1A1]">Tournament support details could not be loaded. Please try again.</p>
            ) : (
              <>
                <section className="mt-5 rounded-lg border border-[#3A2414] bg-[#17110C] p-4">
                  <h3 className="font-semibold text-[#FFB066]">Contact the tournament host first</h3>
                  {hostInstagramUsername ? (
                    <>
                      <p className="mt-2 break-all text-sm text-[#E5E5E5]">Host Instagram: <b>@{hostInstagramUsername}</b></p>
                      <a className="tournament-support-host-link btn btn-sm btn-primary mt-3" href={hostInstagramUrl} target="_blank" rel="noopener noreferrer">
                        Contact Tournament Host on Instagram
                      </a>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[#FCA5A5]">This older tournament does not have a saved host Instagram username. Contact the host using the contact details already provided for the tournament.</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-[#D4D4D4]">
                    Facing cheating, hacking, abusive behaviour or another tournament issue? Contact your tournament host first. For cheating or hacking complaints, take screenshots or record a video and send the evidence directly to the host through Instagram DM.
                  </p>
                </section>

                {report ? (
                  <section className="mt-4 rounded-lg border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                    <h3 className="font-semibold text-white">Your issue report</h3>
                    <p className="mt-3 text-sm text-[#FFB066]">{report.issueCategory}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#D4D4D4]">{report.description}</p>

                    {!report.hostContactConfirmedAt ? (
                      <div className="mt-4 border-t border-[#242424] pt-4">
                        <p className="text-sm text-[#A1A1A1]">After contacting the host, confirm below. You can escalate to Clutch Zone if the issue has not been resolved within six hours.</p>
                        <button type="button" className="btn btn-sm btn-primary mt-3" onClick={confirmHostContact} disabled={confirmingContact}>
                          {confirmingContact ? 'Saving confirmation…' : 'I have contacted the tournament host.'}
                        </button>
                      </div>
                    ) : report.escalationAvailable ? (
                      <div className="mt-4 border-t border-[#242424] pt-4">
                        <p className="font-semibold text-[#FFB066]">Still not resolved? Escalate to Clutch Zone.</p>
                        <button type="button" className="btn btn-sm btn-primary mt-3" onClick={prepareEscalation} disabled={checkingEscalation}>
                          {checkingEscalation ? 'Checking eligibility…' : 'Report to Clutch Zone on Instagram'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 border-t border-[#242424] pt-4">
                        <p className="text-sm text-[#A1A1A1]">Your six-hour waiting period started when you confirmed host contact. If the host has not resolved the issue after the wait, you can escalate to Clutch Zone.</p>
                        <p className="mt-3 font-mono text-lg font-semibold text-[#FFB066]" role="timer" aria-label="Time remaining before Clutch Zone escalation">{countdown}</p>
                        {countdownMs === 0 && (
                          <button type="button" className="btn btn-sm btn-secondary mt-3" onClick={refreshEscalationStatus} disabled={checkingEscalation}>
                            {checkingEscalation ? 'Checking eligibility…' : 'Check escalation status'}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                ) : (
                  <form className="mt-4 space-y-3 rounded-lg border border-[#2A2A2A] bg-[#0B0B0B] p-4" onSubmit={submitReport}>
                    <h3 className="font-semibold text-white">Report an Issue</h3>
                    <p className="text-sm text-[#A1A1A1]">Submit one text-only report for this tournament. Screenshots and videos are not uploaded or stored here; send any evidence directly to the host through Instagram DM.</p>
                    <label className="block text-sm text-[#D4D4D4]">
                      Issue category
                      <select className="auth-input mt-2 w-full" value={issueCategory} onChange={(event) => setIssueCategory(event.target.value)} required>
                        {ISSUE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm text-[#D4D4D4]">
                      Description
                      <textarea className="auth-input mt-2 min-h-28 w-full" value={description} onChange={(event) => setDescription(event.target.value.slice(0, 2000))} maxLength={2000} required placeholder="Describe what happened" />
                      <span className="mt-1 block text-right text-xs text-[#737373]">{description.length}/2000</span>
                    </label>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !description.trim()}>
                      {submitting ? 'Submitting…' : 'Submit issue report'}
                    </button>
                  </form>
                )}
              </>
            )}

            {error && <p className="mt-4 text-sm text-[#FCA5A5]" role="alert">{error}</p>}

            {showEscalationReminder && report && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby={`escalation-reminder-title-${tournament._id}`}>
                <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#3A2414] bg-[#15110D] p-5">
                  <h3 id={`escalation-reminder-title-${tournament._id}`} className="text-lg font-semibold text-[#FFB066]">Before contacting Clutch Zone</h3>
                  <p className="mt-2 text-sm text-[#D4D4D4]">Include these details in your Instagram DM so the issue can be reviewed:</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#E5E5E5]">
                    <li>Tournament ID: {tournament._id}</li>
                    <li>Tournament name: {support?.tournament?.name || tournament.name}</li>
                    <li>Your Clutch Zone username: {user?.username || 'Unknown'}</li>
                    <li>Host Instagram username: {hostInstagramUsername ? `@${hostInstagramUsername}` : 'Not available for this older tournament'}</li>
                    <li>Original complaint: {report.description}</li>
                    <li>Screenshots or video evidence, if available</li>
                    <li>Confirmation that you contacted the host at least six hours earlier ({new Date(report.hostContactConfirmedAt).toLocaleString()})</li>
                  </ul>
                  <p className="mt-3 text-sm text-[#A1A1A1]">Evidence is sent directly through Instagram DM and is not uploaded to Clutch Zone.</p>
                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowEscalationReminder(false)}>Back</button>
                    <a className="tournament-support-escalation-link btn btn-sm btn-primary" href="https://www.instagram.com/clutchzone_official_/" target="_blank" rel="noopener noreferrer">
                      Continue to Clutch Zone Instagram
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TournamentSupport;
