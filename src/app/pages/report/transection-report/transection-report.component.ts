import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface TransactionItem {
  name: any;
  code: any;
  item: any;
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
  party: string;                // supplier for Inward, customer for Outward
  items: TransactionItem[];
  totalAmount: number;
  referenceNo: string;
}

@Component({
  selector: 'app-transection-report',
  standalone: false,
  templateUrl: './transection-report.component.html',
  styleUrl: './transection-report.component.css'
})
export class TransectionReportComponent {

  runningBalanceMap = new Map<string, number>(); //new variable to track running balance

  // Filter model
  fromDate: string = '';
  toDate: string = '';
  transactionType: 'All' | 'Inward' | 'Outward' = 'All';
  itemType: string = '';
  partyFilter: string = '';

  // All transactions merged
  allTransactions: UnifiedTransaction[] = [];
  filteredTransactions: UnifiedTransaction[] = [];

  // Summary metrics
  totalInwardCount: number = 0;
  totalInwardSum: number = 0;
  totalOutwardCount: number = 0;
  totalOutwardSum: number = 0;
  netInventoryValue: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadAllTransactions();
    this.applyFilter();
  }

  private loadAllTransactions(): void {
    // Load Inward from x
    const rawInvert = localStorage.getItem('invertTransactions'); // ✅ Correct key
    const invertTxs = rawInvert ? JSON.parse(rawInvert) : [];

    // Load Outward from localStorage
    const rawOutvert = localStorage.getItem('outvert-transactions'); // ✅ Correct key
    const outvertTxs = rawOutvert ? JSON.parse(rawOutvert) : [];

    // Map Inward
    const inwardUnified: UnifiedTransaction[] = invertTxs.map((tx: any) => ({
      date: tx.date,
      transactionId: tx.transactionId,
      type: 'Inward',
      party: tx.supplier,
      items: tx.items.map((it: any) => ({
        itemCode: it.item?.code || it.itemCode || it.name || 'N/A',
        itemName: it.item?.name || it.itemName || it.name || it.itemCode || 'N/A',

        quantity: it.quantity,
        rate: it.rate,
        amount: it.amount
      })),

      totalAmount: tx.totalAmount,
      referenceNo: tx.referenceNo || ''
    }));

    // Map Outward
    const outwardUnified: UnifiedTransaction[] = outvertTxs.map((tx: any) => ({
      date: tx.date,
      transactionId: tx.transactionId,
      type: 'Outward',
      party: tx.customer,
      items: tx.items.map((it: any) => ({
        itemCode: it.item?.code || it.itemCode || 'N/A',
        itemName: it.item?.name || it.itemName || it.itemCode || 'N/A',
        quantity: it.quantity,
        rate: it.rate,
        amount: it.amount
      })),

      totalAmount: tx.totalAmount,
      referenceNo: tx.referenceNo || ''
    }));

    this.allTransactions = [...inwardUnified, ...outwardUnified]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  applyFilter(): void {
    const from = this.fromDate ? new Date(this.fromDate) : null;
    const to = this.toDate ? new Date(this.toDate) : null;

    this.runningBalance = 0;
    this.runningBalanceMap.clear();


    this.filteredTransactions = this.allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      const dateMatch =
        (!from || txDate >= from) &&
        (!to || txDate <= to);

      const typeMatch =
        this.transactionType === 'All' ||
        tx.type === this.transactionType;

      const itemMatch =
        !this.itemType ||
        tx.items.some(it => it.itemCode.toLowerCase().includes(this.itemType.toLowerCase()) ||
          it.itemName.toLowerCase().includes(this.itemType.toLowerCase()));

      const partyMatch =
        !this.partyFilter ||
        tx.party.toLowerCase().includes(this.partyFilter.toLowerCase());

      return dateMatch && typeMatch && itemMatch && partyMatch;
    });

    this.calculateSummary();
  }

  resetFilter(): void {
    this.fromDate = '';
    this.toDate = '';
    this.transactionType = 'All';
    this.itemType = '';
    this.partyFilter = '';
    // this.applyFilter();
  }

  private calculateSummary(): void {
    this.totalInwardCount = 0;
    this.totalInwardSum = 0;
    this.totalOutwardCount = 0;
    this.totalOutwardSum = 0;

    this.filteredTransactions.forEach(tx => {
      if (tx.type === 'Inward') {
        this.totalInwardCount++;
        this.totalInwardSum += tx.totalAmount;
      } else {
        this.totalOutwardCount++;
        this.totalOutwardSum += tx.totalAmount;
      }
    });

    this.netInventoryValue = this.totalInwardSum - this.totalOutwardSum;
  }

  viewTransaction(tx: UnifiedTransaction): void {
    // For simplicity, navigate to a detail page if exists,
    // or just alert details
    alert(`Viewing transaction:\n\nID: ${tx.transactionId}\nType: ${tx.type}\nParty: ${tx.party}`);
  }

  printReport(): void {
    window.print();
  }

  exportToExcel(): void {
    // Simplest: convert JSON to CSV and trigger download
    const headers = [
      'Date',
      'Transaction ID',
      'Type',
      'Party',
      'Item Details',
      'Quantity',
      'Rate',
      'Amount',
      'Reference No'
    ];
    const rows = this.filteredTransactions.map(tx => {
      // Flatten items into a single string
      const itemDetails = tx.items
        .map(it => `${it.item?.code || it.itemCode || it.itemName || 'N/A'} (${it.quantity})`)
        .join('; ');
      const totalQty = tx.items.reduce((sum, it) => sum + it.quantity, 0);
      return [
        tx.date,
        tx.transactionId,
        tx.type,
        tx.party,
        itemDetails,
        totalQty.toString(),
        tx.items.length ? tx.items[0].rate.toString() : '',
        tx.totalAmount.toString(),
        tx.referenceNo
      ];
    });

    let csvContent = headers.join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  getTotalQuantity(tx: UnifiedTransaction): number {
    return tx.items.reduce((sum, it) => sum + it.quantity, 0);
  }

  runningBalance = 0;

  getRunningBalance(tx: UnifiedTransaction): number {
    if (!this.runningBalanceMap.has(tx.transactionId)) {
      if (tx.type === 'Inward') {
        this.runningBalance += tx.totalAmount;
      } else {
        this.runningBalance -= tx.totalAmount;
      }
      this.runningBalanceMap.set(tx.transactionId, this.runningBalance);
    }
    return this.runningBalanceMap.get(tx.transactionId)!;
  }



}
