import * as electronNS from 'electron';
const electron = electronNS.default || electronNS;
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = electron;

import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let mainWindow = null;
let isQuitting = false;

// Main Store for Authentication (Users list only)
const authStore = new Store({
    name: 'config', // users stay in config.json
    projectName: 'Financas'
});


// Helper to get a specific user's data store (File: user-{id}.json)
const getUserStore = (userId) => {
    if (!userId) {
        throw new Error("User ID required for store access");
    }
    return new Store({
        name: `user-${userId}`,
        projectName: 'Financas'
    });
};

// --- DATA MIGRATION LOGIC (Root -> User File) ---
const performMigration = () => {
    // Check if legacy data exists in the main authStore root
    if (authStore.has('transactions') || authStore.has('goals')) {
        console.log('[MIGRATION] Legacy root data found. Starting migration to secure user file...');

        const users = authStore.get('users', []);
        if (users.length > 0) {
            const firstUser = users[0]; // Accounts created first own the data
            console.log(`[MIGRATION] Target: ${firstUser.name} (${firstUser.id})`);

            const userStore = getUserStore(firstUser.id);
            const keysToMove = ['transactions', 'fixedExpenses', 'fixedIncome', 'goals', 'investments'];

            keysToMove.forEach(key => {
                if (authStore.has(key)) {
                    console.log(`[MIGRATION] Moving ${key}...`);
                    userStore.set(key, authStore.get(key));
                    authStore.delete(key);
                }
            });
            console.log('[MIGRATION] Success. Root is clean.');
        }
    }

    // Check for "userData" nested object legacy (if the previous fix partial ran)
    // If we have userData.123... keys in config.json, move them too.
    const allConfig = authStore.store;
    if (allConfig.userData) {
        console.log('[MIGRATION] Found nested userData object. Splitting into files...');
        Object.keys(allConfig.userData).forEach(uId => {
            const uData = allConfig.userData[uId];
            const uStore = getUserStore(uId);
            uStore.set(uData); // Save all keys (transactions, etc) to file
        });
        authStore.delete('userData');
        console.log('[MIGRATION] userData object migrated and removed.');
    }
};

// Initialize
if (!authStore.has('users')) {
    authStore.set('users', []);
}
performMigration(); // Run on startup

// --- NOTIFICATION SYSTEM ---
const checkUpcomingExpenses = () => {
    // Windows Notification Setup
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.financas.app');
    }
    console.log('[NOTIFIER] Checking for upcoming expenses...');
    const users = authStore.get('users', []);
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 5); // 5 days from now
    const targetDay = targetDate.getDate();

    users.forEach(user => {

        try {
            const userStore = getUserStore(user.id);
            const expenses = userStore.get('fixedExpenses', []);

            expenses.forEach(expense => {
                const expenseDay = parseInt(expense.day);
                if (expenseDay === targetDay) {
                    new Notification({
                        title: 'Conta a Vencer 📅',
                        body: `Olá ${user.name.split(' ')[0]}, sua conta "${expense.name}" vence em 5 dias!`,
                        icon: path.join(__dirname, '../resources/icon.ico'),
                        urgent: true
                    }).show();
                    // TODO: Integrate actual WhatsApp API here (Twilio, Z-API, or local bot)
                }
            });
        } catch (e) {
            console.error(`[NOTIFIER] Error checking user ${user.id}:`, e);
        }
    });
};

// --- IPC HANDLERS ---

// Auth
ipcMain.handle('auth-check-users', () => {
    const users = authStore.get('users', []);
    return users.length > 0;
});

ipcMain.handle('auth-register', (event, { name, email, password, phone }) => {
    const users = authStore.get('users', []);
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email já cadastrado.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        email,
        phone, // New field
        salt,
        hash
    };

    authStore.set('users', [...users, newUser]);

    // Initialize new user file
    const newStore = getUserStore(newUser.id);
    newStore.set({
        transactions: [],
        fixedExpenses: [],
        fixedIncome: [],
        goals: [],
        investments: []
    });

    console.log(`[AUTH] New user ${newUser.id} registered and file created.`);
    return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone } };
});

ipcMain.handle('auth-login', (event, { email, password }) => {
    const users = authStore.get('users', []);
    const user = users.find(u => u.email === email);

    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

    if (hash === user.hash) {
        return { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } };
    } else {
        return { success: false, message: 'Senha incorreta.' };
    }
});

// Transactions
ipcMain.handle('get-transactions', (event, userId) => {
    if (!userId) return [];
    try {
        return getUserStore(userId).get('transactions', []);
    } catch (e) { return []; }
});

ipcMain.handle('add-transaction', (event, { userId, transaction }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const newTransactions = [{ ...transaction, id: Date.now().toString(), date: transaction.date || new Date().toISOString() }, ...transactions];
    store.set('transactions', newTransactions);
    return newTransactions;
});

ipcMain.handle('delete-transaction', (event, { userId, id }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const newTransactions = transactions.filter(t => t.id !== id);
    store.set('transactions', newTransactions);
    return newTransactions;
});

