const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('express-flash');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const API_BASE_URL = 'http://localhost:3000/api';

// Session middleware setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Flash middleware
app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Home page route
app.get('/', async (req, res) => {
    try {
        // Fetch categories and featured products
        const [productsResponse, featuredResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/products`),
            axios.get(`${API_BASE_URL}/products?featured=true`)
        ]);

        res.render('index', {
            title: 'EMRON Electricals - Quality Electrical Products',
            categories: productsResponse.data.categories || [],
            featuredProducts: featuredResponse.data.products || []
        });
    } catch (error) {
        console.error('Error fetching home data:', error);
        res.render('index', {
            title: 'EMRON Electricals',
            categories: [],
            featuredProducts: [],
            error: 'Error loading content'
        });
    }
});

// Products page route
app.get('/products', async (req, res) => {
    try {
        const { category = 'all', search = '', sort = 'newest' } = req.query;
        
        const response = await axios.get(`${API_BASE_URL}/products`, {
            params: { category, search, sort }
        });

        res.render('products', {
            title: 'Our Products',
            products: response.data.products || [],
            categories: response.data.categories || [],
            currentCategory: category,
            searchTerm: search,
            currentSort: sort
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('products', {
            title: 'Our Products',
            products: [],
            categories: [],
            currentCategory: 'all',
            searchTerm: '',
            currentSort: 'newest'
        });
    }
});

// Product detail page route
app.get('/product/:id', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/${req.params.id}`);
        
        res.render('product-detail', {
            title: response.data.product.name,
            product: response.data.product,
            relatedProducts: response.data.relatedProducts || []
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.render('product-detail', {
            title: 'Product Not Found',
            product: null,
            relatedProducts: []
        });
    }
});

// Dashboard route
app.get('/admin', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/stats`);
        res.render('admin/dashboard', {
            stats: response.data,
            currentUrl: '/admin',  // Add this line
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.render('admin/dashboard', {
            stats: {
                overview: {
                    totalProducts: 0,
                    featuredProducts: 0,
                    inStockProducts: 0,
                    outOfStockProducts: 0
                },
                categories: [],
                recentProducts: [],
                priceStats: {
                    avgPrice: 0,
                    minPrice: 0,
                    maxPrice: 0,
                    totalValue: 0
                }
            },
            error: 'Error loading dashboard data'
        });
    }
});

// Admin routes
app.get('/admin/products', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products`);
        res.render('admin/products', {
            products: response.data.products || [],
            currentUrl: '/admin/products',  // Add this line
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('admin/products', {
            products: [],
            currentUrl: '/admin/products',
            error: 'Error loading products'
        });
    }
});

app.get('/admin/products/add', async (req, res) => {
    try {
        const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
        res.render('admin/product-form', {
            isEdit: false,
            product: {},
            categories: categoriesResponse.data,
            currentUrl: '/admin/products/add',
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error loading add product form:', error);
        res.render('admin/product-form', {
            isEdit: false,
            product: {},
            categories: [],
            currentUrl: '/admin/products/add',
            error: 'Error loading form'
        });
    }
});

app.get('/admin/categories', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        // Make sure we're getting proper array of category objects
        res.render('admin/categories', {
            categories: response.data.categories || [], // Ensure this matches your API response structure
            currentUrl: '/admin/categories',
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.render('admin/categories', {
            categories: [],
            currentUrl: '/admin/categories',
            error: 'Error loading categories'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});