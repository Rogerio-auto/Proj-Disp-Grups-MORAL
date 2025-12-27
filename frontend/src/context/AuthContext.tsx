import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nome: string;
  email: string;
  papel: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login(credentials: any): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@DispCanais:user');
    const storagedToken = localStorage.getItem('@DispCanais:token');

    if (storagedUser && storagedToken) {
      setUser(JSON.parse(storagedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    
    const { usuario, token } = response.data.data;

    setUser(usuario);
    
    localStorage.setItem('@DispCanais:token', token);
    localStorage.setItem('@DispCanais:user', JSON.stringify(usuario));
  };

  const logout = () => {
    localStorage.removeItem('@DispCanais:token');
    localStorage.removeItem('@DispCanais:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
