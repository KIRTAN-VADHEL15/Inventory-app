import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-item',
  standalone: false,
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {
  items: any[] = [];

  item = {
    code: '',
    name: '',
    purchasePrice: null,
    sellingPrice: null
  };

  isEdit: boolean = false;
  editIndex: number = -1;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && localStorage.getItem('items')) {
      this.items = JSON.parse(localStorage.getItem('items')!);
    }
  }

  onSubmit() {
    if (this.isEdit) {
      this.items[this.editIndex] = { ...this.item };
      this.isEdit = false;
      this.editIndex = -1;
    } else {
      this.items.push({ ...this.item });
    }

    localStorage.setItem('items', JSON.stringify(this.items));
    this.item = { code: '', name: '', purchasePrice: null, sellingPrice: null };

  }

  onEdit(index: number) {
    this.item = { ...this.items[index] };
    this.isEdit = true;
    this.editIndex = index;
  }

  onDelete(index: number) {
    this.items.splice(index, 1);
    // Always update localStorage after deletion
    localStorage.setItem('items', JSON.stringify(this.items));

    if (this.isEdit && index === this.editIndex) {
      this.item = { code: '', name: '', purchasePrice: null, sellingPrice: null };
      this.isEdit = false;
      this.editIndex = -1;
    }
  }
}
