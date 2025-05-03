import { createContext, useContext, useState } from 'react';

// 1. Create context
const AuthContext = createContext();

// 2. Create provider component (this was missing!)
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      role: localStorage.getItem('userRole') || null // 👈 Critical hydration
    };
  });

  console.log("AUTH CONTEXT DUMP:", {
    currentAuth: auth,
    localStorageRole: localStorage.getItem('userRole'),
    isAuthenticated: !!auth.user
  });

  const login = (user, role) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', role);
    setAuth({ user, role });
  };

  const logout = () => {
    // 1. Clear storage
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // 2. Reset auth state
    setAuth({ user: null, role: null });
    
    // 3. Force hard redirect (bypass React Router cache)
    window.location.href = '/login'; // 🔥 Nuclear option
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook (optional but recommended)
export const useAuth = () => useContext(AuthContext);

// 4. Export context for special cases
export default AuthContext;