export interface Transaction {
    id?: number;
    date: string;
    description: string;
    amount: number;
    category: string;
    merchant?: string;
    transactionType?: string;
    accountName?: string;
    is_recurring?: boolean;
}

export interface Category {
    id: number;
    name: string;
    keywords: string[]; // JSON string in DB, parsed array here
    icon: string;
}

export interface Subscription {
    id?: number;
    merchant: string;
    amount: number;
    frequency: string;
    last_charge_date: string;
    is_active: boolean;
}

export interface Goal {
    id?: number;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
}

export interface Insight {
    id: string;
    type: 'alert' | 'suggestion' | 'achievement' | 'opportunity';
    title: string;
    message: string;
    impact_amount?: number;
}
