// filepath: frontend/public/js/services/api.js
const API_BASE_URL = 'http://localhost:3000/api';

const api = {
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/products?${params}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    async getProductById(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    }
};