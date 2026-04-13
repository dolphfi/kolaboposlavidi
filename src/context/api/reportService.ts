import api from './api';

const reportService = {
    getSummary: async (startDate?: string, endDate?: string) => {
        let url = '/reports/summary';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await api.get(url);
        return response.data;
    },

    getSalesChart: async (period: string = '1W', startDate?: string, endDate?: string) => {
        let url = `/reports/sales-chart?period=${period}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        
        const response = await api.get(url);
        return response.data;
    },

    getCustomerOverview: async (period: string = 'today') => {
        const response = await api.get(`/reports/customer-overview?period=${period}`);
        return response.data;
    },

    getTopSellingProducts: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-selling-products?period=${period}`);
        return response.data;
    },

    getMonthlyStats: async (year: number) => {
        const response = await api.get(`/reports/monthly-stats?year=${year}`);
        return response.data;
    },

    getTopCustomers: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-customers?period=${period}`);
        return response.data;
    },

    getTopCategories: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-categories?period=${period}`);
        return response.data;
    },

    getOrderStats: async (period: string = '1M') => {
        const response = await api.get(`/reports/order-stats?period=${period}`);
        return response.data;
    },

    getSalesDates: async () => {
        const response = await api.get('/reports/sales-dates');
        return response.data;
    },

    getPosSummary: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await api.get(`/reports/pos-summary?${params.toString()}`);
        return response.data;
    }
};

export default reportService;
