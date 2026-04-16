import api from './api';
import { Service } from '../types/interface';

/**
 * Service to handle all service-related API calls
 */
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

const serviceService = {
    getAll: async (posId?: string): Promise<Service[]> => {
        const response = await api.get('/services', {
            params: { posId }
        });
        return extractArray(response) as Service[];
    },

    getById: async (id: string): Promise<Service> => {
        const response = await api.get(`/services/${id}`);
        return extractObject(response) as Service;
    },

    create: async (serviceData: any): Promise<Service> => {
        const response = await api.post('/services', serviceData);
        return extractObject(response) as Service;
    },

    update: async (id: string, serviceData: any): Promise<Service> => {
        const response = await api.patch(`/services/${id}`, serviceData);
        return extractObject(response) as Service;
    },

    remove: async (id: string): Promise<any> => {
        const response = await api.delete(`/services/${id}`);
        return extractObject(response);
    }
};

export default serviceService;
