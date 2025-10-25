import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      navigate('/');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    if (attempts >= maxAttempts) {
      setChecking(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/payment/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setPaymentStatus(response.data);
        setChecking(false);
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    }
  };

  if (checking) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', marginBottom: '1rem' }}></div>
        <h2>Verifying your payment...</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please wait while we confirm your order</p>
      </div>
    );
  }

  if (!paymentStatus || paymentStatus.payment_status !== 'paid') {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <h2>Payment verification in progress</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Your payment is being processed. Please check your orders page in a few minutes.
        </p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          View Orders
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }} data-testid="order-success-page">
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem'
        }}>
          <CheckCircle size={64} style={{ color: 'var(--secondary)' }} />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Order Confirmed!</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: 'var(--shadow)',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Order ID</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{paymentStatus.order_id?.substring(0, 16)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              ${paymentStatus.amount?.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Payment Status</span>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--secondary)'
            }}>
              Paid
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/orders')} className="btn btn-primary" data-testid="view-orders-button">
            <Package size={20} />
            View Orders
          </button>
          <button onClick={() => navigate('/')} className="btn btn-outline">
            Continue Shopping
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
