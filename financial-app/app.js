class FinancialApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.budgets = JSON.parse(localStorage.getItem('budgets')) || {};
        this.chart = null;
        this.currentChartType = 'spending';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderTransactions();
        this.renderBudgets();
        this.initChart();
        this.populateFilters();
        this.generateAIInsights();
    }

    setupEventListeners() {
        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Budget form
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setBudget();
        });

        // Transaction type change
        document.getElementById('transactionType').addEventListener('change', (e) => {
            this.updateCategoryOptions(e.target.value);
        });

        // Chart tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentChartType = e.target.dataset.chart;
                this.updateChart();
            });
        });

        // Filters
        document.getElementById('filterType').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterCategory').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterMonth').addEventListener('change', () => this.applyFilters());

        // Set current date as default
        document.getElementById('transactionDate').valueAsDate = new Date();
    }

    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('transactionCategory');
        const categories = {
            'income': ['salary', 'freelance', 'investment-return', 'business', 'other-income'],
            'expense': ['food', 'transport', 'entertainment', 'utilities', 'healthcare', 'shopping', 'education', 'other-expense'],
            'investment': ['stocks', 'crypto', 'bonds', 'real-estate', 'mutual-funds'],
            'transfer': ['bank-transfer', 'wallet-transfer', 'savings', 'other-transfer']
        };

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        if (categories[type]) {
            categories[type].forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat.replace('-', ' ').toUpperCase();
                categorySelect.appendChild(option);
            });
        }
    }

    addTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transaction = {
            id: Date.now(),
            type: formData.get('transactionType') || document.getElementById('transactionType').value,
            category: formData.get('transactionCategory') || document.getElementById('transactionCategory').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            description: document.getElementById('transactionDescription').value,
            date: document.getElementById('transactionDate').value,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.generateAIInsights();
        
        // Reset form
        form.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        
        // Show success message
        this.showNotification('Transaction added successfully!', 'success');
    }

    setBudget() {
        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        
        this.budgets[category] = amount;
        this.saveBudgets();
        this.renderBudgets();
        this.updateChart();
        
        // Reset form
        document.getElementById('budgetForm').reset();
        this.showNotification('Budget set successfully!', 'success');
    }

    updateDashboard() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyTransactions = this.transactions.filter(t => t.date.startsWith(currentMonth));
        
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalInvestments = monthlyTransactions
            .filter(t => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalBalance = totalIncome - totalExpenses;
        const totalSavings = totalBalance > 0 ? totalBalance : 0;

        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('totalSavings').textContent = this.formatCurrency(totalSavings);

        // Update stat card colors based on values
        document.querySelector('.stat-card').className = `stat-card ${totalBalance >= 0 ? 'positive' : 'negative'}`;
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (this.transactions.length === 0) {
            container.innerHTML = '<p class="no-data">No transactions yet. Add your first transaction above!</p>';
            return;
        }

        container.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.category.replace('-', ' ')}</div>
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(Math.abs(transaction.amount))}
                </div>
                <button class="delete-btn" onclick="app.deleteTransaction(${transaction.id})">🗑️</button>
            </div>
        `).join('');
    }

    renderBudgets() {
        const container = document.getElementById('budgetItems');
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        if (Object.keys(this.budgets).length === 0) {
            container.innerHTML = '<p class="no-data">No budgets set yet.</p>';
            return;
        }

        container.innerHTML = Object.entries(this.budgets).map(([category, budgetAmount]) => {
            const spent = this.transactions
                .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);
                
            const percentage = (spent / budgetAmount) * 100;
            const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';
            
            return `
                <div class="budget-item ${status}">
                    <div class="budget-header">
                        <span class="budget-category">${category.replace('-', ' ').toUpperCase()}</span>
                        <span class="budget-amount">${this.formatCurrency(spent)} / ${this.formatCurrency(budgetAmount)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <span class="progress-text">${percentage.toFixed(1)}%</span>
                    </div>
                    <button class="delete-budget-btn" onclick="app.deleteBudget('${category}')">Remove</button>
                </div>
            `;
        }).join('');
    }

    initChart() {
        const ctx = document.getElementById('financialChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#F77EB9', '#FF9F40', '#C9CBCF', '#4BC0C0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        this.updateChart();
    }

    updateChart() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyTransactions = this.transactions.filter(t => t.date.startsWith(currentMonth));

        let data = {};
        let labels = [];
        let values = [];

        switch (this.currentChartType) {
            case 'spending':
                data = monthlyTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((acc, t) => {
                        acc[t.category] = (acc[t.category] || 0) + t.amount;
                        return acc;
                    }, {});
                break;
            case 'income':
                data = monthlyTransactions
                    .filter(t => t.type === 'income')
                    .reduce((acc, t) => {
                        acc[t.category] = (acc[t.category] || 0) + t.amount;
                        return acc;
                    }, {});
                break;
            case 'budget':
                Object.entries(this.budgets).forEach(([category, budget]) => {
                    const spent = monthlyTransactions
                        .filter(t => t.type === 'expense' && t.category === category)
                        .reduce((sum, t) => sum + t.amount, 0);
                    data[category] = budget - spent;
                });
                break;
        }

        labels = Object.keys(data);
        values = Object.values(data);

        this.chart.data.labels = labels.map(l => l.replace('-', ' ').toUpperCase());
        this.chart.data.datasets[0].data = values;
        this.chart.update();
    }

    populateFilters() {
        const categories = [...new Set(this.transactions.map(t => t.category))];
        const filterCategory = document.getElementById('filterCategory');
        
        filterCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.replace('-', ' ').toUpperCase();
            filterCategory.appendChild(option);
        });
    }

    applyFilters() {
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const monthFilter = document.getElementById('filterMonth').value;

        let filtered = this.transactions;

        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
        if (monthFilter) {
            filtered = filtered.filter(t => t.date.startsWith(monthFilter));
        }

        this.renderFilteredTransactions(filtered);
    }

    renderFilteredTransactions(transactions) {
        const container = document.getElementById('transactionsList');
        if (transactions.length === 0) {
            container.innerHTML = '<p class="no-data">No transactions match your filters.</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.category.replace('-', ' ')}</div>
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(Math.abs(transaction.amount))}
                </div>
                <button class="delete-btn" onclick="app.deleteTransaction(${transaction.id})">🗑️</button>
            </div>
        `).join('');
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.populateFilters();
        this.showNotification('Transaction deleted successfully!', 'success');
    }

    deleteBudget(category) {
        delete this.budgets[category];
        this.saveBudgets();
        this.renderBudgets();
        this.updateChart();
        this.showNotification('Budget removed successfully!', 'success');
    }

    async generateAIInsights() {
        const insights = document.getElementById('aiInsights');
        insights.innerHTML = '<p>🔄 Generating AI insights...</p>';

        try {
            const financialData = this.getFinancialSummary();
            const aiInsight = await aiService.generateInsights(financialData);
            insights.innerHTML = `<div class="ai-insight">${aiInsight}</div>`;
        } catch (error) {
            insights.innerHTML = '<p>⚠️ Unable to generate insights at the moment.</p>';
        }
    }

    getFinancialSummary() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyTransactions = this.transactions.filter(t => t.date.startsWith(currentMonth));
        
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const categorySpending = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        return {
            totalIncome,
            totalExpenses,
            netIncome: totalIncome - totalExpenses,
            categorySpending,
            budgets: this.budgets,
            transactionCount: monthlyTransactions.length
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    saveBudgets() {
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinancialApp();
});