import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

const MatchContext = createContext();

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};

export const MatchProvider = ({ children }) => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [matchPolling, setMatchPolling] = useState(false);
  const [lastMatchUpdate, setLastMatchUpdate] = useState(null);
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);
  const refreshInFlightRef = useRef(false);

  // Polling interval for active matches with a lighter backend footprint.
  const POLLING_INTERVAL = 120000;

  useEffect(() => {
    const storedMatch = localStorage.getItem('clutchzone_currentMatch');
    if (storedMatch) {
      try {
        const parsedMatch = JSON.parse(storedMatch);
        const inactiveStatuses = ['completed', 'cancelled', 'disputed'];
        if (parsedMatch && inactiveStatuses.includes(parsedMatch.status)) {
          localStorage.removeItem('clutchzone_currentMatch');
          localStorage.removeItem('clutchzone_currentMatchId');
          return;
        }
        setCurrentMatch(parsedMatch);
        setPreviousPlayerCount(parsedMatch?.players?.length || 0);
        if (parsedMatch) {
          setMatchPolling(true);
        }
      } catch (error) {
        console.error('Failed to restore currentMatch from storage:', error);
      }
    }
  }, []);

  // Send desktop notification
  const sendNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        badge: '/favicon.png',
        ...options,
      });
    }
  }, []);

  // Force refresh match data
  const refreshMatch = useCallback(async (matchId = null) => {
    // Get latest state from a getter function to avoid adding to deps
    const getLatestState = () => {
      const storedMatch = localStorage.getItem('clutchzone_currentMatch');
      try {
        return storedMatch ? JSON.parse(storedMatch) : null;
      } catch (error) {
        console.warn('Failed to parse stored match', error);
        return null;
      }
    };

    if (refreshInFlightRef.current) return null;

    const latestMatch = getLatestState();
    const id = matchId || latestMatch?.id || latestMatch?._id;
    if (!id) return null;

    refreshInFlightRef.current = true;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const response = await axios.get(`${API_BASE}/match/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedMatch = response.data.match;
      const currentPlayerCount = updatedMatch.players?.length || 0;
      const isInactive = ['completed', 'cancelled', 'disputed'].includes(updatedMatch.status);

      const prevMatch = currentMatch;
      const prevPlayerCount = prevMatch?.players?.length || 0;
      if (prevPlayerCount > 0 && currentPlayerCount > prevPlayerCount) {
        sendNotification('🔔 You got an opponent!', {
          body: 'An opponent has joined your match! Start uploading payment proof.',
          tag: 'opponent-joined',
          requireInteraction: true,
        });
      }
      setPreviousPlayerCount(currentPlayerCount);
      setLastMatchUpdate(new Date());

      if (isInactive) {
        setMatchPolling(false);
        localStorage.removeItem('clutchzone_currentMatch');
        localStorage.removeItem('clutchzone_currentMatchId');
        setCurrentMatch(null);
        return null;
      }

      setCurrentMatch(updatedMatch);
      localStorage.setItem('clutchzone_currentMatch', JSON.stringify(updatedMatch));
      localStorage.setItem('clutchzone_currentMatchId', updatedMatch.id || updatedMatch._id || '');
      return updatedMatch;
    } catch (error) {
      console.error('Failed to refresh match:', error);
      return null;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [sendNotification]);

  // Start polling for match updates
  const startMatchPolling = useCallback(() => {
    setMatchPolling(true);
  }, []);

  // Stop polling for match updates
  const stopMatchPolling = useCallback(() => {
    setMatchPolling(false);
  }, []);

  // Update match state immediately (for optimistic updates)
  const updateMatchState = useCallback((updates) => {
    setCurrentMatch(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Set a new match
  const setMatch = useCallback((match) => {
    const inactiveStatuses = ['completed', 'cancelled', 'disputed'];
    setCurrentMatch(match);
    setPreviousPlayerCount(match?.players?.length || 0);
    setLastMatchUpdate(new Date());

    if (match && !inactiveStatuses.includes(match.status)) {
      localStorage.setItem('clutchzone_currentMatch', JSON.stringify(match));
      localStorage.setItem('clutchzone_currentMatchId', match?.id || match?._id || '');
      setMatchPolling(true);
    } else {
      localStorage.removeItem('clutchzone_currentMatch');
      localStorage.removeItem('clutchzone_currentMatchId');
      setMatchPolling(false);
    }
  }, []);

  // Clear current match
  const clearMatch = useCallback(() => {
    setCurrentMatch(null);
    setLastMatchUpdate(null);
    setPreviousPlayerCount(0);
    localStorage.removeItem('clutchzone_currentMatch');
    localStorage.removeItem('clutchzone_currentMatchId');
    stopMatchPolling();
  }, [stopMatchPolling]);

  // Polling effect
  useEffect(() => {
    let intervalId;

    if (matchPolling && currentMatch) {
      intervalId = setInterval(() => {
        refreshMatch();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [matchPolling, currentMatch, refreshMatch]);

  // Auto-start polling when match becomes active
  useEffect(() => {
    if (currentMatch && !['completed', 'cancelled', 'disputed'].includes(currentMatch.status)) {
      startMatchPolling();
    } else {
      stopMatchPolling();
    }
  }, [currentMatch?.status, startMatchPolling, stopMatchPolling]);

  const value = {
    currentMatch,
    refreshMatch,
    updateMatchState,
    setMatch,
    clearMatch,
    lastMatchUpdate,
    isPolling: matchPolling,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};
