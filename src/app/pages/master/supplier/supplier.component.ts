import { Component } from '@angular/core';

@Component({
  selector: 'app-supplier',
  standalone: false,
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css'
})
export class SupplierComponent {
  suppliers: any[] = [];

  supplier = {
    code: '',
    name: '',
    address: ''
  };

  isEdit: boolean = false;
  editIndex: number = -1;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && localStorage.getItem('suppliers')) {
      this.suppliers = JSON.parse(localStorage.getItem('suppliers')!);
    }
  }

  onSubmit() {
    
    if (this.isEdit) {
      this.suppliers[this.editIndex] = { ...this.supplier };
      this.isEdit = false;
      this.editIndex = -1;
    }
    else {
      this.suppliers.push({ ...this.supplier });
    }
        localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
    this.supplier = { code: '', name: '', address: '' };
  
  }
  onEdit(index: number) {
    this.supplier = { ...this.suppliers[index] };
    this.isEdit = true;
    this.editIndex = index;
  }
  onDelete(index: number) {
    this.suppliers.splice(index, 1);
    localStorage.setItem('suppliers', JSON.stringify(this.suppliers));
    if (this.isEdit && index === this.editIndex) {
      this.supplier = { code: '', name: '', address: '' };
      this.isEdit = false;
      this.editIndex = -1;
    }
  }
}

