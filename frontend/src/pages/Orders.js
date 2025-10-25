import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }} data-testid="empty-orders">
        <Package size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h2>No orders yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Start shopping to see your orders here!
        </p>
        <Link to="/" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="orders-page">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>My Orders</h1>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: 'var(--shadow)'
            }}
            data-testid={`order-${order.id}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Package size={20} />
                  <span style={{ fontWeight: 600 }}>Order #{order.id.substring(0, 8)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={16} />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CreditCard size={16} />
                    {order.payment_method}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  ${order.total_amount.toFixed(2)}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: order.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: order.payment_status === 'paid' ? 'var(--secondary)' : 'var(--accent)'
                  }}
                  data-testid={`order-status-${order.id}`}
                >
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {order.items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>Shipping to:</strong> {order.shipping_address.full_name}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.postal_code}, {order.shipping_address.country}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
