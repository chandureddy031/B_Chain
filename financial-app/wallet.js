class WalletService {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkConnection();
    }

    setupEventListeners() {
        document.getElementById('connectMetaMask').addEventListener('click', () => {
            this.connectMetaMask();
        });

        document.getElementById('connectWalletConnect').addEventListener('click', () => {
            this.connectWalletConnect();
        });

        document.getElementById('disconnectWallet').addEventListener('click', () => {
            this.disconnect();
        });

        // Blockchain operation buttons
        document.getElementById('stakingBtn').addEventListener('click', () => {
            this.handleStaking();
        });

        document.getElementById('swapBtn').addEventListener('click', () => {
            this.handleTokenSwap();
        });

        document.getElementById('lendingBtn').addEventListener('click', () => {
            this.handleLending();
        });
    }

    async checkConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.setupWeb3();
                    this.account = accounts[0];
                    this.isConnected = true;
                    this.showApp();
                    await this.updateWalletInfo();
                } else {
                    this.showWalletModal();
                }
            } catch (error) {
                console.error('Error checking connection:', error);
                this.showWalletModal();
            }
        } else {
            this.showWalletModal();
        }
    }

    async connectMetaMask() {
        if (typeof window.ethereum === 'undefined') {
            this.showError('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            await this.setupWeb3();
            this.account = accounts[0];
            this.isConnected = true;
            
            this.showApp();
            await this.updateWalletInfo();
            this.setupAccountListener();
            
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            this.showError('Failed to connect to MetaMask. Please try again.');
        }
    }

    async connectWalletConnect() {
        // Simplified WalletConnect - in production, use @walletconnect/web3-provider
        this.showError('WalletConnect integration requires additional setup. Please use MetaMask for now.');
    }

    async setupWeb3() {
        this.web3 = new Web3(window.ethereum);
        
        // Add network switching capability
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }], // Ethereum Mainnet
            });
        } catch (switchError) {
            console.log('Network switch error:', switchError);
        }
    }

    setupAccountListener() {
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.account = accounts[0];
                await this.updateWalletInfo();
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }

    async updateWalletInfo() {
        if (!this.isConnected || !this.account) return;

        try {
            // Update wallet address display
            const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            document.getElementById('walletAddress').textContent = shortAddress;

            // Get ETH balance
            const balance = await this.web3.eth.getBalance(this.account);
            const ethBalance = this.web3.utils.fromWei(balance, 'ether');
            document.getElementById('walletBalance').textContent = `${parseFloat(ethBalance).toFixed(4)} ETH`;

            // Update crypto portfolio
            await this.updateCryptoPortfolio();

        } catch (error) {
            console.error('Error updating wallet info:', error);
        }
    }

    async updateCryptoPortfolio() {
        const container = document.getElementById('cryptoBalances');
        
        try {
            // Mock crypto data - in production, integrate with real APIs
            const mockPortfolio = [
                { symbol: 'ETH', balance: '2.5432', value: '$4,231.50', change: '+5.2%' },
                { symbol: 'BTC', balance: '0.1234', value: '$3,890.12', change: '+2.8%' },
                { symbol: 'USDC', balance: '1000.00', value: '$1,000.00', change: '0.0%' },
                { symbol: 'LINK', balance: '150.75', value: '$2,120.55', change: '-1.5%' }
            ];

            container.innerHTML = mockPortfolio.map(token => `
                <div class="crypto-item">
                    <div class="crypto-info">
                        <span class="crypto-symbol">${token.symbol}</span>
                        <span class="crypto-balance">${token.balance}</span>
                    </div>
                    <div class="crypto-value">
                        <span class="value">${token.value}</span>
                        <span class="change ${token.change.startsWith('+') ? 'positive' : token.change.startsWith('-') ? 'negative' : 'neutral'}">${token.change}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            container.innerHTML = '<p>Unable to load portfolio data</p>';
        }
    }

    async handleStaking() {
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            // Mock staking operation
            const stakingAmount = prompt('Enter ETH amount to stake:');
            if (!stakingAmount || isNaN(stakingAmount)) return;

            this.showNotification('Staking transaction initiated...', 'info');
            
            // Simulate transaction
            setTimeout(() => {
                this.showNotification(`Successfully staked ${stakingAmount} ETH!`, 'success');
                // Add staking transaction to financial records
                if (window.app) {
                    window.app.transactions.unshift({
                        id: Date.now(),
                        type: 'investment',
                        category: 'staking',
                        amount: parseFloat(stakingAmount) * 1650, // Convert to USD
                        description: `ETH Staking - ${stakingAmount} ETH`,
                        date: new Date().toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    });
                    window.app.saveTransactions();
                    window.app.updateDashboard();
                    window.app.renderTransactions();
                }
            }, 2000);

        } catch (error) {
            this.showError('Staking failed: ' + error.message);
        }
    }

    async handleTokenSwap() {
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            const fromToken = prompt('From token (e.g., ETH):');
            const toToken = prompt('To token (e.g., USDC):');
            const amount = prompt('Amount to swap:');
            
            if (!fromToken || !toToken || !amount || isNaN(amount)) return;

            this.showNotification('Token swap initiated...', 'info');
            
            // Simulate swap
            setTimeout(() => {
                this.showNotification(`Successfully swapped ${amount} ${fromToken} for ${toToken}!`, 'success');
                // Add swap transaction
                if (window.app) {
                    window.app.transactions.unshift({
                        id: Date.now(),
                        type: 'transfer',
                        category: 'crypto-swap',
                        amount: parseFloat(amount) * 1650, // Mock conversion
                        description: `Token Swap: ${amount} ${fromToken} → ${toToken}`,
                        date: new Date().toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    });
                    window.app.saveTransactions();
                    window.app.updateDashboard();
                    window.app.renderTransactions();
                }
            }, 2000);

        } catch (error) {
            this.showError('Token swap failed: ' + error.message);
        }
    }

    async handleLending() {
        if (!this.isConnected) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            const lendAmount = prompt('Enter amount to lend (ETH):');
            if (!lendAmount || isNaN(lendAmount)) return;

            this.showNotification('Lending transaction initiated...', 'info');
            
            // Simulate lending
            setTimeout(() => {
                this.showNotification(`Successfully lent ${lendAmount} ETH to lending pool!`, 'success');
                // Add lending transaction
                if (window.app) {
                    window.app.transactions.unshift({
                        id: Date.now(),
                        type: 'investment',
                        category: 'defi-lending',
                        amount: parseFloat(lendAmount) * 1650,
                        description: `DeFi Lending - ${lendAmount} ETH`,
                        date: new Date().toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    });
                    window.app.saveTransactions();
                    window.app.updateDashboard();
                    window.app.renderTransactions();
                }
            }, 2000);

        } catch (error) {
            this.showError('Lending failed: ' + error.message);
        }
    }

    disconnect() {
        this.account = null;
        this.isConnected = false;
        this.web3 = null;
        this.showWalletModal();
    }

    showApp() {
        document.getElementById('walletModal').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }

    showWalletModal() {
        document.getElementById('walletModal').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    showError(message) {
        document.getElementById('walletError').textContent = message;
        setTimeout(() => {
            document.getElementById('walletError').textContent = '';
        }, 5000);
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
}

// Initialize wallet service
const walletService = new WalletService();