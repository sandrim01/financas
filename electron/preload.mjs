import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getTransactions: (userId) => ipcRenderer.invoke('get-transactions', userId),
    addTransaction: (userId, t) => ipcRenderer.invoke('add-transaction', { userId, transaction: t }),
    updateTransaction: (userId, t) => ipcRenderer.invoke('update-transaction', { userId, transaction: t }),
    deleteTransaction: (userId, id) => ipcRenderer.invoke('delete-transaction', { userId, id }),

    getFixedExpenses: (userId) => ipcRenderer.invoke('get-fixed-expenses', userId),
    addFixedExpense: (userId, e) => ipcRenderer.invoke('add-fixed-expense', { userId, expense: e }),
    updateFixedExpense: (userId, e) => ipcRenderer.invoke('update-fixed-expense', { userId, expense: e }),
    deleteFixedExpense: (userId, id) => ipcRenderer.invoke('delete-fixed-expense', { userId, id }),
    getMonthlyStatus: (userId) => ipcRenderer.invoke('get-monthly-status', userId),
    registerFixedExpense: (userId, e) => ipcRenderer.invoke('register-fixed-expense', { userId, expense: e }),
    unregisterFixedExpense: (userId, id) => ipcRenderer.invoke('unregister-fixed-expense', { userId, id }),

    getFixedIncome: (userId) => ipcRenderer.invoke('get-fixed-income', userId),
    addFixedIncome: (userId, i) => ipcRenderer.invoke('add-fixed-income', { userId, income: i }),
    updateFixedIncome: (userId, i) => ipcRenderer.invoke('update-fixed-income', { userId, income: i }),
    deleteFixedIncome: (userId, id) => ipcRenderer.invoke('delete-fixed-income', { userId, id }),
    checkFixedIncome: () => ipcRenderer.invoke('check-fixed-income'), // disabled
    registerFixedIncome: (userId, i) => ipcRenderer.invoke('register-fixed-income', { userId, income: i }),
    unregisterFixedIncome: (userId, id) => ipcRenderer.invoke('unregister-fixed-income', { userId, id }),

    // Auth (Global)
    checkUsersExist: () => ipcRenderer.invoke('auth-check-users'),
    registerUser: (data) => ipcRenderer.invoke('auth-register', data),
    loginUser: (data) => ipcRenderer.invoke('auth-login', data),
    loginBiometric: (email) => ipcRenderer.invoke('auth-login-biometric', email),

    getGoals: (userId) => ipcRenderer.invoke('get-goals', userId),
    addGoal: (userId, g) => ipcRenderer.invoke('add-goal', { userId, goal: g }),
    updateGoal: (userId, id, amount) => ipcRenderer.invoke('update-goal', { userId, id, amount }),
    deleteGoal: (userId, id) => ipcRenderer.invoke('delete-goal', { userId, id }),

    getInvestments: (userId) => ipcRenderer.invoke('get-investments', userId),
    addInvestment: (userId, i) => ipcRenderer.invoke('add-investment', { userId, investment: i }),
    updateInvestment: (userId, i) => ipcRenderer.invoke('update-investment', { userId, investment: i }),
    deleteInvestment: (userId, id) => ipcRenderer.invoke('delete-investment', { userId, id }),

    // Admin
    verifyAdminPassword: (userId, password) => ipcRenderer.invoke('admin-verify-password', { userId, password }),
    getAdminUsers: (requesterId) => ipcRenderer.invoke('admin-get-users', requesterId),
    adminCreateUser: (data) => ipcRenderer.invoke('admin-create-user', data),
    adminUpdateUser: (data) => ipcRenderer.invoke('admin-update-user', data),
    adminDeleteUser: (id) => ipcRenderer.invoke('admin-delete-user', id),
});
