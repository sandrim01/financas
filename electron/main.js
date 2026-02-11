import * as electronNS from 'electron';
const electron = electronNS.default || electronNS;
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = electron;

import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, Transaction, FixedExpense, FixedIncome, Goal, Investment } from './database/models.js';

const MONGO_URI = 'mongodb://mongo:gOvpEUyQmhOMmddioVtdHlNCSPWyxhzh@turntable.proxy.rlwy.net:26312';

// Connect to MongoDB
const dbConnection = mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('[DB] Connected to MongoDB Registry');
        return true;
    })
    .catch(err => {
        console.error('[DB] Connection Error:', err);
        return false;
    });

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

// --- IPC HANDLERS ---
const checkUpcomingExpenses = async () => {
    // Windows Notification Setup
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.financas.app');
    }
    console.log('[NOTIFIER] Checking for upcoming expenses...');
    try {
        const users = await User.find({});
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + 5); // 5 days from now
        const targetDay = targetDate.getDate();

        for (const user of users) {
            const expenses = await FixedExpense.find({ userId: user._id, active: true });

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
        }
    } catch (e) {
        console.error('[NOTIFIER] Error checking expenses:', e);
    }
};

// --- IPC HANDLERS ---

// Auth
ipcMain.handle('auth-check-users', async () => {
    try {
        await dbConnection;
        const count = await User.countDocuments();
        return count > 0;
    } catch (e) { return false; }
});

ipcMain.handle('auth-register', async (event, { name, email, password, phone }) => {
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return { success: false, message: 'Email já cadastrado.' };
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newUser = await User.create({
            name,
            email,
            phone,
            salt,
            hash
        });

        console.log(`[AUTH] New user ${newUser.id} registered.`);
        return { success: true, user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, phone: newUser.phone } };
    } catch (e) {
        return { success: false, message: 'Erro ao registrar usuário.' };
    }
});

ipcMain.handle('auth-login', async (event, { email, password }) => {
    try {
        const user = await User.findOne({ email });
        if (!user) return { success: false, message: 'Usuário não encontrado.' };

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

        if (hash === user.hash) {
            return { success: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone } };
        } else {
            return { success: false, message: 'Senha incorreta.' };
        }
    } catch (e) {
        return { success: false, message: 'Erro ao realizar login.' };
    }
});

