import api from './api';

const extract = (response: any) => {
    const d = response.data;
    // If the backend interceptor wraps arrays in { data: [...] }
    if (d && typeof d === 'object' && d.data !== undefined && Array.isArray(d.data)) {
        return d.data;
    }
    return d;
};

const reportService = {
    getSummary: async (startDate?: string, endDate?: string) => {
        let url = '/reports/summary';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await api.get(url);
        // Summary is an object, so extract might just return d.
        // If it's wrapped like { data: { overallInfo: ... } }, we should unwrap it too.
        return response.data?.data && !Array.isArray(response.data?.data) ? response.data.data : extract(response);
    },

    getSalesChart: async (period: string = '1W', startDate?: string, endDate?: string) => {
        let url = `/reports/sales-chart?period=${period}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        
        const response = await api.get(url);
        return extract(response);
    },

    getCustomerOverview: async (period: string = 'today') => {
        const response = await api.get(`/reports/customer-overview?period=${period}`);
        return extract(response);
    },

    getTopSellingProducts: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-selling-products?period=${period}`);
        return extract(response);
    },

    getMonthlyStats: async (year: number) => {
        const response = await api.get(`/reports/monthly-stats?year=${year}`);
        return extract(response);
    },

    getTopCustomers: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-customers?period=${period}`);
        return extract(response);
    },

    getTopCategories: async (period: string = 'today') => {
        const response = await api.get(`/reports/top-categories?period=${period}`);
        return extract(response);
    },

    getOrderStats: async (period: string = '1M') => {
        const response = await api.get(`/reports/order-stats?period=${period}`);
        return extract(response);
    },

    getSalesDates: async () => {
        const response = await api.get('/reports/sales-dates');
        return extract(response);
    },

    getPosSummary: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await api.get(`/reports/pos-summary?${params.toString()}`);
        return extract(response);
    }
};

export default reportService;
