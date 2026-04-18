import { useState, useEffect } from 'react';
import { db } from '../lib/database';
import salesService from '../context/api/salesService';
import { toast } from 'sonner';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true);
            toast.success("Ou konekte sou Entènèt! Ap chèche senkronize lavant d'atant yo...");
            await syncPendingSales();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Ou Offline! Lavant yo ap anrejistre an lokal kounye a.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync if online
        if (navigator.onLine) {
            syncPendingSales();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncPendingSales = async () => {
        try {
            // Find all that are not successfully synced
            const pendingSales = await db.pendingSales.filter(s => s.status === 'pending' || s.status === 'failed').toArray();
            if (pendingSales.length === 0) return;

            let successCount = 0;
            for (const sale of pendingSales) {
                try {
                    await db.pendingSales.update(sale.id!, { status: 'syncing' });
                    await salesService.create(sale.saleData);
                    await db.pendingSales.delete(sale.id!);
                    successCount++;
                } catch (error) {
                    console.error("Failed to sync sale", sale.id, error);
                    await db.pendingSales.update(sale.id!, { status: 'failed' });
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} lavant senkronize ak siksè!`);
            }
        } catch (error) {
            console.error("Error during sync pending sales:", error);
        }
    };

    return { isOnline, syncPendingSales };
};
