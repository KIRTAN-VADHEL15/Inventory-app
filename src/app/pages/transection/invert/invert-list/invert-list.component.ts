import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface InvertTransaction {
  transactionId: string;
  date: string;
  supplier: string;
  items: {
    itemCode: string;
    itemName: string;
    quantity: number;
    rate: number;
  }[];
  totalAmount: number;
}


@Component({
  selector: 'app-invert-list',
  standalone: false,
  templateUrl: './invert-list.component.html',
  styleUrl: './invert-list.component.css'
})
export class InvertListComponent {
  currentTransaction: InvertTransaction = this.resetTransaction();
  transactionList: InvertTransaction[] = [];
  isEditing = false;
  editIndex: number = -1;

   constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
  } 

   addTransaction() {
    localStorage.removeItem('editInvert');
    this.router.navigate(['/main/transaction/invert/form']);
  }

  editTransaction(transaction: InvertTransaction, index: number) {
    this.currentTransaction = JSON.parse(JSON.stringify(transaction));
    this.isEditing = true;
    this.editIndex = index;
    localStorage.setItem('editInvert', JSON.stringify({ transaction, index }));
    this.router.navigate(['/main/transaction/invert/form']);
  }

  deleteTransaction(index: number) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    this.transactionList.splice(index, 1);
    localStorage.setItem('invertTransactions', JSON.stringify(this.transactionList)); // ✅ Correct key
  }
}

  resetTransaction(): InvertTransaction {
    return {
      transactionId: 'INV' + new Date().getTime(),
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [],
      totalAmount: 0
    };
  }


  // resetForm() {
  //   this.currentTransaction = this.resetTransaction();
  //   this.isEditing = false;
  //   this.editIndex = -1;
  // }

  saveToLocalStorage() {
    localStorage.setItem('invertTransactions', JSON.stringify(this.transactionList));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('invertTransactions');
    if (data) {
      this.transactionList = JSON.parse(data);
    }
  }
}