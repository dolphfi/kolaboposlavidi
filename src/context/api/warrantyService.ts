import api from './api';

export interface Warranty {
    id: string;
    name: string;
    duration?: number;
    durationUnit?: string;
    description?: string;
    type?: string;
    createdAt?: string;
    updatedAt?: string;
}

const extractArray = (response: any) => {
    if (!response) return [];
    // response.data can be typed due to Axios generic, so we cast to any first
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

const warrantyService = {
    getAll: async (): Promise<Warranty[]> => {
        const response = await api.get<Warranty[]>('/warranties');
        return extractArray(response) as Warranty[];
    },

    getById: async (id: string): Promise<Warranty> => {
        const response = await api.get<Warranty>(`/warranties/${id}`);
        return extractObject(response) as Warranty;
    },

    create: async (data: Partial<Warranty>): Promise<Warranty> => {
        const response = await api.post<Warranty>('/warranties', data);
        return extractObject(response) as Warranty;
    },

    update: async (id: string, data: Partial<Warranty>): Promise<Warranty> => {
        const response = await api.patch<Warranty>(`/warranties/${id}`, data);
        return extractObject(response) as Warranty;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/warranties/${id}`);
    }
};

export default warrantyService;
