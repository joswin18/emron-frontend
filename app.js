const express = require('express');
const path = require('path');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const API_BASE_URL = 'http://localhost:3000/api';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Home page route
app.get('/', async (req, res) => {
    try {
        const [productsResponse, featuredResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/products`),
            axios.get(`${API_BASE_URL}/products/featured`)
        ]);

        res.render('index', { 
            title: 'EMRON Electricals',
            categories: productsResponse.data.categories || [],
            featuredProducts: featuredResponse.data.products || []
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('index', { 
            title: 'EMRON Electricals',
            categories: [],
            featuredProducts: []
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

app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});