import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import './Auth.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      login(response.data.access_token, response.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page" data-testid="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title" data-testid="auth-title">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to continue shopping' : 'Join our marketplace today'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <div className="input-group">
                  <User size={20} />
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    data-testid="full-name-input"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <Mail size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <Lock size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  data-testid="password-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary auth-submit"
              disabled={loading}
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-switch">
            <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="auth-switch-btn"
              data-testid="toggle-auth-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
