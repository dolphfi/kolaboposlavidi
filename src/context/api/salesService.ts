import api from './api';
import { db } from '../../lib/database';

export interface CreateSaleItem {
    productId?: string;
    serviceId?: string;
    name: string;
    price: number;
    qty: number;
}

export interface CreateSaleData {
    posId: string;
    customerId?: string;
    sellType: 'PRODUCT' | 'SERVICE';
    paymentMethod: 'CASH' | 'CARD' | 'SCAN' | 'SPLIT';
    items: CreateSaleItem[];
    discount?: number;
}

const extractArray = (response: any) => {
    if (!response) return [];
    const d = (response as any).data || response;
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
    const d = (response as any).data || response;
    if (d && d.data && !Array.isArray(d.data)) return d.data;
    return d;
};

const salesService = {
    create: async (data: CreateSaleData) => {
        if (!navigator.onLine) {
            console.log("Offline mode: Queueing sale for sync");
            const localId = Date.now();
            await db.pendingSales.add({
                saleData: data,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            return { status: "QUEUED_FOR_SYNC", id: localId };
        }

        const response = await api.post('/sales', data);
        return extractObject(response);
    },

    findAll: async () => {
        const response = await api.get('/sales');
        return extractArray(response);
    },

    findOne: async (id: string) => {
        const response = await api.get(`/sales/${id}`);
        return extractObject(response);
    },
};

export default salesService;
