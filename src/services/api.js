const PRODUCTION_URL = 'https://conviteinterativo-production.up.railway.app';

const BASE_URL = window.location.origin.includes('localhost:5173')
    ? 'http://localhost:3000'
    : PRODUCTION_URL;

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

    updateFixedExpense: (userId, e) =>
        window.api ? window.api.updateFixedExpense(userId, e) : fetchAPI(`/fixed-expenses/${userId}/${e.id || e._id}`, { method: 'PUT', body: JSON.stringify(e) }),

    deleteFixedExpense: (userId, id) =>
        window.api ? window.api.deleteFixedExpense(userId, id) : fetchAPI(`/fixed-expenses/${userId}/${id}`, { method: 'DELETE' }),

    registerFixedExpense: (userId, e) =>
        window.api ? window.api.registerFixedExpense(userId, e) : fetchAPI(`/fixed-expenses/register/${userId}`, { method: 'POST', body: JSON.stringify(e) }),

    unregisterFixedExpense: (userId, id) =>
        window.api ? window.api.unregisterFixedExpense(userId, id) : fetchAPI(`/fixed-expenses/unregister/${userId}/${id}`, { method: 'POST' }),

    // Fixed Income
    getFixedIncome: (userId) =>
        window.api ? window.api.getFixedIncome(userId) : fetchAPI(`/fixed-income/${userId}`),

    addFixedIncome: (userId, i) =>
        window.api ? window.api.addFixedIncome(userId, i) : fetchAPI(`/fixed-income/${userId}`, { method: 'POST', body: JSON.stringify(i) }),

    updateFixedIncome: (userId, i) =>
        window.api ? window.api.updateFixedIncome(userId, i) : fetchAPI(`/fixed-income/${userId}/${i.id || i._id}`, { method: 'PUT', body: JSON.stringify(i) }),

    deleteFixedIncome: (userId, id) =>
        window.api ? window.api.deleteFixedIncome(userId, id) : fetchAPI(`/fixed-income/${userId}/${id}`, { method: 'DELETE' }),

    registerFixedIncome: (userId, i) =>
        window.api ? window.api.registerFixedIncome(userId, i) : fetchAPI(`/fixed-income/register/${userId}`, { method: 'POST', body: JSON.stringify(i) }),

    unregisterFixedIncome: (userId, id) =>
        window.api ? window.api.unregisterFixedIncome(userId, id) : fetchAPI(`/fixed-income/unregister/${userId}/${id}`, { method: 'POST' }),

    getMonthlyStatus: (userId) =>
        window.api ? window.api.getMonthlyStatus(userId) : fetchAPI(`/monthly-status/${userId}`),

    // Goals
    getGoals: (userId) =>
        window.api ? window.api.getGoals(userId) : fetchAPI(`/goals/${userId}`),

    addGoal: (userId, g) =>
        window.api ? window.api.addGoal(userId, g) : fetchAPI(`/goals/${userId}`, { method: 'POST', body: JSON.stringify(g) }),

    updateGoal: (userId, id, amount) =>
        window.api ? window.api.updateGoal(userId, id, amount) : fetchAPI(`/goals/${userId}/${id}`, { method: 'PUT', body: JSON.stringify({ amount }) }),

    deleteGoal: (userId, id) =>
        window.api ? window.api.deleteGoal(userId, id) : fetchAPI(`/goals/${userId}/${id}`, { method: 'DELETE' }),

    // Investments
    getInvestments: (userId) =>
        window.api ? window.api.getInvestments(userId) : fetchAPI(`/investments/${userId}`),

    addInvestment: (userId, i) =>
        window.api ? window.api.addInvestment(userId, i) : fetchAPI(`/investments/${userId}`, { method: 'POST', body: JSON.stringify(i) }),

    updateInvestment: (userId, i) =>
        window.api ? window.api.updateInvestment(userId, i) : fetchAPI(`/investments/${userId}/${i.id || i._id}`, { method: 'PUT', body: JSON.stringify(i) }),

    deleteInvestment: (userId, id) =>
        window.api ? window.api.deleteInvestment(userId, id) : fetchAPI(`/investments/${userId}/${id}`, { method: 'DELETE' }),

    // Admin
    verifyAdminPassword: (userId, password) =>
        window.api ? window.api.verifyAdminPassword(userId, password) : fetchAPI('/admin/verify', { method: 'POST', body: JSON.stringify({ userId, password }) }),

    getAdminUsers: (requesterId) =>
        window.api ? window.api.getAdminUsers(requesterId) : fetchAPI('/admin/users'),

    adminCreateUser: (data) =>
        window.api ? window.api.adminCreateUser(data) : fetchAPI('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

    adminUpdateUser: (data) =>
        window.api ? window.api.adminUpdateUser(data) : fetchAPI(`/admin/users/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),

    adminDeleteUser: (id) =>
        window.api ? window.api.adminDeleteUser(id) : fetchAPI(`/admin/users/${id}`, { method: 'DELETE' }),
};
