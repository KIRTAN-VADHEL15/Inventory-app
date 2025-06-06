import { Component } from '@angular/core';
import { Router } from '@angular/router';
interface OutvertItem {
  item: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface OutvertTransaction {
  transactionId: string;
  date: string;
  customer: string;
  referenceNo: string;
  items: OutvertItem[];
  totalQty: number;
  totalAmount: number;
  issuedBy: string;
  shipping: string;
  notes: string;
}


@Component({
  selector: 'app-outvert-form',
  standalone: false,
  templateUrl: './outvert-form.component.html',
  styleUrl: './outvert-form.component.css'
})
export class OutvertFormComponent {
  customers = ['Customer A', 'Customer B', 'Customer C'];
  transaction: OutvertTransaction = this.resetTransaction();

  constructor(private router: Router) {}
    ngOnInit() {
    const editingIndex = localStorage.getItem('editing-outvert-index');
    const saved = localStorage.getItem('outvert-transactions');
    if (editingIndex !== null && saved) {
      const transactions = JSON.parse(saved);
      this.transaction = transactions[+editingIndex];
    }
  }


  resetTransaction(): OutvertTransaction {
    return {
      transactionId: 'OUT-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      customer: '',
      referenceNo: '',
      items: [this.createEmptyItem()],
      totalQty: 0,
      totalAmount: 0,
      issuedBy: '',
      shipping: '',
      notes: ''
    };
  }

  createEmptyItem(): OutvertItem {
    return { item: '', quantity: 0, rate: 0, amount: 0 };
  }

  addItem() {
    this.transaction.items.push(this.createEmptyItem());
  }

  removeItem(index: number) {
    this.transaction.items.splice(index, 1);
    this.calculateTotals();
  }

  updateAmount(index: number) {
    const item = this.transaction.items[index];
    item.amount = item.quantity * item.rate;
    this.calculateTotals();
  }

  calculateTotals() {
    this.transaction.totalQty = this.transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    this.transaction.totalAmount = this.transaction.items.reduce((sum, item) => sum + item.amount, 0);
  }

  saveTransaction() {
    const saved = localStorage.getItem('outvert-transactions');
    const transactions = saved ? JSON.parse(saved) : [];

    const editingIndex = localStorage.getItem('editing-outvert-index');
    if (editingIndex !== null) {
      transactions[+editingIndex] = this.transaction;
      localStorage.removeItem('editing-outvert-index');
    } else {
      transactions.push(this.transaction);
    }

    localStorage.setItem('outvert-transactions', JSON.stringify(transactions));
    alert('Transaction saved successfully!');
    this.router.navigate(['/main/transaction/outvert/list']);
  }


  cancel() {
    localStorage.removeItem('editing-outvert-index');
    this.router.navigate(['/main/transaction/outvert/list']);
  }

}
