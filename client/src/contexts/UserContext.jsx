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
  const [user, setUser] = useState(null);

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Clear user data (logout)
  const clearUser = useCallback(() => {
    setUser(null);
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