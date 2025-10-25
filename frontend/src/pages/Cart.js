import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Cart = () => {
  const { updateCartCount } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/cart/update`,
        { product_id: productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
      updateCartCount();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
      updateCartCount();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <ShoppingBag size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h2>Your cart is empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Add some products to get started!
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="cart-page">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>Shopping Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          {cart.items.map((item) => (
            <div
              key={item.product_id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '1.5rem',
                boxShadow: 'var(--shadow)'
              }}
              data-testid={`cart-item-${item.product_id}`}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '0.75rem' }}
              />

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
                  ${item.price.toFixed(2)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      data-testid={`decrease-qty-${item.product_id}`}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600 }} data-testid={`quantity-${item.product_id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      data-testid={`increase-qty-${item.product_id}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem'
                    }}
                    data-testid={`remove-item-${item.product_id}`}
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: 'var(--shadow)', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>FREE</span>
              </div>
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }} data-testid="cart-total">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
              data-testid="proceed-checkout-button"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
