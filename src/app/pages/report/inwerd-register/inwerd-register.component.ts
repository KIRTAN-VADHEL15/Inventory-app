import { Component } from '@angular/core';

interface InwardItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InwardTransaction {
  date: string;
  transactionId: string;
  supplier: string;
  items: InwardItem[];
  totalAmount: number;
  referenceNo: string;
  receivedBy: string;
  warehouse: string;
}


@Component({
  selector: 'app-inwerd-register',
  standalone: false,
  templateUrl: './inwerd-register.component.html',
  styleUrl: './inwerd-register.component.css'
})
export class InwerdRegisterComponent {
  currentDate: Date = new Date();
  // Search filters
  searchDate: string = '';
  searchSupplier: string = '';
  searchItem: string = '';
  searchReference: string = '';
  searchReceivedBy: string = '';

  // All inward transactions
  allTransactions: InwardTransaction[] = [];
  filteredTransactions: InwardTransaction[] = [];

  // Summary metrics
  totalTransactions: number = 0;
  totalValue: number = 0;
  totalQuantity: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.loadTransactions();
    this.applyFilters();
  }

  private loadTransactions(): void {
    // Load from localStorage
    const rawData = localStorage.getItem('invertTransactions');
    if (rawData) {
      const savedData = JSON.parse(rawData);

      // Map to our interface
      this.allTransactions = savedData.map((tx: any) => ({
        date: tx.date,
        transactionId: tx.transactionId,
        supplier: tx.supplier,
        items: tx.items.map((it: any) => ({
          itemCode: it.item?.code || 'N/A',
          itemName: it.item?.name || 'N/A',
          quantity: it.quantity,
          rate: it.rate,
          amount: it.amount
        })),
        totalAmount: tx.totalAmount,
        referenceNo: tx.referenceNo || '',
        receivedBy: tx.receivedBy || '',
        warehouse: tx.warehouseLocation || ''
      }));
    }
  }

  applyFilters(): void {
    this.filteredTransactions = this.allTransactions.filter(tx => {
      // Date filter
      if (this.searchDate && tx.date !== this.searchDate) {
        return false;
      }

      // Supplier filter
      if (this.searchSupplier && !tx.supplier.toLowerCase().includes(this.searchSupplier.toLowerCase())) {
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

      // Received by filter
      if (this.searchReceivedBy && !tx.receivedBy.toLowerCase().includes(this.searchReceivedBy.toLowerCase())) {
        return false;
      }

      return true;
    });

    this.calculateSummary();
  }

  resetFilters(): void {
    this.searchDate = '';
    this.searchSupplier = '';
    this.searchItem = '';
    this.searchReference = '';
    this.searchReceivedBy = '';
    this.applyFilters();
  }

  private calculateSummary(): void {
    this.totalTransactions = this.filteredTransactions.length;
    this.totalValue = this.filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    this.totalQuantity = this.filteredTransactions.reduce((sum, tx) =>
      sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  }

  getTotalQuantity(items: InwardItem[]): number {
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
