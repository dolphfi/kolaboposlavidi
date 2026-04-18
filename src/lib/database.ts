import Dexie, { Table } from 'dexie';

export interface PendingSale {
    id?: number;
    saleData: any;
    status: 'pending' | 'syncing' | 'failed';
    createdAt: string;
}

export class PosDatabase extends Dexie {
    products!: Table<any, string>;
    categories!: Table<any, string>;
    customers!: Table<any, string>;
    pendingSales!: Table<PendingSale, number>;

    constructor() {
        super('KolaboPosDB');
        this.version(1).stores({
            products: 'id, name, categoryId',
            categories: 'id, name, type',
            customers: 'id, firstName, lastName, phone',
            pendingSales: '++id, status, createdAt'
        });
    }
}

export const db = new PosDatabase();
