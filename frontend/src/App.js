import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';
import Auth from './pages/Auth';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
      fetchCartCount(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  const fetchCartCount = async (token) => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(response.data.items?.length || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    fetchCartCount(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCartCount(0);
  };

  const updateCartCount = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCartCount(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, cartCount, updateCartCount }}>
      <div className="App">
        <BrowserRouter>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
