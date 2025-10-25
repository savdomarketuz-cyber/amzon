import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Star } from 'lucide-react';
import './Home.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API}/products`, { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page" data-testid="home-page">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title" data-testid="hero-title">Discover Amazing Products</h1>
          <p className="hero-subtitle">Shop the best deals on electronics, fashion, and more</p>
          
          <div className="search-bar" data-testid="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      <div className="container">
        <div className="categories-section">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid" data-testid="categories-grid">
            <button
              className={`category-card ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
              data-testid="category-all"
            >
              <span>All Products</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-card ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
                data-testid={`category-${category.slug}`}
              >
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="products-section">
          <div className="products-header">
            <h2 className="section-title">
              {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
            </h2>
            <span className="products-count" data-testid="products-count">
              {products.length} items
            </span>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>No products found</p>
            </div>
          ) : (
            <div className="products-grid" data-testid="products-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="product-card"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="product-image">
                    <img src={product.images[0]} alt={product.title} />
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-category">{product.category}</p>
                    <div className="product-rating">
                      <Star size={16} fill="currentColor" />
                      <span>{product.rating}</span>
                      <span className="reviews-count">({product.reviews_count})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">${product.price.toFixed(2)}</span>
                      <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