ipcMain.handle('update-transaction', (event, { userId, transaction }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...transaction };
        store.set('transactions', transactions);
    }
    return transactions;
});

// Monthly Status
ipcMain.handle('get-monthly-status', (event, userId) => {
    if (!userId) return {};
    const transactions = getUserStore(userId).get('transactions', []);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const status = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (t.fixedExpenseId) status[t.fixedExpenseId] = true;
            if (t.fixedIncomeId) status[t.fixedIncomeId] = true;
        }
    });
    return status;
});

// Register Fixed Expense
ipcMain.handle('register-fixed-expense', (event, { userId, expense }) => {
    if (!userId) return false;
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const now = new Date();

    const exists = transactions.some(t => {
        if (t.fixedExpenseId !== expense.id) return false;
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (exists) return false;

    const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: expense.name,
        amount: Math.abs(expense.amount),
        type: 'expense',
        category: expense.category || 'Despesas Fixas',
        date: now.toISOString(),
        fixedExpenseId: expense.id,
        status: 'completed'
    };
    store.set('transactions', [newTransaction, ...transactions]);
    return true;
});

// Fixed Expenses
ipcMain.handle('get-fixed-expenses', (event, userId) => {
    if (!userId) return [];
    return getUserStore(userId).get('fixedExpenses', []);
});

ipcMain.handle('add-fixed-expense', (event, { userId, expense }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedExpenses', []);
    const newItem = { ...expense, id: Date.now().toString() };
    store.set('fixedExpenses', [newItem, ...list]);
    return [newItem, ...list];
});

ipcMain.handle('update-fixed-expense', (event, { userId, expense }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedExpenses', []);
    const index = list.findIndex(e => e.id === expense.id);
    if (index !== -1) {
        list[index] = { ...list[index], ...expense };
        store.set('fixedExpenses', list);
    }
    return list;
});

ipcMain.handle('delete-fixed-expense', (event, { userId, id }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedExpenses', []);
    const newList = list.filter(i => i.id !== id);
    store.set('fixedExpenses', newList);
    return newList;
});

// Fixed Income
ipcMain.handle('get-fixed-income', (event, userId) => {
    if (!userId) return [];
    return getUserStore(userId).get('fixedIncome', []);
});

ipcMain.handle('add-fixed-income', (event, { userId, income }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedIncome', []);
    const newItem = { ...income, id: Date.now().toString() };
    store.set('fixedIncome', [newItem, ...list]);
    return [newItem, ...list];
});

ipcMain.handle('update-fixed-income', (event, { userId, income }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedIncome', []);
    const index = list.findIndex(i => i.id === income.id);
    if (index !== -1) {
        list[index] = { ...list[index], ...income };
        store.set('fixedIncome', list);
    }
    return list;
});

ipcMain.handle('delete-fixed-income', (event, { userId, id }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('fixedIncome', []);
    const newList = list.filter(i => i.id !== id);
    store.set('fixedIncome', newList);
    return newList;
});

// Unregister Handlers (Undo)
ipcMain.handle('unregister-fixed-expense', (event, { userId, id }) => {
    if (!userId) return false;
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const now = new Date();
    const newTransactions = transactions.filter(t => {
        if (t.fixedExpenseId !== id) return true;
        const d = new Date(t.date);
        return !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    });

    if (newTransactions.length !== transactions.length) {
        store.set('transactions', newTransactions);
        return true;
    }
    return false;
});

ipcMain.handle('unregister-fixed-income', (event, { userId, id }) => {
    if (!userId) return false;
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const now = new Date();
    const newTransactions = transactions.filter(t => {
        if (t.fixedIncomeId !== id) return true;
        const d = new Date(t.date);
        return !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    });

    if (newTransactions.length !== transactions.length) {
        store.set('transactions', newTransactions);
        return true;
    }
    return false;
});

ipcMain.handle('register-fixed-income', (event, { userId, income }) => {
    if (!userId) return false;
    const store = getUserStore(userId);
    const transactions = store.get('transactions', []);
    const now = new Date();

    const exists = transactions.some(t => {
        if (t.fixedIncomeId !== income.id) return false;
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (exists) return false;

    const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: income.name,
        amount: Math.abs(income.amount),
        type: 'income',
        category: income.category || 'Renda Fixa',
        date: now.toISOString(),
        fixedIncomeId: income.id,
        status: 'completed'
    };
    store.set('transactions', [newTransaction, ...transactions]);
    return true;
});

ipcMain.handle('check-fixed-expenses', () => false);
ipcMain.handle('check-fixed-income', () => false);

// Goals
ipcMain.handle('get-goals', (event, userId) => {
    if (!userId) return [];
    return getUserStore(userId).get('goals', []);
});

ipcMain.handle('add-goal', (event, { userId, goal }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('goals', []);
    const newItem = { ...goal, id: Date.now().toString(), currentAmount: 0 };
    store.set('goals', [newItem, ...list]);
    return [newItem, ...list];
});

ipcMain.handle('update-goal', (event, { userId, id, amount }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('goals', []);
    const index = list.findIndex(g => g.id === id);
    if (index !== -1) {
        list[index].currentAmount = Number(amount);
        store.set('goals', list);
    }
    return list;
});

ipcMain.handle('delete-goal', (event, { userId, id }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('goals', []);
    const newList = list.filter(i => i.id !== id);
    store.set('goals', newList);
    return newList;
});

// Investments
ipcMain.handle('get-investments', (event, userId) => {
    if (!userId) return [];
    return getUserStore(userId).get('investments', []);
});

ipcMain.handle('add-investment', (event, { userId, investment }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('investments', []);
    const newItem = {
        ...investment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        history: [{ date: new Date().toISOString(), value: investment.amount }]
    };
    store.set('investments', [newItem, ...list]);
    return [newItem, ...list];
});

ipcMain.handle('update-investment', (event, { userId, investment }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('investments', []);
    const index = list.findIndex(i => i.id === investment.id);
    if (index !== -1) {
        list[index] = { ...list[index], ...investment };
        store.set('investments', list);
    }
    return list;
});

ipcMain.handle('delete-investment', (event, { userId, id }) => {
    if (!userId) return [];
    const store = getUserStore(userId);
    const list = store.get('investments', []);
    const newList = list.filter(i => i.id !== id);
    store.set('investments', newList);
    return newList;
});

// --- IPC HANDLERS - ADMIN ---

// Verify password for Admin Access
ipcMain.handle('admin-verify-password', (event, { userId, password }) => {
    const users = authStore.get('users', []);
    const user = users.find(u => u.id === userId);

    if (!user) return false;

    // Hardcoded Admin Check for Alessandro
    const admins = ['aless0791naval@gmail.com'];
    if (!admins.includes(user.email)) {
        return false; // Not an admin
    }

    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    return hash === user.hash;
});

// Get all users
ipcMain.handle('admin-get-users', (event, requesterId) => {
    // Verify valid admin request could be added here, but frontend gates it mostly. 
    // Ideally we check if requesterId is admin.
    const users = authStore.get('users', []);
    return users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone }));
});

