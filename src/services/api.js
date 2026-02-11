const BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:3000'
    : window.location.origin;

const fetchAPI = async (path, options = {}) => {
    const response = await fetch(`${BASE_URL}/api${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'API Error');
    }
    return response.json();
};

export const api = {
    // Auth
    checkUsersExist: () =>
        window.api ? window.api.checkUsersExist() : fetchAPI('/auth/check'),

    registerUser: (data) =>
        window.api ? window.api.registerUser(data) : fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    loginUser: (data) =>
        window.api ? window.api.loginUser(data) : fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    loginBiometric: (email) =>
        window.api ? window.api.loginBiometric(email) : Promise.reject('Biometria não disponível na versão web'),

    // Transactions
    getTransactions: (userId) =>
        window.api ? window.api.getTransactions(userId) : fetchAPI(`/transactions/${userId}`),

    addTransaction: (userId, t) =>
        window.api ? window.api.addTransaction(userId, t) : fetchAPI(`/transactions/${userId}`, { method: 'POST', body: JSON.stringify(t) }),

    deleteTransaction: (userId, id) =>
        window.api ? window.api.deleteTransaction(userId, id) : fetchAPI(`/transactions/${userId}/${id}`, { method: 'DELETE' }),

    updateTransaction: (userId, t) =>
        window.api ? window.api.updateTransaction(userId, t) : fetchAPI(`/transactions/${userId}/${t.id || t._id}`, { method: 'PUT', body: JSON.stringify(t) }),

    // Fixed Expenses
    getFixedExpenses: (userId) =>
        window.api ? window.api.getFixedExpenses(userId) : fetchAPI(`/fixed-expenses/${userId}`),

    addFixedExpense: (userId, e) =>
        window.api ? window.api.addFixedExpense(userId, e) : fetchAPI(`/fixed-expenses/${userId}`, { method: 'POST', body: JSON.stringify(e) }),

    deleteFixedExpense: (userId, id) =>
        window.api ? window.api.deleteFixedExpense(userId, id) : fetchAPI(`/fixed-expenses/${userId}/${id}`, { method: 'DELETE' }),

    // Fixed Income
    getFixedIncome: (userId) =>
        window.api ? window.api.getFixedIncome(userId) : fetchAPI(`/fixed-income/${userId}`),

    addFixedIncome: (userId, i) =>
        window.api ? window.api.addFixedIncome(userId, i) : fetchAPI(`/fixed-income/${userId}`, { method: 'POST', body: JSON.stringify(i) }),

    deleteFixedIncome: (userId, id) =>
        window.api ? window.api.deleteFixedIncome(userId, id) : fetchAPI(`/fixed-income/${userId}/${id}`, { method: 'DELETE' }),

    getMonthlyStatus: (userId) =>
        window.api ? window.api.getMonthlyStatus(userId) : fetchAPI(`/monthly-status/${userId}`),

    // Goals & Investments (abbreviated for searchability)
    getGoals: (userId) =>
        window.api ? window.api.getGoals(userId) : fetchAPI(`/goals/${userId}`),

    getInvestments: (userId) =>
        window.api ? window.api.getInvestments(userId) : fetchAPI(`/investments/${userId}`),
};
