import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LowStockProductsCardProps {
    products?: any[];
}

export const LowStockProductsCard: React.FC<LowStockProductsCardProps> = ({ products }) => {
    const { t } = useTranslation();

    const displayProducts = products || [];

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PR';
    };

    return (
        <Card className="shadow-sm h-full bg-white/5 backdrop-blur-sm border border-white/10 text-white flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 px-6 -mx-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('dashboard.low_stock_products')}</h3>
                    </div>

                    <Link to="/products">
                        <Button variant="link" className="text-xs font-medium text-slate-400 hover:text-white decoration-slate-600 hover:decoration-white h-auto p-0">
                            {t('dashboard.view_all')}
                        </Button>
                    </Link>
                </div>

                {/* List */}
                <div className="flex flex-col gap-4">
                    {displayProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* Product Image */}
                                <Avatar className="h-10 w-10 rounded-lg bg-orange-500/20">
                                    {product.imageUrl && <AvatarImage src={product.imageUrl} alt={product.productName} className="object-cover" />}
                                    <AvatarFallback className="bg-transparent text-orange-400 text-xs font-bold">
                                        <Package className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors truncate">
                                        {product.productName}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="text-orange-500 truncate">{t('dashboard.stock')}: {product.currentStock}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                {t('dashboard.add_stock')}
                            </button>
                        </div>
                    ))}
                    {displayProducts.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            {t('dashboard.no_records_found')}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
