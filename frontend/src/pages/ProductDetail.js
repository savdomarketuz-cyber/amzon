import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateCartCount } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/cart/add`,
        { product_id: product.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Added to cart!');
      updateCartCount();
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} data-testid="product-detail-page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
        </div>

        <div>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: 'var(--shadow)' }}>
            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
              {product.category}
            </span>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }} data-testid="product-title">
              {product.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
                <Star size={20} fill="currentColor" />
                <span style={{ fontWeight: 600 }}>{product.rating}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>({product.reviews_count} reviews)</span>
            </div>

            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }} data-testid="product-price">
              ${product.price.toFixed(2)}
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
              {product.description}
            </p>

            <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Package size={20} />
                <span style={{ fontWeight: 600 }}>Stock: {product.stock} units</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ fontWeight: 500 }}>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '80px', padding: '0.5rem', border: '2px solid var(--border)', borderRadius: '0.5rem' }}
                  data-testid="quantity-input"
                />
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={adding || product.stock === 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              data-testid="add-to-cart-button"
            >
              <ShoppingCart size={20} />
              {adding ? 'Adding...' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
