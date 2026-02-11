import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, Transaction, FixedExpense, FixedIncome, Goal, Investment } from './electron/database/models.js';

const app = express();
app.use(cors());
app.use(express.json());

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
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
        res.json(transactions.map(t => ({ ...t, id: t._id.toString() })));
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
        await Transaction.updateOne({ _id: req.params.id, userId: req.params.userId }, { $set: req.body });
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

app.delete('/api/fixed-expenses/:userId/:id', async (req, res) => {
    try {
        await FixedExpense.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await FixedExpense.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
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

app.delete('/api/fixed-income/:userId/:id', async (req, res) => {
    try {
        await FixedIncome.deleteOne({ _id: req.params.id, userId: req.params.userId });
        const list = await FixedIncome.find({ userId: req.params.userId }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
});

// Monthly Status helper
app.get('/api/monthly-status/:userId', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const transactions = await Transaction.find({
            userId: req.params.userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const status = {};
        transactions.forEach(t => {
            if (t.fixedExpenseId) status[t.fixedExpenseId] = true;
            if (t.fixedIncomeId) status[t.fixedIncomeId] = true;
        });
        res.json(status);
    } catch (e) { res.json({}); }
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
        await Investment.create({ ...req.body, userId: req.params.userId, createdAt: new Date().toISOString() });
        const list = await Investment.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(list.map(i => ({ ...i, id: i._id.toString() })));
    } catch (e) { res.status(500).json([]); }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
