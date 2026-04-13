import { useState, useEffect, useCallback } from 'react';
import reportService from '../context/api/reportService';

/**
 * Hook to manage dashboard report data fetching and state
 */
export const useReports = () => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartPeriod, setChartPeriod] = useState<string>('1W');
    const [isLoading, setIsLoading] = useState(true);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const summary = await reportService.getSummary();
            setStats(summary);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erè pandan chajman done dashboard yo');
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchChartData = useCallback(async (period: string) => {
        try {
            setIsChartLoading(true);
            const chart = await reportService.getSalesChart(period);
            setChartData(chart);
        } catch (err: any) {
            console.error('Error fetching chart data:', err);
        } finally {
            setIsChartLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchChartData(chartPeriod);
    }, [fetchChartData, chartPeriod]);

    return { 
        stats, 
        chartData, 
        chartPeriod, 
        setChartPeriod, 
        isLoading, 
        isChartLoading, 
        error, 
        refresh: fetchStats 
    };
};
