import api from './api';

export interface CreatePurchaseItemData {
    productId: string;
    name: string;
    costPrice: number;
    qty: number;
}

export interface CreatePurchaseData {
    posId: string;
    supplierName?: string;
    items: CreatePurchaseItemData[];
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

const purchaseService = {
    create: async (data: CreatePurchaseData) => {
        const response = await api.post('/purchases', data);
        return extractObject(response);
    },

    findAll: async () => {
        const response = await api.get('/purchases');
        return extractArray(response);
    },

    findOne: async (id: string) => {
        const response = await api.get(`/purchases/${id}`);
        return extractObject(response);
    }
};

export default purchaseService;
