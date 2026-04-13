import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "components/ui/card";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    ShoppingCart,
    Calendar as CalendarIcon,
    Download,
    FileStack,
    Truck,
    X,
    Loader2,
    Upload,
    FileSpreadsheet,
    FileText,
    ChevronDown
} from 'lucide-react';
import { Button } from 'components/ui/button';
import reportService from 'context/api/reportService';
import settingsService from 'context/api/settingsService';
import { format, startOfDay, endOfDay, subDays, isToday } from 'date-fns';
import { fr, ht, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import { Calendar } from "components/ui/calendar";
import { cn } from "lib/utils";
import { DateRange } from "react-day-picker";

const Reports: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [posData, setPosData] = useState<any[]>([]);
    const [salesDates, setSalesDates] = useState<string[]>([]);
    const [businessName, setBusinessName] = useState('Kolabo POS');
    const [logoUrl, setLogoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.getAll();
                const name = response.data.find((s: any) => s.key === 'BUSINESS_NAME')?.value;
                const logo = response.data.find((s: any) => s.key === 'BUSINESS_LOGO_URL')?.value;
                if (name) setBusinessName(name);
                if (logo) setLogoUrl(logo);
            } catch (error) {
                console.error("Error fetching business settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const getDateLocale = () => {
        switch (i18n.language) {
            case 'ht': return ht;
            case 'fr': return fr;
            default: return enUS;
        }
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        // If the user has finished selecting a range (both from and to), close the popover
        if (range?.from && range?.to) {
            setIsCalendarOpen(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    useEffect(() => {
        const fetchAvailableDates = async () => {
            try {
                const dates = await reportService.getSalesDates();
                setSalesDates(dates);
            } catch (error) {
                console.error('Error fetching sales dates:', error);
            }
        };
        fetchAvailableDates();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Use format with local time to avoid UTC shifting issues if the backend comparison is sensitive
            const startDate = dateRange?.from ? format(startOfDay(dateRange.from), "yyyy-MM-dd HH:mm:ss") : undefined;
            const endDate = dateRange?.to
                ? format(endOfDay(dateRange.to), "yyyy-MM-dd HH:mm:ss")
                : dateRange?.from
                    ? format(endOfDay(dateRange.from), "yyyy-MM-dd HH:mm:ss")
                    : undefined;

            const [summary, chart, posSummary] = await Promise.all([
                reportService.getSummary(startDate, endDate),
                reportService.getSalesChart('1W', startDate, endDate),
                reportService.getPosSummary(startDate, endDate)
            ]);
            setStats(summary);
            setChartData(chart);
            setPosData(posSummary);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'HTG',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleExportCSV = () => {
        if (!stats && posData.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        // Header
        csvContent += `Rapo ${businessName} - Period: ${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : 'Tout tan'} - ${dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ''}\n\n`;

        // Summary Stats
        csvContent += "REZIME JENERAL\n";
        csvContent += `Lavant Total,${stats?.totalSales || 0} HTG\n`;
        csvContent += `Pwofi Estime,${stats?.totalProfit || 0} HTG\n`;
        csvContent += `Kantite Lòd,${stats?.totalOrders || 0}\n`;
        csvContent += `Stock ki Ba,${stats?.lowStockCount || 0}\n\n`;

        // POS Performance Table
        if (posData.length > 0) {
            csvContent += "PÈFOMANS PA PWEN DE VANT\n";
            csvContent += "Pwen de Vant,Lòd,Lavant (HTG),Pwofi (HTG)\n";
            posData.forEach(pos => {
                csvContent += `${pos.name},${pos.totalOrders},${pos.totalSales},${pos.totalProfit}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapo_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getBase64ImageFromUrl = async (url: string): Promise<string> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result as string), false);
            reader.addEventListener("error", () => reject());
            reader.readAsDataURL(blob);
        });
    };

    const handleExportPDF = async () => {
        if (!stats && posData.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const dateStr = format(new Date(), "yyyy-MM-dd HH:mm");
        const periodStr = `${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : 'Tout tan'} ${dateRange?.to ? '- ' + format(dateRange.to, "yyyy-MM-dd") : ''}`;

        // Header
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, pageWidth, 40, 'F');

        let textXOffset = 15;
        if (logoUrl) {
            try {
                const imgData = await getBase64ImageFromUrl(logoUrl);
                doc.addImage(imgData, 'PNG', 15, 8, 24, 24);
                textXOffset = 45;
            } catch (error) {
                console.error("Could not load for PDF", error);
            }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(businessName.toUpperCase(), textXOffset, 20);

        doc.setFontSize(10);
        doc.text("RAPÒ ANALITIK & PWOFI", textXOffset, 30);
        doc.text(`Jenere le: ${dateStr}`, pageWidth - 15, 30, { align: 'right' });

        // Period Info
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Peryod: ${periodStr}`, 15, 50);

        // General Summary
        doc.setFontSize(14);
        doc.text("1. REZIME JENERAL", 15, 65);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 68, 80, 68);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Lavant Total:`, 15, 78);
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(stats?.totalSales || 0)}`, 100, 78, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.text(`Pwofi Estime:`, 15, 86);
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(stats?.totalProfit || 0)}`, 100, 86, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.text(`Kantite Lod:`, 15, 94);
        doc.setFont("helvetica", "bold");
        doc.text(`${stats?.totalOrders || 0}`, 100, 94, { align: 'right' });

        // POS Performance Table
        if (posData.length > 0) {
            let yPos = 115;
            doc.setFontSize(14);
            doc.text("2. PEFOMANS PA PWEN DE VANT", 15, yPos);
            doc.line(15, yPos + 3, 100, yPos + 3);

            yPos += 15;
            // Table Header
            doc.setFillColor(241, 245, 249);
            doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Pwen de Vant", 20, yPos);
            doc.text("Lod", 110, yPos, { align: 'right' });
            doc.text("Lavant (HTG)", 150, yPos, { align: 'right' });
            doc.text("Pwofi (HTG)", 190, yPos, { align: 'right' });

            doc.setFont("helvetica", "normal");
            yPos += 10;
            posData.forEach((pos, idx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(pos.name, 20, yPos);
                doc.text((pos.totalOrders || 0).toString(), 110, yPos, { align: 'right' });
                doc.text(formatCurrency(pos.totalSales || 0).replace('HTG', '').trim(), 150, yPos, { align: 'right' });
                doc.text(formatCurrency(pos.totalProfit || 0).replace('HTG', '').trim(), 190, yPos, { align: 'right' });

                doc.setDrawColor(241, 245, 249);
                doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);
                yPos += 10;
            });
        }

        doc.save(`rapo_${businessName}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    };

    const analyticsCards = [
        {
            title: t('dashboard.total_sales'),
            value: formatCurrency(stats?.totalSales || 0),
            description: t('dashboard.total_sales_desc', "Total tout lavant fèt"),
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            growth: dateRange?.from && dateRange?.to ? null : stats?.salesPercentage
        },
        {
            title: t('dashboard.profit', "Pwofi (Estime)"),
            value: formatCurrency(stats?.totalProfit || 0),
            description: t('dashboard.profit_desc', "Pwofi sou vant pwodwi"),
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            growth: dateRange?.from && dateRange?.to ? null : stats?.profitPercentage
        },
        {
            title: t('dashboard.orders', "Kantite Kòmande"),
            value: stats?.totalOrders || 0,
            description: t('dashboard.orders_desc', "Total resi ki bay"),
            icon: ShoppingCart,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            growth: dateRange?.from && dateRange?.to ? null : stats?.ordersPercentage
        },
        {
            title: t('dashboard.low_stock', "Stock ki Ba"),
            value: stats?.lowStockCount || 0,
            description: t('dashboard.low_stock_desc', "Pwodwi ki bezwen achte"),
            icon: Package,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <FileStack className="h-8 w-8 text-blue-500" />
                        {t('reports.title', "Analytics & Rapports")}
                    </h2>
                    <p className="text-slate-400">
                        {t('reports.subtitle', "Wè kijan biznis la ap mache ak done reyèl")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "bg-slate-800 border-white/10 text-white min-w-[240px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: getDateLocale() })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: getDateLocale() })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: getDateLocale() })
                                    )
                                ) : (
                                    <span>{t('reports.select_date', "Chwazi dat")}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="end">
                            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                <span className="text-xs text-slate-400">{t('reports.select_period', "Chwazi peryòd")}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] text-blue-500 hover:text-blue-400 hover:bg-white/5"
                                    onClick={() => setIsCalendarOpen(false)}
                                >
                                    {t('common.done', "OK")}
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                numberOfMonths={2}
                                locale={getDateLocale()}
                                modifiers={{
                                    hasSales: (date) => salesDates.includes(format(date, "yyyy-MM-dd"))
                                }}
                                modifiersClassNames={{
                                    hasSales: "bg-blue-500/20 text-blue-400 font-bold border-b-2 border-blue-500 rounded-none hover:bg-blue-500/30 transition-colors"
                                }}
                                className="bg-slate-900 border-none text-white"
                            />
                        </PopoverContent>
                    </Popover>

                    {dateRange && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDateRange({
                                from: subDays(new Date(), 7),
                                to: new Date(),
                            })}
                            className="bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                <Download className="h-4 w-4" />
                                {t('common.export', "Export")}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                            <DropdownMenuItem
                                onClick={handleExportCSV}
                                className="hover:bg-white/5 cursor-pointer gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                <span>{t('reports.export_csv', "Telechaje CSV")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleExportPDF}
                                className="hover:bg-white/5 cursor-pointer gap-2"
                            >
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span>{t('reports.export_pdf', "Telechaje PDF")}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsCards.map((card, i) => (
                    <Card key={i} className="bg-slate-900/50 border-white/10 backdrop-blur-xl border-l-4 border-l-transparent hover:border-l-current transition-all overflow-hidden" style={{ borderLeftColor: card.color.includes('emerald') ? '#10b981' : card.color.includes('blue') ? '#3b82f6' : card.color.includes('orange') ? '#f59e0b' : '#f43f5e' }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-500" /> : card.value}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                {card.description}
                                {card.growth !== undefined && card.growth !== null && (
                                    <span className={cn(
                                        "ml-auto text-[10px] font-bold px-1 rounded",
                                        card.growth >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                                    )}>
                                        {card.growth >= 0 ? "+" : ""}{card.growth}%
                                    </span>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Sales Chart */}
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-white text-lg font-medium">{t('reports.sales_trend', "Tandans Lavant (Vant pa Jou)")}</CardTitle>
                    <CardDescription className="text-slate-400">{t('reports.sales_trend_desc', "Montre evolisyon lavant ou sou peryòd chwazi a")}</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] pt-4">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 italic">
                            <Loader2 className="h-8 w-8 animate-spin mr-2" />
                            {t('common.loading', "Ap chaje done yo...")}
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 italic">
                            {t('common.no_data_period', "Okenn done poko disponib pou peryòd sa")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: getDateLocale() })}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickFormatter={(val) => `${val > 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                    formatter={(val: any) => [`${val} HTG`, t('dashboard.revenue', "Revenue")]}
                                    labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: getDateLocale() })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* POS Performance */}
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-500" />
                        {t('reports.pos_performance', "Pèfòmans pa Pwen de Vant")}
                    </CardTitle>
                    <CardDescription className="text-slate-400">{t('reports.pos_performance_desc', "Konparezon lavant ak pwofi pou chak filyal")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">{t('reports.pos_name', "Pwen de Vant")}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('reports.pos_orders', "Lòd")}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('reports.pos_sales', "Lavant")}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('reports.pos_profit', "Pwofi")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                            {t('common.loading', "Ap chaje...")}
                                        </td>
                                    </tr>
                                ) : posData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                            {t('common.no_data', "Okenn done poko disponib")}
                                        </td>
                                    </tr>
                                ) : (
                                    posData.map((pos, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-white">{pos.name}</td>
                                            <td className="px-4 py-4 text-sm text-right text-slate-300">{pos.totalOrders}</td>
                                            <td className="px-4 py-4 text-sm text-right text-emerald-400 font-medium">{formatCurrency(pos.totalSales)}</td>
                                            <td className="px-4 py-4 text-sm text-right text-blue-400 font-medium">{formatCurrency(pos.totalProfit)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Reports Access */}
                <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">{t('reports.detailed_reports', "Aksè Rapò Detaye")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-24 flex flex-col gap-2">
                            <ShoppingCart className="h-6 w-6 text-emerald-500" />
                            <span>{t('reports.sales_report', "Rapò Lavant")}</span>
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-24 flex flex-col gap-2">
                            <Truck className="h-6 w-6 text-orange-500" />
                            <span>{t('reports.purchase_report', "Rapò Acha")}</span>
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-24 flex flex-col gap-2">
                            <Package className="h-6 w-6 text-blue-500" />
                            <span>{t('reports.stock_report', "Rapò Stock")}</span>
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-24 flex flex-col gap-2">
                            <Users className="h-6 w-6 text-purple-500" />
                            <span>{t('reports.customer_report', "Rapò Kliyan")}</span>
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-blue-600/20 border-blue-500/30 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">{t('reports.note_data', "Note sou Done yo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-300 space-y-4">
                        <p>{t('reports.profit_disclaimer', "Done pwofi yo se yon estimasyon baze sou dènye pri ou antre nan sistèm nan. Pou gen yon rapò ki pi presi, asire ou toujou antre pri acha (Cost Price) kòrèk lè w ap resevwa stock.")}</p>
                        <p>{t('reports.date_range_info', "Ou ka chwazi nenpòt peryòd dat ou vle pou w wè rezilta biznis ou sou tèm sa.")}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
