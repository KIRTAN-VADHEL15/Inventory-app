import { Component, OnInit, inject } from '@angular/core'; // Added inject
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Added HttpClient
import { FormsModule } from '@angular/forms'; // Ensure module has it
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor

// Interface for Items fetched from backend (used in dropdown)
interface BackendItem {
  _id: string;
  code: string;
  name: string;
  // Add other fields if needed by the form, e.g., purchasePrice for rate default
  purchasePrice?: number;
}

// Interface for items within a transaction (payload for backend)
interface TransactionItemPayload {
  itemId: string; // Reference to BackendItem._id
  quantity: number;
  rate: number;
  amount: number;
}

// Interface for the InvertTransaction structure for POST/PUT requests
interface InvertTransactionPayload {
  _id?: string; // For updates
  transactionId: string;
  date: string;
  supplier: string;
  referenceNo: string;
  items: TransactionItemPayload[];
  totalAmount: number;
  receivedBy: string;
  warehouseLocation: string;
  notes: string;
}

// Interface for items as they are managed in the form's items array (includes full BackendItem object)
interface FormTransactionItem {
  item?: BackendItem; // The selected inventory item object
  itemId: string; // Still keep itemId separate for the payload
  quantity: number;
  rate: number;
  amount: number;
}

interface CurrentTransactionForm {
  _id?: string;
  transactionId: string;
  date: string;
  supplier: string;
  referenceNo: string;
  items: FormTransactionItem[]; // Use the FormTransactionItem for the form
  totalAmount: number;
  receivedBy: string;
  warehouseLocation: string;
  notes: string;
}

@Component({
  selector: 'app-invert-form',
  standalone: false,
  // imports: [CommonModule, FormsModule], // If standalone: true
  templateUrl: './invert-form.component.html',
  styleUrls: ['./invert-form.component.css']
})
export class InvertFormComponent implements OnInit {
  suppliers = ['Supplier A', 'Supplier B', 'Supplier C']; // Keep or fetch from backend
  warehouseLocations = ['Main Warehouse', 'Secondary Warehouse', 'Cold Storage']; // Keep or fetch

  inventoryItems: BackendItem[] = []; // To be fetched from /api/items

  currentTransaction: CurrentTransactionForm = this.resetTransactionForm();
  // transactionList: InvertTransactionPayload[] = []; // Not strictly needed if always navigating away
  isEditing = false;
  // editIndex: number = -1; // Not used with backend, use _id

