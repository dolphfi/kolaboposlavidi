import api from './api';
import { User } from '../types/auth';

export interface UserCreateDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    roleId?: string;
    posId?: string;
}

export interface UserUpdateDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleId?: string;
    posId?: string;
    isActive?: boolean;
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

const userService = {
    createUser: async (userData: UserCreateDto): Promise<User> => {
        const response = await api.post('/users', userData);
        return extractObject(response) as User;
    },

    getAllUsers: async (page = 1, limit = 10): Promise<{ data: User[], meta: any }> => {
        const response = await api.get('/users', { params: { page, limit } });
        // Return object since UserList.tsx does `usersData.data`
        return extractObject(response) as { data: User[], meta: any };
    },

    getUserById: async (id: string): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return extractObject(response) as User;
    },

    updateUser: async (id: string, userData: UserUpdateDto): Promise<User> => {
        const response = await api.patch(`/users/${id}`, userData);
        return extractObject(response) as User;
    },

    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    unlockUser: async (id: string): Promise<User> => {
        const response = await api.post(`/users/${id}/unlock`);
        return extractObject(response) as User;
    }
};

export default userService;
