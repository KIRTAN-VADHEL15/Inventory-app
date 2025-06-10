import { Component } from '@angular/core';

interface TransactionItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface UnifiedTransaction {
  date: string;
  transactionId: string;
  type: 'Inward' | 'Outward';
  party: string;
  items: TransactionItem[];
  totalAmount: number;
  referenceNo: string;
}

interface StockOnHand {
  itemCode: string;
  itemName: string;
  category?: string;
  onHandQty: number;
  lastRate: number;
  onHandValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastTransactionDate: string;
}

@Component({
  selector: 'app-summary-report',
  standalone: false,
  templateUrl: './summary-report.component.html',
  styleUrls: ['./summary-report.component.css']
})
export class SummaryReportComponent {

  showInwardDetails = false;
  showOutwardDetails = false;


  get inwardTransactions() {
    return this.allTransactions.filter(tx =>
      tx.type === 'Inward' &&
      (!this.filterUptoDate || new Date(tx.date) <= new Date(this.filterUptoDate))
    );
  }

  get outwardTransactions() {
    return this.allTransactions.filter(tx =>
      tx.type === 'Outward' &&
      (!this.filterUptoDate || new Date(tx.date) <= new Date(this.filterUptoDate))
    );
  }


  // Filter controls
  filterUptoDate: string = '';
  lowStockThreshold = 10;
  selectedCategory: string = 'All';

  // Data
  allTransactions: UnifiedTransaction[] = [];
  stockOnHandList: StockOnHand[] = [];
  categories: string[] = ['All', 'PVC Pipes', 'Fittings', 'Valves', 'Other'];

  // Summary metrics
  totalItemsCount: number = 0;
  totalInventoryValue: number = 0;
  lowStockItems: StockOnHand[] = [];
  outOfStockItems: StockOnHand[] = [];
  inventoryByCategory: { category: string, value: number }[] = [];

  // Transaction metrics
  inwardTransactionsCount: number = 0;
  outwardTransactionsCount: number = 0;
  inwardItemsCount: number = 0;
  outwardItemsCount: number = 0;

  // Chart data
  movementData = {
    labels: [] as string[],
    inward: [] as number[],
    outward: [] as number[]
  };

  constructor() {
    const today = new Date();
    this.filterUptoDate = today.toISOString().substring(0, 10);
  }

  ngAfterViewInit(): void {
    this.loadAllTransactions();
  }

  private loadAllTransactions(): void {


    // 1. Load inward transactions with proper error handling
    let inwardUnified: UnifiedTransaction[] = [];
    try {
      const rawInvert = localStorage.getItem('invertTransactions') || '[]';
      const invertTxs = JSON.parse(rawInvert);

      inwardUnified = invertTxs.filter((tx: any) => tx && (!this.filterUptoDate || new Date(tx.date) <= new Date(this.filterUptoDate)))
      .map((tx: any) => ({
        date: tx.date || new Date().toISOString().split('T')[0],
        transactionId: tx.transactionId || 'N/A-' + Math.random().toString(36).substring(2, 9),
        type: 'Inward',
        party: tx.supplier || 'Unknown',
        items: (tx.items || [])
          .filter((it: any) => it && (it.itemCode || it.item?.code) && it.quantity)
          .map((it: any) => ({
            itemCode: it.item?.code || it.itemCode || 'N/A',
            itemName: it.item?.name || it.itemName || 'N/A',
            quantity: Number(it.quantity) || 0,
            rate: Number(it.rate) || 0,
            amount: Number(it.amount) || 0
          })),
        totalAmount: Number(tx.totalAmount) || 0,
        referenceNo: tx.referenceNo || ''
      }))
      .filter((tx: any) => tx.items.length > 0);
    
    console.log('Loaded Inward Transactions:', inwardUnified);
  } catch (e) {
    console.error('Error loading inward transactions:', e);
  }


    // 2. Load outward transactions
    let outwardUnified: UnifiedTransaction[] = [];
    try {
      const rawOutvert = localStorage.getItem('outvert-transactions') || '[]';
      const outvertTxs = JSON.parse(rawOutvert);

      outwardUnified = outvertTxs.map((tx: any) => ({
        date: tx.date || new Date().toISOString().split('T')[0],
        transactionId: tx.transactionId || 'N/A',
        type: 'Outward',
        party: tx.customer || 'Unknown',
        items: (tx.items || []).map((it: any) => ({
          itemCode: it.itemCode || 'N/A',
          itemName: it.itemName || 'N/A',
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0
        })),
        totalAmount: Number(tx.totalAmount) || 0,
        referenceNo: tx.referenceNo || ''
      }));
    } catch (e) {
      console.error('Error loading outward transactions:', e);
    }

    // 3. Merge with proper validation
    this.allTransactions = [...inwardUnified, ...outwardUnified]
      .filter(tx => tx.items.length > 0) // Remove empty transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Loaded transactions:', this.allTransactions);
    this.computeStockOnHand();
  }

