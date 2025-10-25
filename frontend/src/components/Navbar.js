import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, cartCount } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" data-testid="navbar-brand">
          <Package size={28} />
          <span>MarketPlace</span>
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/cart" className="navbar-cart" data-testid="cart-button">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="cart-badge" data-testid="cart-count">{cartCount}</span>
                )}
              </Link>
              
              <Link to="/orders" className="navbar-link" data-testid="orders-link">
                Orders
              </Link>
              
              <div className="navbar-user" data-testid="user-menu">
                <User size={20} />
                <span>{user.full_name}</span>
              </div>
              
              <button onClick={handleLogout} className="navbar-logout" data-testid="logout-button">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" data-testid="login-button">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
