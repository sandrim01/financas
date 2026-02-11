import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Transaction, FixedExpense, FixedIncome, Goal, Investment } from './electron/database/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

const MONGO_URI = 'mongodb://mongo:gOvpEUyQmhOMmddioVtdHlNCSPWyxhzh@turntable.proxy.rlwy.net:26312';

mongoose.connect(MONGO_URI)
    .then(() => console.log('[SERVER] Connected to MongoDB'))
    .catch(err => console.error('[SERVER] Connection Error:', err));

// Auth Endpoints
app.get('/api/auth/check', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json(count > 0);
    } catch (e) { res.status(500).json(false); }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email já cadastrado.' });

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newUser = await User.create({ name, email, phone, salt, hash });
        res.json({ success: true, user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, phone: newUser.phone } });
    } catch (e) { res.status(500).json({ success: false, message: 'Erro ao registrar.' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
        if (hash === user.hash) {
            res.json({ success: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone } });
        } else {
            res.status(401).json({ success: false, message: 'Senha incorreta.' });
        }
    } catch (e) { res.status(500).json({ success: false, message: 'Erro no login.' }); }
});

// Transactions
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const list = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        res.json(list.map(t => ({ ...t, id: t._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/transactions/:userId', async (req, res) => {
    try {
        await Transaction.create({ ...req.body, userId: req.params.userId, date: req.body.date || new Date().toISOString() });
        const list = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        res.json(list.map(t => ({ ...t, id: t._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/transactions/:userId/:id', async (req, res) => {
    try {
        await Transaction.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        res.json(list.map(t => ({ ...t, id: t._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/transactions/:userId/:id', async (req, res) => {
    try {
        const { id, _id, ...data } = req.body;
        await Transaction.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: data });
        const list = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        res.json(list.map(t => ({ ...t, id: t._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

// Fixed Expenses
app.get('/api/fixed-expenses/:userId', async (req, res) => {
    try {
        const list = await FixedExpense.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/fixed-expenses/:userId', async (req, res) => {
    try {
        await FixedExpense.create({ ...req.body, userId: req.params.userId });
        const list = await FixedExpense.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/fixed-expenses/:userId/:id', async (req, res) => {
    try {
        const { id, _id, ...data } = req.body;
        await FixedExpense.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: data });
        const list = await FixedExpense.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/fixed-expenses/:userId/:id', async (req, res) => {
    try {
        await FixedExpense.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await FixedExpense.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/fixed-expenses/register/:userId', async (req, res) => {
    const { userId } = req.params;
    const expense = req.body;
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const exists = await Transaction.findOne({ userId, fixedExpenseId: expense.id || expense._id, date: { $gte: start, $lte: end } });
        if (exists) return res.status(400).json(false);
        await Transaction.create({ userId, title: expense.name, amount: Math.abs(expense.amount), type: 'expense', category: expense.category || 'Despesas Fixas', date: now.toISOString(), fixedExpenseId: expense.id || expense._id, status: 'completed' });
        res.json(true);
    } catch (e) { res.status(500).json(false); }
});

app.post('/api/fixed-expenses/unregister/:userId/:id', async (req, res) => {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await Transaction.deleteOne({ userId: req.params.userId, fixedExpenseId: req.params.id, date: { $gte: start, $lte: end } });
        res.json(true);
    } catch (e) { res.status(500).json(false); }
});

// Fixed Income
app.get('/api/fixed-income/:userId', async (req, res) => {
    try {
        const list = await FixedIncome.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/fixed-income/:userId', async (req, res) => {
    try {
        await FixedIncome.create({ ...req.body, userId: req.params.userId });
        const list = await FixedIncome.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/fixed-income/:userId/:id', async (req, res) => {
    try {
        const { id, _id, ...data } = req.body;
        await FixedIncome.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: data });
        const list = await FixedIncome.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/fixed-income/:userId/:id', async (req, res) => {
    try {
        await FixedIncome.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await FixedIncome.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/fixed-income/register/:userId', async (req, res) => {
    const { userId } = req.params;
    const income = req.body;
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const exists = await Transaction.findOne({ userId, fixedIncomeId: income.id || income._id, date: { $gte: start, $lte: end } });
        if (exists) return res.status(400).json(false);
        await Transaction.create({ userId, title: income.name, amount: Math.abs(income.amount), type: 'income', category: income.category || 'Renda Fixa', date: now.toISOString(), fixedIncomeId: income.id || income._id, status: 'completed' });
        res.json(true);
    } catch (e) { res.status(500).json(false); }
});

app.post('/api/fixed-income/unregister/:userId/:id', async (req, res) => {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await Transaction.deleteOne({ userId: req.params.userId, fixedIncomeId: req.params.id, date: { $gte: start, $lte: end } });
        res.json(true);
    } catch (e) { res.status(500).json(false); }
});

// Monthly Status
app.get('/api/monthly-status/:userId', async (req, res) => {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const list = await Transaction.find({ userId: req.params.userId, date: { $gte: start, $lte: end } });
        const status = {};
        list.forEach(t => {
            if (t.fixedExpenseId) status[t.fixedExpenseId] = true;
            if (t.fixedIncomeId) status[t.fixedIncomeId] = true;
        });
        res.json(status);
    } catch (e) { res.json({}); }
});

// Goals
app.get('/api/goals/:userId', async (req, res) => {
    try {
        const list = await Goal.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/goals/:userId', async (req, res) => {
    try {
        await Goal.create({ ...req.body, userId: req.params.userId });
        const list = await Goal.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/goals/:userId/:id', async (req, res) => {
    try {
        await Goal.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: { currentAmount: Number(req.body.amount) } });
        const list = await Goal.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/goals/:userId/:id', async (req, res) => {
    try {
        await Goal.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await Goal.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

// Investments
app.get('/api/investments/:userId', async (req, res) => {
    try {
        const list = await Investment.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/investments/:userId', async (req, res) => {
    try {
        await Investment.create({ ...req.body, userId: req.params.userId, createdAt: new Date().toISOString(), history: [{ date: new Date().toISOString(), value: req.body.amount }] });
        const list = await Investment.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.put('/api/investments/:userId/:id', async (req, res) => {
    try {
        const { id, _id, ...data } = req.body;
        await Investment.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: data });
        const list = await Investment.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/investments/:userId/:id', async (req, res) => {
    try {
        await Investment.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await Investment.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

// Admin
app.post('/api/admin/verify', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.json(false);
        const admins = ['aless0791naval@gmail.com'];
        if (!admins.includes(user.email)) return res.json(false);
        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
        res.json(hash === user.hash);
    } catch (e) { res.json(false); }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, phone: u.phone })));
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/admin/users', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email já cadastrado.' });
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const newUser = await User.create({ name, email, phone, salt, hash });
        res.json({ success: true, user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, phone: newUser.phone } });
    } catch (e) { res.status(500).json({ success: false, message: 'Erro ao criar.' }); }
});

app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { password, ...data } = req.body;
        if (password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            data.salt = salt;
            data.hash = hash;
        }
        await User.updateOne({ _id: req.params.id }, { $set: data });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await User.deleteOne({ _id: req.params.id });
        await Promise.all([
            Transaction.deleteMany({ userId: req.params.id }),
            FixedExpense.deleteMany({ userId: req.params.id }),
            FixedIncome.deleteMany({ userId: req.params.id }),
            Goal.deleteMany({ userId: req.params.id }),
            Investment.deleteMany({ userId: req.params.id })
        ]);
        res.json(true);
    } catch (e) { res.status(500).json(false); }
});

// SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
