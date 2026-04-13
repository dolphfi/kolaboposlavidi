import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Triangle, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, ReferenceLine } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import reportService from '../../context/api/reportService';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "../ui/dropdown-menu";

interface SalesStatisticsCardProps {
    data?: any[];
}

export const SalesStatisticsCard: React.FC<SalesStatisticsCardProps> = ({ data: initialData }) => {
    const { t } = useTranslation();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [chartData, setChartData] = useState<any[]>(initialData || []);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMonthlyStats = async (year: number) => {
        try {
            setIsLoading(true);
            const res = await reportService.getMonthlyStats(year);
            setChartData(res);
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // If we selected a year that is NOT current year, fetch it
        if (selectedYear !== new Date().getFullYear()) {
            fetchMonthlyStats(selectedYear);
        } else if (initialData) {
            // If we are back to current year, use initialData from parent
            setChartData(initialData);
        }
    }, [selectedYear]);

    // Update chartData only when initialData changes AND we are on the current year
    useEffect(() => {
        if (initialData && selectedYear === new Date().getFullYear()) {
            setChartData(initialData);
        }
    }, [initialData, selectedYear]);

    const formatCurrency = (amount: number | string) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'HTG',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const displayData = chartData?.map(d => ({
        ...d,
        name: t(`common.months_short.${d.month}`),
        expense: -Math.abs(d.expense) // Ensure expense is shown as a downward bar
    })) || [];

    const totalRevenue = chartData?.reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0) || 0;
    const totalExpense = chartData?.reduce((acc, curr) => acc + (parseFloat(curr.expense) || 0), 0) || 0;

    const chartConfig = {
        revenue: {
            label: t('dashboard.revenue'),
            color: "#14b8a6", // teal-500
        },
        expense: {
            label: t('dashboard.expense'),
            color: "#f97316", // orange-500
        },
    } satisfies ChartConfig;

    const years = [
        new Date().getFullYear(),
        new Date().getFullYear() - 1,
        new Date().getFullYear() - 2
    ];

    return (
        <Card className="shadow-sm h-full bg-white/5 backdrop-blur-sm border border-white/10 text-white flex flex-col">
            <CardContent className="p-6 flex flex-col h-full relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 px-6 -mx-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Triangle className="h-5 w-5 text-orange-500 fill-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('dashboard.sales_statistics')}</h3>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white gap-2">
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                                {selectedYear}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                            {years.map((year) => (
                                <DropdownMenuItem 
                                    key={year} 
                                    onSelect={() => setSelectedYear(year)}
                                    className="hover:bg-white/10 cursor-pointer"
                                >
                                    {year}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Stats Summary */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-lg font-bold text-teal-400 truncate">{formatCurrency(totalRevenue)}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 shrink-0">
                                    ↗ 0%
                                </span>
                            </div>
                            <span className="text-xs text-slate-400">{t('dashboard.revenue')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/5">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-lg font-bold text-white truncate">{formatCurrency(totalExpense)}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-400 shrink-0">
                                    ↗ 0%
                                </span>
                            </div>
                            <span className="text-xs text-slate-400">{t('dashboard.expense')}</span>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className={`flex-1 w-full min-h-[250px] overflow-hidden transition-opacity ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                    <div className="h-full w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart accessibilityLayer data={displayData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />

                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            indicator="dot"
                                            className="bg-slate-900 border-white/10 text-white min-w-[150px] shadow-2xl"
                                            labelClassName="text-slate-300 mb-1 border-b border-white/10 pb-1"
                                            formatter={(value) => formatCurrency(Math.abs(Number(value)))}
                                        />
                                    }
                                />

                                <Bar
                                    dataKey="revenue"
                                    fill="#14b8a6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={12}
                                />
                                <Bar
                                    dataKey="expense"
                                    fill="#f97316"
                                    radius={[0, 0, 4, 4]}
                                    barSize={12}
                                />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
