const API_BASE_URL = 'http://localhost:3001/api'; // Correct backend URL

function kasaProApp() {
    return {
        activeTab: 'dashboard',
        paymentType: 'income',
        isViewOnly: false,
        showAddMember: false,
        showMonthDetail: false,
        showDetailModal: false,
        selectedMonth: null,
        monthDetailTab: 'unpaid',
        detailType: '',
        memberSearch: '',
        reportSearch: '',
        reportFilter: { month: '', year: '', status: '' },
        settings: {
            organizationName: 'KasaPro',
            activeMonth: '6',
            monthlyFee: 100000
        },
        memberForm: { id: null, name: '', phone: '', address: '', rayon: '' },
        incomeForm: { type: 'member', memberId: '', year: '', months: [], amount: 0, method: 'cash', description: '' },
        installmentForm: { memberId: '', month: '', amount: 0, method: 'cash', description: '' },
        expenseForm: { name: '', category: '', amount: 0, method: 'cash', description: '' },
        members: [],
        months: [
            { id: '1', name: 'Januari', paidPercentage: 0, installmentPercentage: 0 },
            { id: '2', name: 'Februari', paidPercentage: 0, installmentPercentage: 0 },
            { id: '3', name: 'Maret', paidPercentage: 0, installmentPercentage: 0 },
            { id: '4', name: 'April', paidPercentage: 0, installmentPercentage: 0 },
            { id: '5', name: 'Mei', paidPercentage: 0, installmentPercentage: 0 },
            { id: '6', name: 'Juni', paidPercentage: 0, installmentPercentage: 0 },
            { id: '7', name: 'Juli', paidPercentage: 0, installmentPercentage: 0 },
            { id: '8', name: 'Agustus', paidPercentage: 0, installmentPercentage: 0 },
            { id: '9', name: 'September', paidPercentage: 0, installmentPercentage: 0 },
            { id: '10', name: 'Oktober', paidPercentage: 0, installmentPercentage: 0 },
            { id: '11', name: 'November', paidPercentage: 0, installmentPercentage: 0 },
            { id: '12', name: 'Desember', paidPercentage: 0, installmentPercentage: 0 }
        ],
        transactions: [],
        isLoading: false, // Track loading state

        async fetchData(retries = 3) {
            if (this.isLoading) return;
            this.isLoading = true;
            try {
                const [membersRes, transactionsRes, settingsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/members`, { headers: { 'Content-Type': 'application/json' } }),
                    fetch(`${API_BASE_URL}/transactions`, { headers: { 'Content-Type': 'application/json' } }),
                    fetch(`${API_BASE_URL}/settings`, { headers: { 'Content-Type': 'application/json' } })
                ]);
                if (!membersRes.ok || !transactionsRes.ok || !settingsRes.ok) {
                    const errors = [];
                    if (!membersRes.ok) errors.push(`Members: ${membersRes.statusText}`);
                    if (!transactionsRes.ok) errors.push(`Transactions: ${transactionsRes.statusText}`);
                    if (!settingsRes.ok) errors.push(`Settings: ${settingsRes.statusText}`);
                    throw new Error(`Failed to fetch data: ${errors.join(', ')}`);
                }
                this.members = await membersRes.json();
                this.transactions = await transactionsRes.json();
                this.settings = await settingsRes.json();

                this.months.forEach(month => {
                    const paidMembers = this.getMonthDetailPaidMembers(month).length;
                    const unpaidMembers = this.getMonthDetailUnpaidMembers(month).length;
                    const totalMembers = this.members.length;
                    month.paidPercentage = totalMembers > 0 ? (paidMembers / totalMembers * 100).toFixed(1) : 0;
                    month.installmentPercentage = 0;
                });
            } catch (error) {
                console.error('Error fetching data:', error);
                if (retries > 0) {
                    console.log(`Retrying fetchData (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    return this.fetchData(retries - 1);
                }
                alert('Gagal mengambil data setelah beberapa percobaan: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
        },

        getTotalOverall() {
            const income = this.transactions
                .filter(t => t.type === 'income' || t.type === 'installment')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
            const expense = this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
            return income - expense;
        },

        getTotalCash() {
            return this.transactions
                .filter(t => t.method === 'cash')
                .reduce((sum, t) => sum + (t.type === 'expense' ? -parseFloat(t.amount || 0) : parseFloat(t.amount || 0)), 0);
        },

        getTotalTransfer() {
            return this.transactions
                .filter(t => t.method === 'transfer')
                .reduce((sum, t) => sum + (t.type === 'expense' ? -parseFloat(t.amount || 0) : parseFloat(t.amount || 0)), 0);
        },

        getTotalIncome() {
            return this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getCashIncome() {
            return this.transactions
                .filter(t => t.type === 'income' && t.method === 'cash')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getTransferIncome() {
            return this.transactions
                .filter(t => t.type === 'income' && t.method === 'transfer')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getTotalExpense() {
            return this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getCashExpense() {
            return this.transactions
                .filter(t => t.type === 'expense' && t.method === 'cash')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getTransferExpense() {
            return this.transactions
                .filter(t => t.type === 'expense' && t.method === 'transfer')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        getUnpaidMembers() {
            return this.members.filter(member => {
                return !this.transactions.some(t => 
                    (t.type === 'income' || t.type === 'installment') && 
                    t.member_id === member.id && 
                    t.month_id === this.settings.active_month &&
                    t.year === '2025'
                );
            });
        },

        getPaidMembers() {
            return this.members.filter(member => {
                return this.transactions.some(t => 
                    t.type === 'income' && 
                    t.member_id === member.id && 
                    t.month_id === this.settings.active_month &&
                    t.year === '2025'
                );
            });
        },

        getMonthDetailUnpaidMembers(month) {
            if (!month || !month.id) return [];
            return this.members.filter(member => {
                return !this.transactions.some(t => 
                    (t.type === 'income' || t.type === 'installment') && 
                    t.member_id === member.id && 
                    t.month_id === month.id &&
                    t.year === '2025'
                );
            });
        },

        getMonthDetailPaidMembers(month) {
            if (!month || !month.id) return [];
            return this.members.filter(member => {
                return this.transactions.some(t => 
                    t.type === 'income' && 
                    t.member_id === member.id && 
                    t.month_id === month.id &&
                    t.year === '2025'
                );
            });
        },

        filteredMembers() {
            return this.members.filter(member => 
                member.name.toLowerCase().includes(this.memberSearch.toLowerCase())
            );
        },

        getMemberInstallmentPaid(memberId) {
            return this.transactions
                .filter(t => t.type === 'installment' && t.member_id === memberId)
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        },

        async addMember() {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            if (!this.memberForm.name || !this.memberForm.phone || !this.memberForm.rayon) {
                alert('Harap lengkapi nama, telepon, dan rayon.');
                return;
            }
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE_URL}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.memberForm)
                });
                const data = await response.json();
                if (response.ok) {
                    this.showAddMember = false;
                    this.memberForm = { id: null, name: '', phone: '', address: '', rayon: '' };
                    await this.fetchData();
                    alert('Anggota berhasil disimpan!');
                } else {
                    alert(`Gagal menyimpan anggota: ${data.error || 'Unknown error'} - ${data.details || ''}`);
                }
            } catch (error) {
                console.error('Error saving member:', error);
                alert('Error menyimpan anggota: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        editMember(member) {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            this.memberForm = { ...member };
            this.showAddMember = true;
        },

        async addIncomeTransaction() {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            if (this.incomeForm.type === 'member' && (!this.incomeForm.memberId || !this.incomeForm.months.length || !this.incomeForm.year)) {
                alert('Harap lengkapi member, bulan, dan tahun.');
                return;
            }
            this.isLoading = true;
            try {
                if (this.incomeForm.type === 'member') {
                    const member = this.members.find(m => m.id === this.incomeForm.memberId);
                    for (const monthId of this.incomeForm.months) {
                        const response = await fetch(`${API_BASE_URL}/transactions`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'income',
                                description: `Iuran ${member.name} - ${this.months.find(m => m.id === monthId).name} ${this.incomeForm.year}`,
                                amount: this.settings.monthlyFee,
                                method: this.incomeForm.method,
                                memberId: this.incomeForm.memberId,
                                month: monthId,
                                year: this.incomeForm.year
                            })
                        });
                        if (!response.ok) {
                            const data = await response.json();
                            throw new Error(data.error || 'Failed to add transaction');
                        }
                    }
                } else {
                    if (!this.incomeForm.amount || !this.incomeForm.description) {
                        alert('Harap lengkapi jumlah dan deskripsi.');
                        return;
                    }
                    const response = await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'income',
                            description: this.incomeForm.description || 'Transaksi Manual',
                            amount: this.incomeForm.amount,
                            method: this.incomeForm.method
                        })
                    });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to add transaction');
                    }
                }
                this.incomeForm = { type: 'member', memberId: '', year: '', months: [], amount: 0, method: 'cash', description: '' };
                await this.fetchData();
                alert('Transaksi pendapatan berhasil ditambahkan!');
            } catch (error) {
                console.error('Error adding income transaction:', error);
                alert('Error menambahkan transaksi pendapatan: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        async addInstallmentTransaction() {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            if (!this.installmentForm.memberId || !this.installmentForm.month || !this.installmentForm.amount) {
                alert('Harap lengkapi member, bulan, dan jumlah.');
                return;
            }
            this.isLoading = true;
            try {
                const member = this.members.find(m => m.id === this.installmentForm.memberId);
                const month = this.months.find(m => m.id === this.installmentForm.month);
                const response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'installment',
                        description: `Cicilan ${member.name} - ${month.name}`,
                        amount: this.installmentForm.amount,
                        method: this.incomeForm.method,
                        memberId: this.installmentForm.memberId,
                        month: this.installmentForm.month,
                        year: '2025'
                    })
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to add transaction');
                }
                this.installmentForm = { memberId: '', month: '', amount: 0, method: 'cash', description: '' };
                await this.fetchData();
                alert('Transaksi cicilan berhasil ditambahkan!');
            } catch (error) {
                console.error('Error adding installment transaction:', error);
                alert('Error menambahkan transaksi cicilan: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        async addExpenseTransaction() {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            if (!this.expenseForm.name || !this.expenseForm.amount || !this.expenseForm.category) {
                alert('Harap lengkapi nama, jumlah, dan kategori.');
                return;
            }
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'expense',
                        description: this.expenseForm.name,
                        amount: this.expenseForm.amount,
                        method: this.expenseForm.method,
                        category: this.expenseForm.category
                    })
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to add transaction');
                }
                this.expenseForm = { name: '', category: '', amount: 0, method: 'cash', description: '' };
                await this.fetchData();
                alert('Transaksi pengeluaran berhasil ditambahkan!');
            } catch (error) {
                console.error('Error adding expense transaction:', error);
                alert('Error menambahkan transaksi pengeluaran: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        getFilteredReports() {
            let reports = this.members.flatMap(member => {
                return this.months.map(month => {
                    const income = this.transactions.find(t => 
                        t.type === 'income' && 
                        t.member_id === member.id && 
                        t.month_id === month.id &&
                        (!this.reportFilter.year || t.year === this.reportFilter.year)
                    );
                    const installment = this.transactions
                        .filter(t => 
                            t.type === 'installment' && 
                            t.member_id === member.id && 
                            t.month_id === month.id &&
                            (!this.reportFilter.year || t.year === this.reportFilter.year)
                        )
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

                    return {
                        id: `${member.id}-${month.id}`,
                        memberName: member.name,
                        month: month.name,
                        status: income ? 'paid' : installment > 0 ? 'installment' : 'unpaid',
                        amount: income ? parseFloat(this.settings.monthlyFee) : installment,
                        installmentPaid: installment,
                        method: income ? income.method : this.transactions.find(t => t.type === 'installment' && t.member_id === member.id && t.month_id === month.id)?.method || ''
                    };
                });
            });

            if (this.reportSearch) {
                reports = reports.filter(r => r.memberName.toLowerCase().includes(this.reportSearch.toLowerCase()));
            }
            if (this.reportFilter.month) {
                reports = reports.filter(r => r.month === this.months.find(m => m.id === this.reportFilter.month).name);
            }
            if (this.reportFilter.status) {
                reports = reports.filter(r => r.status === this.reportFilter.status);
            }

            return reports;
        },

        exportToCSV() {
            const reports = this.getFilteredReports();
            const headers = ['No', 'Nama Anggota', 'Bulan', 'Status', 'Jumlah', 'Metode'];
            const rows = reports.map((r, i) => [
                i + 1,
                r.memberName,
                r.month,
                r.status === 'paid' ? 'Lunas' : r.status === 'installment' ? `Cicilan (${this.formatCurrency(r.installmentPaid)})` : 'Belum Bayar',
                this.formatCurrency(r.amount),
                r.method || '-'
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'laporan_pembayaran.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        showDetailModal(type) {
            this.detailType = type;
            this.showDetailModal = true;
        },

        async saveSettings() {
            if (this.isViewOnly) {
                alert('Pengawas hanya dapat melihat data.');
                return;
            }
            if (!this.settings.organizationName || !this.settings.activeMonth || !this.settings.monthlyFee) {
                alert('Harap lengkapi semua pengaturan.');
                return;
            }
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE_URL}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.settings)
                });
                if (response.ok) {
                    alert('Pengaturan berhasil disimpan!');
                    await this.fetchData();
                } else {
                    const data = await response.json();
                    alert(`Gagal menyimpan pengaturan: ${data.error || 'Unknown error'} - ${data.details || ''}`);
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('Error menyimpan pengaturan: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        logout() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        },

        animateNumber(element, endValue, duration = 1000) {
            const startValue = 0;
            const startTime = performance.now();
            const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

            function update(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
                element.textContent = formatter.format(currentValue);
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        },

        async init() {
            if (!localStorage.getItem('isLoggedIn')) {
                window.location.href = 'login.html';
                return;
            }
            this.isViewOnly = localStorage.getItem('userRole') === 'pengawas';
            await this.fetchData();
            if (!this.selectedMonth && this.showMonthDetail) {
                this.selectedMonth = this.months.find(m => m.id === this.settings.active_month) || this.months[0];
            }
            if (this.activeTab === 'dashboard' && this.$refs.totalOverall) {
                const total = this.getTotalOverall();
                this.animateNumber(this.$refs.totalOverall, total, 1000);
            }
        }
    };
}