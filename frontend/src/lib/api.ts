import axios from 'axios';

// Backend URL - typically localhost:3000 for local dev
const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const endpoints = {
    uploadTransactions: (csvContent: string) => api.post('/transactions/upload', { csvContent }),
    getTransactions: (params?: any) => api.get('/transactions', { params }),
    getSummary: (params?: { year?: string, month?: string }) => api.get('/transactions/summary', { params }),
    getMonthlySummary: (params?: { year?: string }) => api.get('/transactions/monthly-summary', { params }),
    getAvailableYears: () => api.get('/transactions/years'),
    getCategories: () => api.get('/transactions/categories'),
    addManualTransaction: (data: any) => api.post('/transactions/manual', data),
    getSubscriptions: () => api.get('/subscriptions'),
    getGoals: () => api.get('/goals'),
    createGoal: (data: any) => api.post('/goals', data),
    updateGoal: (id: number, amount: number) => api.put(`/goals/${id}`, { current_amount: amount }),
    deleteGoal: (id: number) => api.delete(`/goals/${id}`),

    getInsights: () => api.get('/advisor/insights'),
    getAdvice: () => api.post('/advisor/analyze'),
    getAnalytics: (params?: { year?: string }) => api.get('/transactions/analytics', { params }),
    getMLInsights: (params: { year: string, month: string }) => api.get('/transactions/ml-insights', { params }),
    flagInsight: (id: string, reason?: string) => api.post('/advisor/flag', { id, reason }),
    resetData: () => api.post('/debug/reset'),

    // Transactions
};