  private http = inject(HttpClient);
  private itemsApiUrl = 'http://localhost:5000/api/items';
  private transactionsApiUrl = 'http://localhost:5000/api/invert-transactions';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadInitialData();
    // Handling edit: data should be passed via route params or a service
    // For simplicity, we'll assume if 'editInvertData' is in localStorage, we load that.
    // In a real app, use Angular Router's state or a shared service.
    const editDataString = localStorage.getItem('editInvertData'); // Updated key
    if (editDataString) {
      const editData: InvertTransactionPayload = JSON.parse(editDataString);
      this.populateFormForEdit(editData);
      localStorage.removeItem('editInvertData'); // Clean up
    }
  }

  loadInitialData(): void {
    this.http.get<BackendItem[]>(this.itemsApiUrl).subscribe({
      next: (items) => {
        this.inventoryItems = items;
        if (!this.isEditing || this.currentTransaction.items.length === 0) {
         // If not editing or items are empty, initialize with a default item if available
          this.resetTransactionItems();
        } else {
          // If editing, ensure items in currentTransaction.items are full objects
          this.currentTransaction.items.forEach(txItem => {
            if (txItem.itemId && !txItem.item) {
              txItem.item = this.inventoryItems.find(invItem => invItem._id === txItem.itemId);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading inventory items:', err);
        alert('Failed to load inventory items.');
      }
    });
  }

  populateFormForEdit(transaction: InvertTransactionPayload): void {
    this.isEditing = true;
    this.currentTransaction = {
      ...transaction,
      items: transaction.items.map(txItemPayload => {
        const backendItem = this.inventoryItems.find(invItem => invItem._id === txItemPayload.itemId);
        return {
          ...txItemPayload,
          item: backendItem // Ensure the 'item' object is populated for the form
        };
      })
    };
  }


  resetTransactionForm(): CurrentTransactionForm {
    const defaultItem = this.inventoryItems.length > 0 ? this.inventoryItems[0] : undefined;
    return {
      transactionId: 'INV-' + Math.floor(1000 + Math.random() * 9000), // Consider backend generation
      date: new Date().toISOString().split('T')[0],
      supplier: this.suppliers.length > 0 ? this.suppliers[0] : '',
      referenceNo: '',
      items: defaultItem ? [{
        item: defaultItem,
        itemId: defaultItem._id,
        quantity: 0,
        rate: defaultItem.purchasePrice || 0, // Default rate from item's purchase price
        amount: 0
      }] : [],
      totalAmount: 0,
      receivedBy: '',
      warehouseLocation: this.warehouseLocations.length > 0 ? this.warehouseLocations[0] : '',
      notes: ''
    };
  }

  resetTransactionItems(): void {
    const defaultItem = this.inventoryItems.length > 0 ? this.inventoryItems[0] : undefined;
    this.currentTransaction.items = defaultItem ? [{
        item: defaultItem,
        itemId: defaultItem._id,
        quantity: 0,
        rate: defaultItem.purchasePrice || 0,
        amount: 0
      }] : [];
    this.calculateTotal();
  }


  // This is important for [(ngModel)] binding with objects in <select>
  compareItems(item1: BackendItem, item2: BackendItem): boolean {
    return item1 && item2 ? item1._id === item2._id : item1 === item2;
  }

  onItemSelectionChange(index: number): void {
    const selectedFormItem = this.currentTransaction.items[index];
    if (selectedFormItem && selectedFormItem.item) {
      selectedFormItem.itemId = selectedFormItem.item._id; // Ensure itemId is updated
      selectedFormItem.rate = selectedFormItem.item.purchasePrice || 0; // Default rate
      this.updateItemAmount(index); // Recalculate amount and total
    }
  }

  addItem() {
    const defaultItem = this.inventoryItems.length > 0 ? this.inventoryItems[0] : undefined;
    if (!defaultItem) {
      alert("No inventory items available to add.");
      return;
    }
    this.currentTransaction.items.push({
      item: defaultItem,
      itemId: defaultItem._id,
      quantity: 0,
      rate: defaultItem.purchasePrice || 0,
      amount: 0
    });
    this.calculateTotal();
  }

  removeItem(index: number) {
    this.currentTransaction.items.splice(index, 1);
    this.calculateTotal();
  }

  updateItemAmount(index: number) {
    const item = this.currentTransaction.items[index];
    if (item) { // Check if item exists
        item.amount = (item.quantity || 0) * (item.rate || 0);
        this.calculateTotal();
    }
  }

  calculateTotal() {
    this.currentTransaction.totalAmount = this.currentTransaction.items.reduce(
      (sum, item) => sum + (item.amount || 0), 0
    );
  }

  saveTransaction() {
    // Transform form items to payload items
    const payloadItems: TransactionItemPayload[] = this.currentTransaction.items.map(formItem => ({
      itemId: formItem.itemId,
      quantity: formItem.quantity,
      rate: formItem.rate,
      amount: formItem.amount
    }));

    const transactionPayload: InvertTransactionPayload = {
      ...this.currentTransaction,
      items: payloadItems
    };

    if (this.isEditing && this.currentTransaction._id) {
      // Update existing transaction
      this.http.put<InvertTransactionPayload>(`${this.transactionsApiUrl}/${this.currentTransaction._id}`, transactionPayload).subscribe({
        next: () => {
          alert('Transaction updated successfully!');
          this.router.navigate(['/main/transaction/invert/list']); // Navigate to list view
        },
        error: (err) => {
          console.error('Error updating transaction:', err);
          alert('Failed to update transaction. ' + (err.error?.message || ''));
        }
      });
    } else {
      // Create new transaction
      const { _id, ...newTxPayload } = transactionPayload; // Remove _id for new transaction
      this.http.post<InvertTransactionPayload>(this.transactionsApiUrl, newTxPayload).subscribe({
        next: () => {
          alert('Transaction saved successfully!');
          this.router.navigate(['/main/transaction/invert/list']); // Navigate to list view
        },
        error: (err) => {
          console.error('Error saving transaction:', err);
          alert('Failed to save transaction. ' + (err.error?.message || ''));
        }
      });
    }
  }

  // The edit and delete operations for transactions are typically managed from the list component.
  // This form is primarily for create/update.
  // If 'edit' is triggered by navigating to this form with data, ngOnInit handles it.

  resetFormAndNavigateBack() {
    // this.currentTransaction = this.resetTransactionForm(); // Reset the form state
    // this.isEditing = false;
    this.router.navigate(['/main/transaction/invert/list']); // Navigate to list view
  }
}
