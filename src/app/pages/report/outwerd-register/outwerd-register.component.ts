import { Component } from '@angular/core';

interface OutwardItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface OutwardTransaction {
  date: string;
  transactionId: string;
  customer: string;
  items: OutwardItem[];
  totalAmount: number;
  referenceNo: string;
  issuedBy: string;
  shipping: string;
}

@Component({
  selector: 'app-outwerd-register',
  standalone: false,
  templateUrl: './outwerd-register.component.html',
  styleUrl: './outwerd-register.component.css'
})
export class OutwerdRegisterComponent {
  // Search filters
  searchDate: string = '';
  searchCustomer: string = '';
  searchItem: string = '';
  searchReference: string = '';
  searchIssuedBy: string = '';

  // All outward transactions
  allTransactions: OutwardTransaction[] = [];
  filteredTransactions: OutwardTransaction[] = [];

  // Summary metrics
  totalTransactions: number = 0;
  totalValue: number = 0;
  totalQuantity: number = 0;
  currentDate = new Date();

  constructor() { }

  ngOnInit(): void {
    this.loadTransactions();
    this.applyFilters();
  }

  private loadTransactions(): void {
    // Load from localStorage
    const rawData = localStorage.getItem('outvert-transactions');
    if (rawData) {
      const savedData = JSON.parse(rawData);

      // Map to our interface
      this.allTransactions = savedData.map((tx: any) => ({
        date: tx.date,
        transactionId: tx.transactionId,
        customer: tx.customer,
        items: tx.items.map((it: any) => ({
          itemCode: it.itemCode || 'N/A',
          itemName: it.itemName || 'N/A',
          quantity: it.quantity,
          rate: it.rate,
          amount: it.amount
        })),
        totalAmount: tx.totalAmount,
        referenceNo: tx.referenceNo || '',
        issuedBy: tx.issuedBy || '',
        shipping: tx.shipping || ''
      }));
    }
  }

  applyFilters(): void {
    this.filteredTransactions = this.allTransactions.filter(tx => {
      // Date filter
      if (this.searchDate && tx.date !== this.searchDate) {
        return false;
      }

      // Customer filter
      if (this.searchCustomer && !tx.customer.toLowerCase().includes(this.searchCustomer.toLowerCase())) {
        return false;
      }

      // Item filter
      if (this.searchItem && !tx.items.some(item =>
        item.itemCode.toLowerCase().includes(this.searchItem.toLowerCase()) ||
        item.itemName.toLowerCase().includes(this.searchItem.toLowerCase())
      )) {
        return false;
      }

      // Reference filter
      if (this.searchReference && !tx.referenceNo.toLowerCase().includes(this.searchReference.toLowerCase())) {
        return false;
      }

      // Issued by filter
      if (this.searchIssuedBy && !tx.issuedBy.toLowerCase().includes(this.searchIssuedBy.toLowerCase())) {
        return false;
      }

      return true;
    });

    this.calculateSummary();
  }

  resetFilters(): void {
    this.searchDate = '';
    this.searchCustomer = '';
    this.searchItem = '';
    this.searchReference = '';
    this.searchIssuedBy = '';
    this.applyFilters();
  }

  private calculateSummary(): void {
    this.totalTransactions = this.filteredTransactions.length;
    this.totalValue = this.filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    this.totalQuantity = this.filteredTransactions.reduce((sum, tx) =>
      sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  }

  getTotalQuantity(items: OutwardItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }


  printReport(): void {
    window.print();
  }

  exportToExcel(): void {
    // Implementation would be similar to your previous export function
    alert('Export functionality would be implemented here');
  }
}
