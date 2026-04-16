import api from './api';

export enum PromotionType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

export interface Promotion {
    id: string;
    name: string;
    code: string;
    type: PromotionType;
    value: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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

const promotionService = {
    getAll: async (): Promise<Promotion[]> => {
        const response = await api.get('/promotions');
        return extractArray(response) as Promotion[];
    },

    getById: async (id: string): Promise<Promotion> => {
        const response = await api.get(`/promotions/${id}`);
        return extractObject(response) as Promotion;
    },

    validateCode: async (code: string): Promise<Promotion> => {
        const response = await api.get(`/promotions/validate/${code}`);
        return extractObject(response) as Promotion;
    },

    create: async (promotionData: any): Promise<Promotion> => {
        const response = await api.post('/promotions', promotionData);
        return extractObject(response) as Promotion;
    },

    update: async (id: string, promotionData: any): Promise<Promotion> => {
        const response = await api.patch(`/promotions/${id}`, promotionData);
        return extractObject(response) as Promotion;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/promotions/${id}`);
    },
};

export default promotionService;
