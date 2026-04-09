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
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);

  // Polling interval for active matches (every 3 seconds)
  const POLLING_INTERVAL = 3000;

  useEffect(() => {
    const storedMatch = localStorage.getItem('clutchzone_currentMatch');
    if (storedMatch) {
      try {
        const parsedMatch = JSON.parse(storedMatch);
        setCurrentMatch(parsedMatch);
        setPreviousPlayerCount(parsedMatch?.players?.length || 0);
        if (parsedMatch && !['completed', 'cancelled', 'disputed'].includes(parsedMatch.status)) {
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
        badge: '🎮',
        ...options,
      });
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Force refresh match data
  const refreshMatch = useCallback(async (matchId = null) => {
    // Get latest state from a getter function to avoid adding to deps
    const getLatestState = () => {
      const storedMatch = localStorage.getItem('clutchzone_currentMatch');
      try {
        return storedMatch ? JSON.parse(storedMatch) : null;
      } catch {
        return null;
      }
    };

    const latestMatch = getLatestState();
    const id = matchId || latestMatch?.id || latestMatch?._id;
    if (!id) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const response = await axios.get(`${API_BASE}/match/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedMatch = response.data.match;
      const currentPlayerCount = updatedMatch.players?.length || 0;

      // Use current state from context for comparison
      setCurrentMatch((prevMatch) => {
        const prevPlayerCount = prevMatch?.players?.length || 0;
        
        if (prevPlayerCount > 0 && currentPlayerCount > prevPlayerCount) {
          sendNotification('🔔 You got an opponent!', {
            body: 'An opponent has joined your match! Start uploading payment proof.',
            tag: 'opponent-joined',
            requireInteraction: true,
          });
        }

        setPreviousPlayerCount(currentPlayerCount);
        return updatedMatch;
      });

      setLastMatchUpdate(new Date());
      localStorage.setItem('clutchzone_currentMatch', JSON.stringify(updatedMatch));
      localStorage.setItem('clutchzone_currentMatchId', updatedMatch.id || updatedMatch._id || '');

      // If match is completed, cancelled, or disputed, stop polling
      if (['completed', 'cancelled', 'disputed'].includes(updatedMatch.status)) {
        setMatchPolling(false);
      }

      return updatedMatch;
    } catch (error) {
      console.error('Failed to refresh match:', error);
      return null;
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
    setCurrentMatch(match);
    localStorage.setItem('clutchzone_currentMatch', JSON.stringify(match));
    localStorage.setItem('clutchzone_currentMatchId', match?.id || match?._id || '');
    setPreviousPlayerCount(match?.players?.length || 0);
    setLastMatchUpdate(new Date());

    // Start or stop polling based on match status
    if (match && !['completed', 'cancelled', 'disputed'].includes(match.status)) {
      setMatchPolling(true);
    } else {
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