// Login with Biometrics (Trust Client)
ipcMain.handle('auth-login-biometric', (event, email) => {
    const users = authStore.get('users', []);
    const user = users.find(u => u.email === email);

    if (user) {
        return { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } };
    }
    return { success: false, message: 'Usuário não encontrado para biometria.' };
});

// Create User (Admin)
ipcMain.handle('admin-create-user', (event, { name, email, password, phone }) => {
    const users = authStore.get('users', []);
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email já cadastrado.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        email,
        phone,
        salt,
        hash
    };

    authStore.set('users', [...users, newUser]);

    // Initialize file
    const newStore = getUserStore(newUser.id);
    newStore.set({
        transactions: [],
        fixedExpenses: [],
        fixedIncome: [],
        goals: [],
        investments: []
    });

    return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone } };
});

// Update User
ipcMain.handle('admin-update-user', (event, { id, name, email, password, phone }) => {
    const users = authStore.get('users', []);
    const index = users.findIndex(u => u.id === id);

    if (index === -1) return { success: false, message: 'Usuário não encontrado' };

    const updatedUser = { ...users[index] };
    if (name) updatedUser.name = name;
    if (email) updatedUser.email = email;
    if (phone !== undefined) updatedUser.phone = phone;

    if (password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        updatedUser.salt = salt;
        updatedUser.hash = hash;
    }

    users[index] = updatedUser;
    authStore.set('users', users);
    return { success: true };
});

// Delete User
ipcMain.handle('admin-delete-user', (event, id) => {
    const users = authStore.get('users', []);
    const newUsers = users.filter(u => u.id !== id);

    if (users.length === newUsers.length) return false;

    authStore.set('users', newUsers);

    // Initial attempt to delete the file
    // Electron-store doesn't expose a direct 'deleteFile' easily on the instance without path knowledge or using 'fs'.
    // But since we use specific names, we can try to clear it or use fs.
    try {
        const fs = require('fs');
        // We need to construct the path. Electron-store saves typically in app.getPath('userData').
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, `user-${id}.json`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[ADMIN] Deleted user file: ${filePath}`);
        }
    } catch (error) {
        console.error(`[ADMIN] Failed to delete user file for ${id}:`, error);
    }

    return true;
});

// --- TRAY & WINDOW MANAGEMENT ---

function createTray() {
    const iconPath = path.join(__dirname, '../resources/icon.ico');
    // Ensure icon exists, fallback if not
    let icon = undefined;
    try {
        icon = nativeImage.createFromPath(iconPath);
    } catch (e) { console.error("Icon load failed", e); }

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir Finanças',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Finanças - Rodando em segundo plano');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        titleScale: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 30
        },
        icon: path.join(__dirname, '../resources/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
    });

    mainWindow.setMenuBarVisibility(false);

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle Close -> Minimize to Tray
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Start notification loop
    setTimeout(checkUpcomingExpenses, 5000);
    setInterval(checkUpcomingExpenses, 4 * 60 * 60 * 1000); // 4 hours

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Override default quit behavior
});
