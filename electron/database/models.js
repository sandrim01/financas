import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    externalId: String, // Original ID from electron-store
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    salt: String,
    hash: String,
    createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalId: String,
    title: String,
    amount: Number,
    type: { type: String, enum: ['income', 'expense'] },
    category: String,
    date: Date,
    fixedExpenseId: String,
    fixedIncomeId: String,
    status: { type: String, default: 'completed' }
});

const FixedExpenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalId: String,
    name: String,
    amount: Number,
    day: String,
    category: String,
    active: { type: Boolean, default: true }
});

const FixedIncomeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalId: String,
    name: String,
    amount: Number,
    day: String,
    category: String,
    active: { type: Boolean, default: true }
});

const GoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalId: String,
    title: String,
    targetAmount: Number,
    currentAmount: { type: Number, default: 0 },
    deadline: Date,
    category: String
});

const InvestmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalId: String,
    name: String,
    type: String, // Renda Fixa, Variável, etc
    amount: Number,
    status: String,
    createdAt: Date,
    history: [{ date: Date, value: Number }]
});

export const User = mongoose.model('User', UserSchema);
export const Transaction = mongoose.model('Transaction', TransactionSchema);
export const FixedExpense = mongoose.model('FixedExpense', FixedExpenseSchema);
export const FixedIncome = mongoose.model('FixedIncome', FixedIncomeSchema);
export const Goal = mongoose.model('Goal', GoalSchema);
export const Investment = mongoose.model('Investment', InvestmentSchema);
