import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { getSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      setUser(data.user);
      setCompany(data.company);
      const socket = getSocket();
      if (socket) {
        socket.connect();
        socket.emit('join:company', data.company.id);
      }
    } catch (err) {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async ({ companySlug, email, password }) => {
    const { data } = await authApi.login({ companySlug, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setCompany(data.company);
    const socket = getSocket();
    if (socket) {
      socket.connect();
      socket.emit('join:company', data.company.id);
    }
    return data;
  };

  const registerCompany = async (payload) => {
    const { data } = await authApi.registerCompany(payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setCompany(data.company);
    const socket = getSocket();
    if (socket) {
      socket.connect();
      socket.emit('join:company', data.company.id);
    }
    return data;
  };

  const logout = () => {
    localStorage.clear();
    disconnectSocket();
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, registerCompany, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
