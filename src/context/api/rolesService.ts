import api from './api';
import { Role } from '../types/auth';

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

const rolesService = {
    getRoles: async (): Promise<Role[]> => {
        const response = await api.get('/roles');
        return extractArray(response) as Role[];
    },

    getRoleById: async (id: string): Promise<Role> => {
        const response = await api.get(`/roles/${id}`);
        return extractObject(response) as Role;
    },

    createRole: async (data: Partial<Role>): Promise<Role> => {
        const response = await api.post('/roles/add-role', data);
        return extractObject(response) as Role;
    },

    updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
        const response = await api.patch(`/roles/${id}`, data);
        return extractObject(response) as Role;
    },

    deleteRole: async (id: string): Promise<void> => {
        await api.delete(`/roles/${id}`);
    }
};

export default rolesService;
