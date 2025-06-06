import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  uom: string;  // Unit of Measure (e.g., kg, pieces)
}

interface TransactionItem {
  item: InventoryItem;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvertTransaction {
  transactionId: string;
  date: string;
  supplier: string;
  referenceNo: string;
  items: TransactionItem[];
  totalAmount: number;
  receivedBy: string;
  warehouseLocation: string;
  notes: string;
}

@Component({
  selector: 'app-invert-form',
  standalone: false,
  templateUrl: './invert-form.component.html',
  styleUrl: './invert-form.component.css'
})
export class InvertFormComponent {
  suppliers = ['Supplier A', 'Supplier B', 'Supplier C'];
  warehouseLocations = ['Main Warehouse', 'Secondary Warehouse', 'Cold Storage'];
  inventoryItems: InventoryItem[] = [
    { id: '1', code: 'ITM-001', name: 'Steel Rods', uom: 'pieces' },
    { id: '2', code: 'ITM-002', name: 'Electrical Wires', uom: 'meters' },
    { id: '3', code: 'ITM-003', name: 'PVC Pipes', uom: 'feet' }
  ];

  currentTransaction: InvertTransaction = this.resetTransaction();
  transactionList: InvertTransaction[] = [];
  isEditing = false;
  editIndex: number = -1;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    const editData = localStorage.getItem('editInvert');

    if (editData) {
      const parsed = JSON.parse(editData);
      this.currentTransaction = parsed.transaction;
      this.isEditing = true;
      this.editIndex = parsed.index;
      localStorage.removeItem('editInvert'); // Optional: clean after use
    } else {
      this.currentTransaction = this.resetTransaction();
    }
  }

  // Add this method to fix the error
  compareItems(item1: InventoryItem, item2: InventoryItem): boolean {
    return item1 && item2 ? item1.id === item2.id : item1 === item2;
  }

  resetTransaction(): InvertTransaction {
    return {
      transactionId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      referenceNo: '',
      items: [{
        item: this.inventoryItems[0],
        quantity: 0,
        rate: 0,
        amount: 0
      }],
      totalAmount: 0,
      receivedBy: '',
      warehouseLocation: this.warehouseLocations[0],
      notes: ''
    };
  }

  addItem() {
    this.currentTransaction.items.push({
      item: this.inventoryItems[0],
      quantity: 0,
      rate: 0,
      amount: 0
    });
  }

  removeItem(index: number) {
    this.currentTransaction.items.splice(index, 1);
    this.calculateTotal();
  }

  updateItemAmount(index: number) {
    const item = this.currentTransaction.items[index];
    item.amount = item.quantity * item.rate;
    this.calculateTotal();
  }

  calculateTotal() {
    this.currentTransaction.totalAmount = this.currentTransaction.items.reduce(
      (sum, item) => sum + item.amount, 0
    );
  }

  saveTransaction() {
    const saved = localStorage.getItem('invertTransactions');
    const transactions = saved ? JSON.parse(saved) : [];
    


    const editingIndex = localStorage.getItem('editing-inwerd-index');
    if (editingIndex !== null) {
      transactions[+editingIndex] = this.currentTransaction;
      localStorage.removeItem('editing-inwerd-index');
    } else {
      transactions.push(this.currentTransaction); 
    }

    localStorage.setItem('invertTransactions', JSON.stringify(transactions));
    alert('Transaction saved successfully!');
    this.calculateTotal();

    if (this.isEditing) {
      this.transactionList[this.editIndex] = { ...this.currentTransaction };
    } else {
      this.transactionList.push({ ...this.currentTransaction });
    }
    this.saveToLocalStorage();
    this.resetForm();
    this.router.navigate(['/main/transaction/invert']);
  }

  editTransaction(transaction: InvertTransaction, index: number) {
    this.currentTransaction = JSON.parse(JSON.stringify(transaction));
    this.isEditing = true;
    this.editIndex = index;
  }

  deleteTransaction(index: number) {
    this.transactionList.splice(index, 1);
    this.saveToLocalStorage();
    if (this.isEditing && this.editIndex === index) {
      this.resetForm();
    }
  }

  resetForm() {
    this.currentTransaction = this.resetTransaction();
    this.isEditing = false;
    this.editIndex = -1;
    this.router.navigate(['/main/transaction/invert']);

  }

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

