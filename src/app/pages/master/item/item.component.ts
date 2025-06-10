import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// Assuming FormsModule and CommonModule are handled by the NgModule or component's imports if standalone

interface Item {
  ItemID?: number; // Changed from _id: string to ItemID: number (SQL Server PK)
  ItemCode: string; // Changed from code
  ItemName: string; // Changed from name
  PurchasePrice: number | null; // Changed from purchasePrice
  SellingPrice: number | null; // Changed from sellingPrice
  // CreatedAt and UpdatedAt are also available from backend if needed in UI
  CreatedAt?: string;
  UpdatedAt?: string;
}

@Component({
  selector: 'app-item',
  // standalone: false, // Assuming based on previous setup
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  items: Item[] = [];
  item: Item = { // Adjusted field names to match SQL schema and API response
    ItemCode: '',
    ItemName: '',
    PurchasePrice: null,
    SellingPrice: null
  };

  isEdit: boolean = false;
  private apiUrl = 'http://localhost:5000/api/items'; // Backend API URL remains the same

  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.http.get<Item[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.items = data;
      },
      error: (err) => {
        console.error('Error loading items:', err);
        alert('Failed to load items. Check console for details.');
      }
    });
  }

  onSubmit() {
    if (this.isEdit && this.item.ItemID) {
      // Update existing item
      this.http.put<Item>(`${this.apiUrl}/${this.item.ItemID}`, this.item).subscribe({
        next: (updatedItem) => {
          const index = this.items.findIndex(i => i.ItemID === updatedItem.ItemID);
          if (index !== -1) {
            this.items[index] = updatedItem;
          }
          this.resetForm();
        },
        error: (err) => {
          console.error('Error updating item:', err);
          alert('Failed to update item. ' + (err.error?.message || ''));
        }
      });
    } else {
      // Create new item
      const { ItemID, CreatedAt, UpdatedAt, ...newItemPayload } = this.item; // Exclude PK and audit fields for create
      this.http.post<Item>(this.apiUrl, newItemPayload).subscribe({
        next: (addedItem) => {
          this.items.push(addedItem);
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating item:', err);
          alert('Failed to create item. ' + (err.error?.message || ''));
        }
      });
    }
  }

  onEdit(itemToEdit: Item) {
    this.item = { ...itemToEdit };
    this.isEdit = true;
  }

  onDelete(itemId: number | undefined) { // Changed from string to number
    if (itemId === undefined) { // Stricter check for undefined
      console.error('Item ID is undefined, cannot delete.');
      alert('Cannot delete item: ID is missing.');
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    this.http.delete(`${this.apiUrl}/${itemId}`).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.ItemID !== itemId);
        alert('Item deleted successfully.');
        if (this.isEdit && this.item.ItemID === itemId) {
          this.resetForm();
        }
      },
      error: (err) => {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. ' + (err.error?.message || err.error?.errorCode || ''));
      }
    });
  }

  resetForm(): void {
    this.item = { ItemCode: '', ItemName: '', PurchasePrice: null, SellingPrice: null };
    this.isEdit = false;
  }
}
