import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// FormsModule, CommonModule as needed

interface BackendItem { // Item fetched from /api/items
  ItemID: number;      // Changed from _id
  ItemCode: string;    // Changed from code
  ItemName: string;    // Changed from name
  PurchasePrice?: number;
}

interface TransactionItemPayload { // For sending to backend as part of transaction
  ItemID: number;      // Changed from itemId: string (now refers to BackendItem.ItemID)
  Quantity: number;
  Rate: number;
  // Amount is calculated by backend or can be sent if already calculated
}

interface InvertTransactionPayload { // For POST/PUT to /api/invert-transactions
  TransactionID?: number; // Changed from _id (for updates)
  CustomTransactionID: string;
  TransactionDate: string;
  Supplier: string;
  ReferenceNo: string;
  items: TransactionItemPayload[];
  TotalAmount?: number; // Backend calculates this, but can be sent for validation
  ReceivedBy: string;
  WarehouseLocation: string;
  Notes: string;
  // CreatedAt, UpdatedAt from backend response
  CreatedAt?: string;
  UpdatedAt?: string;
  // If the backend GET response for a single transaction includes fully populated items:
  // items?: BackendItemInTransaction[]; // (see below)
}

// Interface for items as they are part of a transaction fetched from backend (e.g. in GET /api/invert-transactions/:id)
interface BackendItemInTransaction {
    TransactionItemID?: number; // PK of the junction table row
    ItemID: number;
    ItemCode: string;
    ItemName: string;
    Quantity: number;
    Rate: number;
    Amount: number; // Calculated amount from backend
}


// Interface for items as they are managed in the form's items array
interface FormTransactionItem {
  selectedItem?: BackendItem; // The selected inventory item object from dropdown
  ItemID: number;           // Store ItemID directly
  Quantity: number;
  Rate: number;
  Amount: number;           // Calculated in form: Quantity * Rate
}

interface CurrentTransactionForm {
  TransactionID?: number;       // Changed from _id
  CustomTransactionID: string;
  TransactionDate: string;
  Supplier: string;
  ReferenceNo: string;
  items: FormTransactionItem[];
  TotalAmount: number;
  ReceivedBy: string;
  WarehouseLocation: string;
  Notes: string;
}

@Component({
  selector: 'app-invert-form',
  // standalone: false,
  templateUrl: './invert-form.component.html',
  styleUrls: ['./invert-form.component.css']
})
export class InvertFormComponent implements OnInit {
  suppliers = ['Supplier A', 'Supplier B', 'Supplier C'];
  warehouseLocations = ['Main Warehouse', 'Secondary Warehouse', 'Cold Storage'];

  inventoryItemsForDropdown: BackendItem[] = []; // Fetched from /api/items

  currentTransaction: CurrentTransactionForm = this.resetTransactionForm();
  isEditing = false;

