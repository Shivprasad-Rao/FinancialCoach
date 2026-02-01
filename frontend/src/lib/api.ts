import axios from 'axios';

// Backend URL - from environment variable
const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
    getDashboardData: (params?: { year?: string, month?: string }) => api.get('/dashboard', { params }),

    getInsights: () => api.get('/insights'),
    getAdvice: () => api.post('/advisor/analyze'),
    getAnalytics: (params?: { year?: string }) => api.get('/transactions/analytics', { params }),
    getMLInsights: (params: { year: string, month: string }) => api.get('/transactions/ml-insights', { params }),
    flagInsight: (id: string, reason?: string) => api.post('/advisor/flag', { id, reason }),
    flagSubscription: (merchant: string, is_false_positive: boolean) => api.post('/subscriptions/flag', { merchant, is_false_positive }),
    resetData: () => api.post('/debug/reset'),

    // Auth
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (credentials: any) => api.post('/auth/register', credentials),
};
