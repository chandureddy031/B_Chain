class AIService {
    constructor() {
        this.apiKey = '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';
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.setupChatInterface();
    }

    setupChatInterface() {
        document.getElementById('sendChat').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessageToChat('user', message);
        input.value = '';

        try {
            const response = await this.getAIResponse(message);
            this.addMessageToChat('ai', response);
        } catch (error) {
            this.addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async getAIResponse(userMessage) {
        const financialContext = this.getFinancialContext();
        
        const prompt = `You are a financial advisor AI assistant. Based on the user's financial data:
        ${financialContext}
        
        User question: ${userMessage}
        
        Please provide helpful, personalized financial advice. Keep responses concise and actionable.`;

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful financial advisor AI. Provide practical, personalized advice based on the user\'s financial data.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateInsights(financialData) {
        const prompt = `Analyze this financial data and provide 3-4 key insights:
        
        Monthly Income: ${financialData.totalIncome}
        Monthly Expenses: ${financialData.totalExpenses}
        Net Income: ${financialData.netIncome}
        Top Spending Categories: ${Object.entries(financialData.categorySpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([cat, amount]) => `${cat}: ${amount}`)
            .join(', ')}
        
        Provide actionable insights about spending patterns, savings opportunities, and financial health.`;

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a financial analyst. Provide clear, actionable insights about financial data.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 400,
                    temperature: 0.6
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate insights');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI Insights Error:', error);
            return this.getFallbackInsights(financialData);
        }
    }

    getFallbackInsights(financialData) {
        const insights = [];
        
        // Savings rate insight
        const savingsRate = (financialData.netIncome / financialData.totalIncome) * 100;
        if (savingsRate > 20) {
            insights.push("🎉 Excellent savings rate! You're saving over 20% of your income.");
        } else if (savingsRate > 10) {
            insights.push("👍 Good savings rate. Consider increasing to 20% for optimal financial health.");
        } else {
            insights.push("⚠️ Low savings rate. Try to reduce expenses or increase income.");
        }

        // Spending pattern insight
        const topCategory = Object.entries(financialData.categorySpending)
            .sort(([,a], [,b]) => b - a)[0];
        if (topCategory) {
            insights.push(`💰 Your highest spending category is ${topCategory[0]} (${topCategory[1].toFixed(2)}). Consider if this aligns with your priorities.`);
        }

        // Budget adherence
        const budgetCategories = Object.keys(financialData.budgets);
        if (budgetCategories.length > 0) {
            insights.push("📊 You have budgets set for " + budgetCategories.length + " categories. Great job on planning!");
        } else {
            insights.push("📋 Consider setting budgets for your main expense categories to better track spending.");
        }

        // Transaction frequency
        if (financialData.transactionCount > 30) {
            insights.push("📈 High transaction frequency detected. Consider consolidating purchases to reduce impulse spending.");
        }

        return insights.slice(0, 3).join('\n\n');
    }

    getFinancialContext() {
        if (!window.app) return "No financial data available.";
        
        const summary = window.app.getFinancialSummary();
        return `
        Monthly Income: ${summary.totalIncome}
        Monthly Expenses: ${summary.totalExpenses}
        Net Income: ${summary.netIncome}
        Budget Categories: ${Object.keys(summary.budgets).join(', ')}
        Recent Transactions: ${summary.transactionCount}
        `;
    }
}

// Initialize AI service
const aiService = new AIService();