  private calculateTransactionMetrics(): void {

    // Reset counts first
    this.inwardTransactionsCount = 0;
    this.outwardTransactionsCount = 0;
    this.inwardItemsCount = 0;
    this.outwardItemsCount = 0;

    // Count all transactions regardless of date first (for debugging)
    const totalInward = this.allTransactions.filter(tx => tx.type === 'Inward').length;
    const totalOutward = this.allTransactions.filter(tx => tx.type === 'Outward').length;
    console.log('Total Inward:', totalInward, 'Total Outward:', totalOutward);

    // Filter transactions based on date
    const filteredTransactions = this.allTransactions.filter(tx =>
      !this.filterUptoDate || new Date(tx.date) <= new Date(this.filterUptoDate)
    );

    this.inwardTransactionsCount = filteredTransactions
      .filter(tx => {
        const isInward = tx.type === 'Inward';
        if (isInward) {
          console.log('Inward TX:', tx.transactionId, tx.date, tx.items.length, 'items');
        }
        return isInward;
      })
      .length;
    this.outwardTransactionsCount = filteredTransactions
      .filter(tx => tx.type === 'Outward')
      .length;

    this.inwardItemsCount = filteredTransactions
      .filter(tx => tx.type === 'Inward')
      .reduce((sum, tx) => sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    this.outwardItemsCount = filteredTransactions
      .filter(tx => tx.type === 'Outward')
      .reduce((sum, tx) => sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

       console.log('Filtered Inward:', this.inwardTransactionsCount, 
              'Filtered Outward:', this.outwardTransactionsCount);
  }

  private computeStockOnHand(): void {
    const stockMap: Map<string, StockOnHand> = new Map();

    // 1. Process all valid transactions
    this.allTransactions.forEach(tx => {
      if (this.filterUptoDate && new Date(tx.date) > new Date(this.filterUptoDate)) {
        return;
      }

      tx.items.forEach(item => {
        if (!item.itemCode || item.itemCode === 'N/A') return;

        const stockItem = stockMap.get(item.itemCode) || {
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: this.determineCategory(item.itemName),
          onHandQty: 0,
          lastRate: item.rate > 0 ? item.rate : 0,
          onHandValue: 0,
          status: 'In Stock',
          lastTransactionDate: tx.date
        };

        // Update quantities
        if (tx.type === 'Inward') {
          stockItem.onHandQty += item.quantity;
          if (item.rate > 0) {
            stockItem.lastRate = item.rate;
          }
        } else {
          stockItem.onHandQty = Math.max(0, stockItem.onHandQty - item.quantity);
        }

        // Update status
        if (stockItem.onHandQty <= 0) {
          stockItem.status = 'Out of Stock';
        } else if (stockItem.onHandQty < this.lowStockThreshold) {
          stockItem.status = 'Low Stock';
        } else {
          stockItem.status = 'In Stock';
        }

        stockItem.lastTransactionDate = tx.date;
        stockItem.onHandValue = stockItem.onHandQty * stockItem.lastRate;
        stockMap.set(item.itemCode, stockItem);
      });
    });

    // 2. Convert to array
    this.stockOnHandList = Array.from(stockMap.values());

    // 3. Add summary row for all inventory
    const totalValue = this.stockOnHandList.reduce((sum, item) => sum + item.onHandValue, 0);
    const totalQty = this.stockOnHandList.reduce((sum, item) => sum + item.onHandQty, 0);

    this.stockOnHandList.unshift({
      itemCode: 'N/A',
      itemName: 'N/A',
      category: 'Other',
      onHandQty: totalQty,
      lastRate: totalQty > 0 ? totalValue / totalQty : 0,
      onHandValue: totalValue,
      status: totalQty > this.lowStockThreshold ? 'In Stock' :
        (totalQty > 0 ? 'Low Stock' : 'Out of Stock'),
      lastTransactionDate: this.filterUptoDate || new Date().toISOString().split('T')[0]
    });

    this.updateSummaryMetrics();
  }

  private updateSummaryMetrics(): void {
    this.totalItemsCount = this.stockOnHandList.length;
    this.totalInventoryValue = this.stockOnHandList.reduce((sum, item) => sum + item.onHandValue, 0);

    // Filter items properly
    this.lowStockItems = this.stockOnHandList.filter(item =>
      item.status === 'Low Stock' && item.onHandQty > 0
    );

    this.outOfStockItems = this.stockOnHandList.filter(item =>
      item.status === 'Out of Stock' || item.onHandQty <= 0
    );

    // Calculate transaction metrics
    this.calculateTransactionMetrics();
  }

  private determineCategory(itemName: string): string {
    if (itemName.toLowerCase().includes('pipe')) return 'PVC Pipes';
    if (itemName.toLowerCase().includes('fitting') || itemName.toLowerCase().includes('elbow')) return 'Fittings';
    if (itemName.toLowerCase().includes('valve')) return 'Valves';
    return 'Other';
  }

  private prepareChartData(): void {
    // Group by month for the chart
    const monthlyData: { [key: string]: { inward: number, outward: number } } = {};

    this.allTransactions.forEach(tx => {
      if (this.filterUptoDate && new Date(tx.date) > new Date(this.filterUptoDate)) {
        return; // Skip transactions after filter date
      }

      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { inward: 0, outward: 0 };
      }

      if (tx.type === 'Inward') {
        monthlyData[month].inward += tx.items.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        monthlyData[month].outward += tx.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    });

    // Convert to arrays for Chart.js
    this.movementData.labels = Object.keys(monthlyData).sort();
    this.movementData.inward = this.movementData.labels.map(month => monthlyData[month].inward);
    this.movementData.outward = this.movementData.labels.map(month => monthlyData[month].outward);
  }

  get filteredStock(): StockOnHand[] {
    return this.stockOnHandList.filter(item =>
      (this.selectedCategory === 'All' || item.category === this.selectedCategory)
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Low Stock': return 'text-warning';
      case 'Out of Stock': return 'text-danger';
      default: return 'text-success';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  onFilterChange(): void {
    this.computeStockOnHand();
    this.prepareChartData();
    this.calculateTransactionMetrics();
  }
  resetFilters(): void {
    const today = new Date();
    this.filterUptoDate = today.toISOString().substring(0, 10);
    this.selectedCategory = 'All';
    this.lowStockThreshold = 10;
    this.onFilterChange();
  }

  printReport(): void {
    window.print();
  }

  exportToExcel(): void {
    // In a real app, implement proper Excel export
    alert('Excel export would be implemented here');
  }
}