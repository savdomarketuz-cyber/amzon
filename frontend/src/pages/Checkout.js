import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || '',
    phone: user?.phone || '',
    payment_method: 'stripe'
  });

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
      if (response.data.items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      toast.error('Failed to load cart');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const orderResponse = await axios.post(
        `${API}/orders`,
        {
          payment_method: formData.payment_method,
          shipping_address: {
            full_name: formData.full_name,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postal_code,
            country: formData.country,
            phone: formData.phone
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const paymentResponse = await axios.post(
        `${API}/payment/create-session`,
        null,
        {
          params: {
            order_id: orderResponse.data.order_id,
            origin_url: window.location.origin
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      window.location.href = paymentResponse.data.url;
    } catch (error) {
      toast.error('Failed to process order');
      setLoading(false);
    }
  };

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="checkout-page">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Shipping Information</h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input"
                data-testid="full-name-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                data-testid="address-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                  data-testid="city-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="input"
                  data-testid="postal-code-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input"
                  data-testid="country-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  data-testid="phone-input"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Payment Method</h2>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: `2px solid ${formData.payment_method === 'stripe' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  background: formData.payment_method === 'stripe' ? 'rgba(14, 165, 233, 0.05)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="stripe"
                  checked={formData.payment_method === 'stripe'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  data-testid="stripe-radio"
                />
                <CreditCard size={24} />
                <span style={{ fontWeight: 500 }}>Stripe</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', marginTop: '2rem' }}
            data-testid="place-order-button"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: 'var(--shadow)', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              {cart.items.map((item) => (
                <div key={item.product_id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{item.title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }} data-testid="checkout-total">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
