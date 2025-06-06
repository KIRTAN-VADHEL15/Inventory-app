import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-outvert-list',
  standalone: false,
  templateUrl: './outvert-list.component.html',
  styleUrl: './outvert-list.component.css'
})
export class OutvertListComponent {
    transactions: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedData = localStorage.getItem('outvert-transactions');
    this.transactions = storedData ? JSON.parse(storedData) : [];
  }

  deleteTransaction(index: number): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactions.splice(index, 1);
      localStorage.setItem('outvert-transactions', JSON.stringify(this.transactions));
    }
  }

  editTransaction(index: number): void {
    localStorage.setItem('editing-outvert-index', index.toString());
    this.router.navigate(['/main/transaction/outvert/form']);
  }

  addTransaction(): void {
    localStorage.removeItem('editing-outvert-index');
    this.router.navigate(['/main/transaction/outvert/form']);
  }
}
