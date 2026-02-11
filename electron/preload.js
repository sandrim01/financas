import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getTransactions: () => ipcRenderer.invoke('get-transactions'),
    addTransaction: (t) => ipcRenderer.invoke('add-transaction', t),
    updateTransaction: (t) => ipcRenderer.invoke('update-transaction', t),
    deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id),

    getFixedExpenses: () => ipcRenderer.invoke('get-fixed-expenses'),
    addFixedExpense: (e) => ipcRenderer.invoke('add-fixed-expense', e),
    getMonthlyStatus: () => ipcRenderer.invoke('get-monthly-status'),
    registerFixedExpense: (e) => ipcRenderer.invoke('register-fixed-expense', e),
    unregisterFixedExpense: (id) => ipcRenderer.invoke('unregister-fixed-expense', id),

    getFixedIncome: () => ipcRenderer.invoke('get-fixed-income'),
    addFixedIncome: (i) => ipcRenderer.invoke('add-fixed-income', i),
    updateFixedIncome: (i) => ipcRenderer.invoke('update-fixed-income', i),
    deleteFixedIncome: (id) => ipcRenderer.invoke('delete-fixed-income', id),
    checkFixedIncome: () => ipcRenderer.invoke('check-fixed-income'),
    registerFixedIncome: (i) => ipcRenderer.invoke('register-fixed-income', i),
    unregisterFixedIncome: (id) => ipcRenderer.invoke('unregister-fixed-income', id),

    // Auth
    checkUsersExist: () => ipcRenderer.invoke('auth-check-users'),
    registerUser: (data) => ipcRenderer.invoke('auth-register', data),
    loginUser: (data) => ipcRenderer.invoke('auth-login', data),

    getGoals: () => ipcRenderer.invoke('get-goals'),
    addGoal: (g) => ipcRenderer.invoke('add-goal', g),
    updateGoal: (id, amount) => ipcRenderer.invoke('update-goal', { id, amount }),
    deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),

    getInvestments: () => ipcRenderer.invoke('get-investments'),
    addInvestment: (i) => ipcRenderer.invoke('add-investment', i),
    updateInvestment: (i) => ipcRenderer.invoke('update-investment', i),
    deleteInvestment: (id) => ipcRenderer.invoke('delete-investment', id),
});
