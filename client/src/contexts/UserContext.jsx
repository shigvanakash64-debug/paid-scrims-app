import { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('clutchzone_cached_user');
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch (error) {
      console.warn('Failed to restore cached user:', error);
      return null;
    }
  });

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('clutchzone_cached_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('clutchzone_cached_user');
    }
  }, []);

  // Clear user data (logout)
  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('clutchzone_cached_user');
  }, []);

  const value = {
    user,
    updateUser,
    clearUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};