// Transactions
ipcMain.handle('get-transactions', async (event, userId) => {
    if (!userId) return [];
    try {
        const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();
        return transactions.map(t => ({ ...t, id: t._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('add-transaction', async (event, { userId, transaction }) => {
    if (!userId) return [];
    try {
        await Transaction.create({
            ...transaction,
            userId,
            date: transaction.date || new Date().toISOString()
        });
        const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();
        return transactions.map(t => ({ ...t, id: t._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('delete-transaction', async (event, { userId, id }) => {
    if (!userId) return [];
    try {
        await Transaction.deleteOne({ _id: id, userId });
        const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();
        return transactions.map(t => ({ ...t, id: t._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('update-transaction', async (event, { userId, transaction }) => {
    if (!userId) return [];
    try {
        const { id, _id, ...data } = transaction;
        await Transaction.updateOne({ _id: id || _id, userId }, { $set: data });
        const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();
        return transactions.map(t => ({ ...t, id: t._id.toString() }));
    } catch (e) { return []; }
});

// Monthly Status
ipcMain.handle('get-monthly-status', async (event, userId) => {
    if (!userId) return {};
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = await Transaction.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const status = {};
        transactions.forEach(t => {
            if (t.fixedExpenseId) status[t.fixedExpenseId] = true;
            if (t.fixedIncomeId) status[t.fixedIncomeId] = true;
        });
        return status;
    } catch (e) { return {}; }
});

// Register Fixed Expense
ipcMain.handle('register-fixed-expense', async (event, { userId, expense }) => {
    if (!userId) return false;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const exists = await Transaction.findOne({
            userId,
            fixedExpenseId: expense._id || expense.id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (exists) return false;

        await Transaction.create({
            userId,
            title: expense.name,
            amount: Math.abs(expense.amount),
            type: 'expense',
            category: expense.category || 'Despesas Fixas',
            date: now.toISOString(),
            fixedExpenseId: expense._id || expense.id,
            status: 'completed'
        });
        return true;
    } catch (e) { return false; }
});

// Fixed Expenses
ipcMain.handle('get-fixed-expenses', async (event, userId) => {
    if (!userId) return [];
    try {
        const list = await FixedExpense.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('add-fixed-expense', async (event, { userId, expense }) => {
    if (!userId) return [];
    try {
        await FixedExpense.create({ ...expense, userId });
        const list = await FixedExpense.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('update-fixed-expense', async (event, { userId, expense }) => {
    if (!userId) return [];
    try {
        const { id, _id, ...data } = expense;
        await FixedExpense.updateOne({ _id: id || _id, userId }, { $set: data });
        const list = await FixedExpense.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('delete-fixed-expense', async (event, { userId, id }) => {
    if (!userId) return [];
    try {
        await FixedExpense.deleteOne({ _id: id, userId });
        const list = await FixedExpense.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

// Fixed Income
ipcMain.handle('get-fixed-income', async (event, userId) => {
    if (!userId) return [];
    try {
        const list = await FixedIncome.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('add-fixed-income', async (event, { userId, income }) => {
    if (!userId) return [];
    try {
        await FixedIncome.create({ ...income, userId });
        const list = await FixedIncome.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('update-fixed-income', async (event, { userId, income }) => {
    if (!userId) return [];
    try {
        const { id, _id, ...data } = income;
        await FixedIncome.updateOne({ _id: id || _id, userId }, { $set: data });
        const list = await FixedIncome.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('delete-fixed-income', async (event, { userId, id }) => {
    if (!userId) return [];
    try {
        await FixedIncome.deleteOne({ _id: id, userId });
        const list = await FixedIncome.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

// Unregister Handlers (Undo)
ipcMain.handle('unregister-fixed-expense', async (event, { userId, id }) => {
    if (!userId) return false;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await Transaction.deleteOne({
            userId,
            fixedExpenseId: id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });
        return result.deletedCount > 0;
    } catch (e) { return false; }
});

ipcMain.handle('unregister-fixed-income', async (event, { userId, id }) => {
    if (!userId) return false;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await Transaction.deleteOne({
            userId,
            fixedIncomeId: id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });
        return result.deletedCount > 0;
    } catch (e) { return false; }
});

ipcMain.handle('register-fixed-income', async (event, { userId, income }) => {
    if (!userId) return false;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const exists = await Transaction.findOne({
            userId,
            fixedIncomeId: income._id || income.id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (exists) return false;

        await Transaction.create({
            userId,
            title: income.name,
            amount: Math.abs(income.amount),
            type: 'income',
            category: income.category || 'Renda Fixa',
            date: now.toISOString(),
            fixedIncomeId: income._id || income.id,
            status: 'completed'
        });
        return true;
    } catch (e) { return false; }
});

ipcMain.handle('check-fixed-expenses', () => false);
ipcMain.handle('check-fixed-income', () => false);

// Goals
ipcMain.handle('get-goals', async (event, userId) => {
    if (!userId) return [];
    try {
        const list = await Goal.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('add-goal', async (event, { userId, goal }) => {
    if (!userId) return [];
    try {
        await Goal.create({ ...goal, userId, currentAmount: 0 });
        const list = await Goal.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('update-goal', async (event, { userId, id, amount }) => {
    if (!userId) return [];
    try {
        await Goal.updateOne({ _id: id, userId }, { $set: { currentAmount: Number(amount) } });
        const list = await Goal.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('delete-goal', async (event, { userId, id }) => {
    if (!userId) return [];
    try {
        await Goal.deleteOne({ _id: id, userId });
        const list = await Goal.find({ userId }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

// Investments
ipcMain.handle('get-investments', async (event, userId) => {
    if (!userId) return [];
    try {
        const list = await Investment.find({ userId }).sort({ createdAt: -1 }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('add-investment', async (event, { userId, investment }) => {
    if (!userId) return [];
    try {
        await Investment.create({
            ...investment,
            userId,
            createdAt: new Date().toISOString(),
            history: [{ date: new Date().toISOString(), value: investment.amount }]
        });
        const list = await Investment.find({ userId }).sort({ createdAt: -1 }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('update-investment', async (event, { userId, investment }) => {
    if (!userId) return [];
    try {
        const { id, _id, ...data } = investment;
        await Investment.updateOne({ _id: id || _id, userId }, { $set: data });
        const list = await Investment.find({ userId }).sort({ createdAt: -1 }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

ipcMain.handle('delete-investment', async (event, { userId, id }) => {
    if (!userId) return [];
    try {
        await Investment.deleteOne({ _id: id, userId });
        const list = await Investment.find({ userId }).sort({ createdAt: -1 }).lean();
        return list.map(item => ({ ...item, id: item._id.toString() }));
    } catch (e) { return []; }
});

// --- IPC HANDLERS - ADMIN ---

// Verify password for Admin Access
ipcMain.handle('admin-verify-password', async (event, { userId, password }) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Hardcoded Admin Check for Alessandro
        const admins = ['aless0791naval@gmail.com'];
        if (!admins.includes(user.email)) {
            return false; // Not an admin
        }

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
        return hash === user.hash;
    } catch (e) { return false; }
});

// Get all users
ipcMain.handle('admin-get-users', async (event, requesterId) => {
    try {
        const users = await User.find({});
        return users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, phone: u.phone }));
    } catch (e) { return []; }
});

// Login with Biometrics (Trust Client)
ipcMain.handle('auth-login-biometric', async (event, email) => {
    try {
        const user = await User.findOne({ email });
        if (user) {
            return { success: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone } };
        }
        return { success: false, message: 'Usuário não encontrado para biometria.' };
    } catch (e) { return { success: false, message: 'Erro na biometria.' }; }
});

// Create User (Admin)
ipcMain.handle('admin-create-user', async (event, { name, email, password, phone }) => {
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return { success: false, message: 'Email já cadastrado.' };
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newUser = await User.create({
            name,
            email,
            phone,
            salt,
            hash
        });

        return { success: true, user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, phone: newUser.phone } };
    } catch (e) { return { success: false, message: 'Erro ao criar usuário.' }; }
});

// Update User
ipcMain.handle('admin-update-user', async (event, { id, name, email, password, phone }) => {
    try {
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        if (password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            updateData.salt = salt;
            updateData.hash = hash;
        }

        const result = await User.updateOne({ _id: id }, { $set: updateData });
        if (result.matchedCount === 0) return { success: false, message: 'Usuário não encontrado' };
        return { success: true };
    } catch (e) { return { success: false, message: 'Erro ao atualizar usuário.' }; }
});

// Delete User
ipcMain.handle('admin-delete-user', async (event, id) => {
    try {
        await User.deleteOne({ _id: id });
        // Also delete related data
        await Transaction.deleteMany({ userId: id });
        await FixedExpense.deleteMany({ userId: id });
        await FixedIncome.deleteMany({ userId: id });
        await Goal.deleteMany({ userId: id });
        await Investment.deleteMany({ userId: id });
        return true;
    } catch (e) { return false; }
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
