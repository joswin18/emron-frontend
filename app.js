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
        const productsResponse = await axios.get(`${API_BASE_URL}/products`);
        const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
        
        const products = productsResponse.data.products.map(product => ({
            ...product,
            category: categoriesResponse.data.categories.find(c => 
                c._id === product.category
            )
        }));

        res.render('admin/products', {
            products,
            categories: categoriesResponse.data.categories,
            currentUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/products', {
            products: [],
            categories: [],
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
            categories: categoriesResponse.data.categories || [], // Add .categories here
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

app.get('/admin/products/edit/:id', async (req, res) => {
    try {
        const [productResponse, categoriesResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/products/${req.params.id}`),
            axios.get(`${API_BASE_URL}/categories`)
        ]);

        res.render('admin/product-form', {
            isEdit: true,
            product: productResponse.data.product,
            categories: categoriesResponse.data.categories || [], // Add .categories here
            currentUrl: `/admin/products/edit/${req.params.id}`,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error loading edit product form:', error);
        res.redirect('/admin/products');
    }
});

app.get('/admin/categories', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        res.render('admin/categories', {
            categories: response.data.categories || [],
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

app.post('/admin/categories', async (req, res) => {
    try {
        await axios.post(`${API_BASE_URL}/categories`, req.body);
        req.flash('success', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error creating category:', error);
        req.flash('error', 'Error creating category');
        res.redirect('/admin/categories');
    }
});

app.put('/admin/categories/:id', async (req, res) => {
    try {
        await axios.put(`${API_BASE_URL}/categories/${req.params.id}`, req.body);
        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error updating category:', error);
        req.flash('error', 'Error updating category');
        res.redirect('/admin/categories');
    }
});

app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});