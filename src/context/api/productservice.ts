import api from './api';
import { db } from '../../lib/database';

const extractArray = (response: any) => {
    if (!response) return [];
    const d = response.data || response;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    if (d && typeof d === 'object' && Object.keys(d).length > 0) {
        const vals = Object.values(d);
        const firstArray = vals.find(v => Array.isArray(v));
        if (firstArray) return firstArray;
    }
    return [];
};

const extractObject = (response: any) => {
    if (!response) return {};
    const d = response.data || response;
    if (d && d.data && !Array.isArray(d.data)) return d.data;
    return d;
};

/**
 * Service to handle all product related API calls
 */
const productService = {
    /**
     * Get all products
     */
    getAll: async (posId?: string) => {
        if (!navigator.onLine) {
            console.log("Offline mode: loading products from indexedDB");
            return await db.products.toArray();
        }

        try {
            const response = await api.get('/products', {
                params: { posId }
            });
            const data = extractArray(response);
            
            if (data.length > 0) {
                // Clear and recreate or just bulkPut
                await db.products.bulkPut(data);
            }
            return data;
        } catch (error) {
            console.log("Error fetching products, falling back to indexedDB", error);
            return await db.products.toArray();
        }
    },

    /**
     * Get product by ID
     */
    getById: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return extractObject(response);
    },

    /**
     * Create a new product (supports multipart/form-data for images)
     */
    create: async (formData: FormData) => {
        const response = await api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return extractObject(response);
    },

    /**
     * Update an existing product
     */
    update: async (id: string, productData: any) => {
        const response = await api.patch(`/products/${id}`, productData);
        return extractObject(response);
    },

    /**
     * Delete a product
     */
    remove: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return extractObject(response);
    },

    refillStock: async (data: { pricingStockId: string, posId: string, quantity: number }) => {
        const response = await api.post('/products/stock/refill', data);
        return extractObject(response);
    },

    getExpired: async () => {
        const response = await api.get('/products/expired');
        return extractArray(response);
    }
};

export default productService;
