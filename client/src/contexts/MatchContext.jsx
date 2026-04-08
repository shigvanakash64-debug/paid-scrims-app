import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
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

  // Polling interval for active matches (every 3 seconds)
  const POLLING_INTERVAL = 3000;

  // Force refresh match data
  const refreshMatch = useCallback(async (matchId = null) => {
    const id = matchId || currentMatch?.id || currentMatch?._id;
    if (!id) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const response = await axios.get(`${API_BASE}/match/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedMatch = response.data.match;
      setCurrentMatch(updatedMatch);
      setLastMatchUpdate(new Date());

      // If match is completed, cancelled, or disputed, stop polling
      if (['completed', 'cancelled', 'disputed'].includes(updatedMatch.status)) {
        setMatchPolling(false);
      }

      return updatedMatch;
    } catch (error) {
      console.error('Failed to refresh match:', error);
      return null;
    }
  }, [currentMatch]);

  // Start polling for match updates
  const startMatchPolling = useCallback(() => {
    if (matchPolling) return;
    setMatchPolling(true);
  }, [matchPolling]);

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
    setCurrentMatch(match);
    setLastMatchUpdate(new Date());

    // Start polling if match is active
    if (match && !['completed', 'cancelled', 'disputed'].includes(match.status)) {
      startMatchPolling();
    } else {
      stopMatchPolling();
    }
  }, [startMatchPolling, stopMatchPolling]);

  // Clear current match
  const clearMatch = useCallback(() => {
    setCurrentMatch(null);
    setLastMatchUpdate(null);
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