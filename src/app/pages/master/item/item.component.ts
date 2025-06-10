import { Component, OnInit, inject } from '@angular/core'; // Added inject
import { HttpClient } from '@angular/common/http'; // Added HttpClient
import { FormsModule } from '@angular/forms'; // Will be needed in template, ensure module has it
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor

interface Item {
  _id?: string; // MongoDB typically uses _id
  code: string;
  name: string;
  purchasePrice: number | null;
  sellingPrice: number | null;
}

@Component({
  selector: 'app-item',
  standalone: false, // Assuming it stays false based on original
  // If you convert to standalone:true, ensure imports below are in the component's import array
  // imports: [CommonModule, FormsModule],
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  items: Item[] = [];
  item: Item = {
    code: '',
    name: '',
    purchasePrice: null,
    sellingPrice: null
  };

  isEdit: boolean = false;
  // editIndex: number = -1; // We'll use _id for editing with backend
  private apiUrl = 'http://localhost:5000/api/items'; // Backend API URL

  // Dependency injection for HttpClient
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
    if (this.isEdit && this.item._id) {
      // Update existing item
      this.http.put<Item>(`${this.apiUrl}/${this.item._id}`, this.item).subscribe({
        next: (updatedItem) => {
          const index = this.items.findIndex(i => i._id === updatedItem._id);
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
      // Make a copy and remove _id if it exists from a previous edit form fill
      const { _id, ...newItem } = this.item;
      this.http.post<Item>(this.apiUrl, newItem).subscribe({
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
    // Make a deep copy of the item to avoid modifying the list directly
    this.item = { ...itemToEdit };
    this.isEdit = true;
    // No need for editIndex, _id is used
  }

  onDelete(itemId: string | undefined) {
    if (!itemId) {
      console.error('Item ID is undefined, cannot delete.');
      alert('Cannot delete item: ID is missing.');
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    this.http.delete(`${this.apiUrl}/${itemId}`).subscribe({
      next: () => {
        this.items = this.items.filter(i => i._id !== itemId);
        alert('Item deleted successfully.');
        if (this.isEdit && this.item._id === itemId) {
          this.resetForm(); // Reset form if the edited item was deleted
        }
      },
      error: (err) => {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. Check console for details.');
      }
    });
  }

  resetForm(): void {
    this.item = { code: '', name: '', purchasePrice: null, sellingPrice: null };
    this.isEdit = false;
  }
}