  private http = inject(HttpClient);
  private itemsApiUrl = 'http://localhost:5000/api/items';
  private transactionsApiUrl = 'http://localhost:5000/api/invert-transactions';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadInitialDropdownData();
    // Edit logic: Expects 'editInvertData' in localStorage containing InvertTransactionPayload (with ItemID)
    const editDataString = localStorage.getItem('editInvertData');
    if (editDataString) {
      const editData: InvertTransactionPayload = JSON.parse(editDataString);
      // Ensure items in editData are compatible with FormTransactionItem
      // The backend GET response for a single transaction now returns items with ItemCode, ItemName etc.
      // So, `editData.items` (if it's from GET /:id) would be Array<BackendItemInTransaction>

      // Let's assume editData comes from a list where items might not be fully populated.
      // Better: fetch the full transaction from backend if only ID is passed.
      // For now, if editData is passed, it should conform to InvertTransactionPayload.
      // And its items should be TransactionItemPayload.
      // We need to map these to FormTransactionItem by finding the selectedItem from inventoryItemsForDropdown.
      this.populateFormForEdit(editData);
      localStorage.removeItem('editInvertData');
    }
  }

  loadInitialDropdownData(): void {
    this.http.get<BackendItem[]>(this.itemsApiUrl).subscribe({
      next: (items) => {
        this.inventoryItemsForDropdown = items;
        if (!this.isEditing || this.currentTransaction.items.length === 0) {
          this.resetTransactionItemsInForm();
        } else {
          // If editing and form items were populated, ensure selectedItem object is linked
          this.currentTransaction.items.forEach(formItem => {
            if (formItem.ItemID && !formItem.selectedItem) {
              formItem.selectedItem = this.inventoryItemsForDropdown.find(invItem => invItem.ItemID === formItem.ItemID);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading inventory items for dropdown:', err);
        alert('Failed to load inventory items for dropdown.');
      }
    });
  }

  populateFormForEdit(txData: InvertTransactionPayload): void {
    this.isEditing = true;
    this.currentTransaction = {
      TransactionID: txData.TransactionID,
      CustomTransactionID: txData.CustomTransactionID,
      TransactionDate: new Date(txData.TransactionDate).toISOString().split('T')[0], // Format date
      Supplier: txData.Supplier,
      ReferenceNo: txData.ReferenceNo,
      items: txData.items.map(payloadItem => {
        const backendItem = this.inventoryItemsForDropdown.find(invItem => invItem.ItemID === payloadItem.ItemID);
        return {
          selectedItem: backendItem,
          ItemID: payloadItem.ItemID,
          Quantity: payloadItem.Quantity,
          Rate: payloadItem.Rate,
          Amount: payloadItem.Quantity * payloadItem.Rate // Recalculate for form consistency
        };
      }),
      TotalAmount: txData.TotalAmount || 0, // Use provided or recalculate
      ReceivedBy: txData.ReceivedBy,
      WarehouseLocation: txData.WarehouseLocation,
      Notes: txData.Notes
    };
    if(!txData.TotalAmount) this.calculateTotal(); // Recalculate if not provided
  }

  resetTransactionForm(): CurrentTransactionForm {
    const defaultInvItem = this.inventoryItemsForDropdown.length > 0 ? this.inventoryItemsForDropdown[0] : undefined;
    return {
      CustomTransactionID: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      TransactionDate: new Date().toISOString().split('T')[0],
      Supplier: this.suppliers.length > 0 ? this.suppliers[0] : '',
      ReferenceNo: '',
      items: defaultInvItem ? [{
        selectedItem: defaultInvItem,
        ItemID: defaultInvItem.ItemID,
        Quantity: 0,
        Rate: defaultInvItem.PurchasePrice || 0,
        Amount: 0
      }] : [],
      TotalAmount: 0,
      ReceivedBy: '',
      WarehouseLocation: this.warehouseLocations.length > 0 ? this.warehouseLocations[0] : '',
      Notes: ''
    };
  }

  resetTransactionItemsInForm(): void {
    const defaultInvItem = this.inventoryItemsForDropdown.length > 0 ? this.inventoryItemsForDropdown[0] : undefined;
    this.currentTransaction.items = defaultInvItem ? [{
        selectedItem: defaultInvItem,
        ItemID: defaultInvItem.ItemID,
        Quantity: 0,
        Rate: defaultInvItem.PurchasePrice || 0,
        Amount: 0
      }] : [];
    this.calculateTotal();
  }

  compareItems(item1: BackendItem, item2: BackendItem): boolean {
    return item1 && item2 ? item1.ItemID === item2.ItemID : item1 === item2;
  }

  onItemSelectionChange(index: number): void {
    const formItem = this.currentTransaction.items[index];
    if (formItem && formItem.selectedItem) {
      formItem.ItemID = formItem.selectedItem.ItemID; // Ensure ItemID is from the selected object
      formItem.Rate = formItem.selectedItem.PurchasePrice || 0;
      this.updateItemAmount(index);
    }
  }

  addItem() {
    const defaultInvItem = this.inventoryItemsForDropdown.length > 0 ? this.inventoryItemsForDropdown[0] : undefined;
    if (!defaultInvItem) {
      alert("No inventory items available to add.");
      return;
    }
    this.currentTransaction.items.push({
      selectedItem: defaultInvItem,
      ItemID: defaultInvItem.ItemID,
      Quantity: 0,
      Rate: defaultInvItem.PurchasePrice || 0,
      Amount: 0
    });
    this.calculateTotal();
  }

  removeItem(index: number) {
    this.currentTransaction.items.splice(index, 1);
    this.calculateTotal();
  }

  updateItemAmount(index: number) {
    const item = this.currentTransaction.items[index];
    if (item) {
        item.Amount = (item.Quantity || 0) * (item.Rate || 0);
        this.calculateTotal();
    }
  }

  calculateTotal() {
    this.currentTransaction.TotalAmount = this.currentTransaction.items.reduce(
      (sum, item) => sum + (item.Amount || 0), 0
    );
  }

  saveTransaction() {
    const payloadItems: TransactionItemPayload[] = this.currentTransaction.items.map(formItem => ({
      ItemID: formItem.ItemID, // Ensure this is the correct ItemID
      Quantity: formItem.Quantity,
      Rate: formItem.Rate
      // Amount can be omitted as backend calculates it, or include formItem.Amount
    }));

    const transactionPayload: InvertTransactionPayload = {
      // TransactionID is part of currentTransaction if editing
      ...(this.isEditing && this.currentTransaction.TransactionID && { TransactionID: this.currentTransaction.TransactionID }),
      CustomTransactionID: this.currentTransaction.CustomTransactionID,
      TransactionDate: this.currentTransaction.TransactionDate,
      Supplier: this.currentTransaction.Supplier,
      ReferenceNo: this.currentTransaction.ReferenceNo,
      items: payloadItems,
      // TotalAmount: this.currentTransaction.TotalAmount, // Backend calculates this
      ReceivedBy: this.currentTransaction.ReceivedBy,
      WarehouseLocation: this.currentTransaction.WarehouseLocation,
      Notes: this.currentTransaction.Notes
    };

    if (this.isEditing && transactionPayload.TransactionID) {
      this.http.put<InvertTransactionPayload>(`${this.transactionsApiUrl}/${transactionPayload.TransactionID}`, transactionPayload).subscribe({
        next: () => {
          alert('Transaction updated successfully!');
          this.router.navigate(['/main/transaction/invert/list']);
        },
        error: (err) => {
          console.error('Error updating transaction:', err);
          alert('Failed to update transaction. ' + (err.error?.message || ''));
        }
      });
    } else {
      const { TransactionID, ...newTxPayload } = transactionPayload; // Exclude TransactionID for new transaction
      this.http.post<InvertTransactionPayload>(this.transactionsApiUrl, newTxPayload).subscribe({
        next: () => {
          alert('Transaction saved successfully!');
          this.router.navigate(['/main/transaction/invert/list']);
        },
        error: (err) => {
          console.error('Error saving transaction:', err);
          alert('Failed to save transaction. ' + (err.error?.message || ''));
        }
      });
    }
  }

  resetFormAndNavigateBack() {
    this.router.navigate(['/main/transaction/invert/list']);
  }
}
