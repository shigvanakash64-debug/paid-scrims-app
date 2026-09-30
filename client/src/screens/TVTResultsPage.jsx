import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

export const TVTResultsPage = ({ tournamentId, onClose }) => {
  const [data, setData] = useState(null);
  const [selections, setSelections] = useState({});
  const [screenshots, setScreenshots] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingMatchId, setSubmittingMatchId] = useState(null);
  const [error, setError] = useState('');

  const loadMatches = async () => {
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/team-matches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load TVT matches');
      setData(result);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 10000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const submitResult = async (match) => {
    const outcome = selections[match.id];
    const screenshot = screenshots[match.id];
    if (!outcome) return;
    if (outcome === 'win' && !screenshot) {
      setError('Upload a screenshot to submit I WON.');
      return;
    }

    try {
      setSubmittingMatchId(match.id);
      setError('');
      const formData = new FormData();
      formData.append('outcome', outcome);
      if (screenshot) formData.append('screenshot', screenshot);
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/team-matches/${match.id}/result`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit result');
      setSelections((current) => ({ ...current, [match.id]: '' }));
      setScreenshots((current) => ({ ...current, [match.id]: null }));
      await loadMatches();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmittingMatchId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#0B0B0B] p-4 text-white" role="dialog" aria-modal="true" aria-labelledby="tvt-result-heading">
      <div className="mx-auto max-w-2xl space-y-5 pb-8 pt-3">
        <div className="flex items-start justify-between gap-4 border-b border-[#262626] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#FF6A00]">Team vs Team</p>
            <h1 id="tvt-result-heading" className="mt-1 text-2xl font-bold">TVT Result</h1>
            <p className="mt-1 text-sm text-[#A1A1A1]">{data?.tournament?.name || 'Tournament results'}</p>
            {data?.tournament && <p className="mt-1 text-xs text-[#737373]">{data.tournament.game} · {data.tournament.teamTournamentMode === 'bo3' ? 'Best of 3' : 'Knockout'}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#333333] px-3 py-2 text-sm text-[#D4D4D4] hover:text-white">Close</button>
        </div>

        {error && <div className="rounded-lg border border-[#EF4444] bg-[#1A0B0B] p-3 text-sm text-[#FCA5A5]" role="alert">{error}</div>}
        {loading ? (
          <div className="rounded-xl border border-[#252525] bg-[#111111] p-5 text-sm text-[#A1A1A1]">Loading team matches...</div>
        ) : data?.matches?.length ? (
          <div className="space-y-3">
            {data.matches.map((match) => {
              const isTeamA = match.teamA?.id === match.viewerParticipantId;
              const ownTeam = isTeamA ? match.teamA : match.teamB;
              const opponent = isTeamA ? match.teamB : match.teamA;
              const currentGame = match.gameResults.find((game) => game.gameNumber === match.currentGame);
              const myClaim = currentGame?.claims.find((claim) => claim.participantId === match.viewerParticipantId);
              const statusText = match.status === 'disputed'
                ? 'Waiting for host review'
                : match.status === 'completed'
                  ? 'Match complete'
                  : match.status === 'result_pending'
                    ? myClaim ? 'Waiting for opponent result' : 'Opponent submitted their result'
                    : match.status === 'pending' ? 'Waiting for the previous round' : 'Result needed';
              const canSubmit = ['active', 'result_pending'].includes(match.status) && !myClaim;

              return (
                <article key={match.id} className="space-y-4 rounded-xl border border-[#292929] bg-[#111111] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#FFB066]">{match.roundName} · {match.name}</p>
                      <h2 className="mt-2 text-lg font-semibold">{ownTeam?.name || 'Your team'} <span className="text-[#777777]">vs</span> {opponent?.name || 'TBD'}</h2>
                      {match.bestOf === 3 && <p className="mt-1 text-sm text-[#A1A1A1]">Game {match.currentGame} of 3 · Score {match.teamAWins}-{match.teamBWins}</p>}
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${match.status === 'disputed' ? 'border-[#F59E0B] text-[#F59E0B]' : match.status === 'completed' ? 'border-[#22C55E] text-[#22C55E]' : 'border-[#444444] text-[#C4C4C4]'}`}>{statusText}</span>
                  </div>

                  {match.gameResults.map((game) => (
                    <div key={game.gameNumber} className="space-y-2 rounded-lg border border-[#252525] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A1A1]">{match.bestOf === 3 ? `Game ${game.gameNumber}` : 'Result claims'}</p>
                      {game.claims.map((claim) => (
                        <div key={claim.userId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span>{claim.username} reported <b>{claim.outcome === 'win' ? 'I WON' : 'I LOST'}</b></span>
                          {claim.screenshotUrl && <a className="text-[#FFB066] underline" href={claim.screenshotUrl} target="_blank" rel="noreferrer">View screenshot</a>}
                        </div>
                      ))}
                    </div>
                  ))}

                  {canSubmit && (
                    <div className="space-y-3 border-t border-[#252525] pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setSelections((current) => ({ ...current, [match.id]: 'win' }))} className={`rounded-lg border px-4 py-3 font-semibold ${selections[match.id] === 'win' ? 'border-[#22C55E] bg-[#08200E] text-[#22C55E]' : 'border-[#333333] text-white'}`}>I WON</button>
                        <button type="button" onClick={() => setSelections((current) => ({ ...current, [match.id]: 'lose' }))} className={`rounded-lg border px-4 py-3 font-semibold ${selections[match.id] === 'lose' ? 'border-[#EF4444] bg-[#200A0A] text-[#EF4444]' : 'border-[#333333] text-white'}`}>I LOST</button>
                      </div>
                      {selections[match.id] === 'win' && (
                        <label className="block text-sm text-[#D4D4D4]">Screenshot proof (required)
                          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="mt-2 block w-full rounded-lg border border-[#333333] bg-[#0B0B0B] p-2 text-sm" onChange={(event) => setScreenshots((current) => ({ ...current, [match.id]: event.target.files?.[0] || null }))} />
                        </label>
                      )}
                      <button type="button" onClick={() => submitResult(match)} disabled={!selections[match.id] || submittingMatchId === match.id} className="w-full rounded-lg bg-[#FF6A00] px-4 py-3 font-semibold text-black disabled:opacity-50">
                        {submittingMatchId === match.id ? 'Submitting...' : 'Submit result'}
                      </button>
                    </div>
                  )}
                  {myClaim && match.status !== 'disputed' && <p className="text-sm text-[#A1A1A1]">Your result has been submitted. Waiting for the other team.</p>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[#252525] bg-[#111111] p-6 text-center">
            <h2 className="font-semibold">No TVT pairings yet</h2>
            <p className="mt-2 text-sm text-[#A1A1A1]">Your host will start the tournament bracket after registration closes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVTResultsPage;
