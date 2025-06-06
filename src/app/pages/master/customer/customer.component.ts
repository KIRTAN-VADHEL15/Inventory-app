import { Component } from '@angular/core';

@Component({
  selector: 'app-customer',
  standalone: false,
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent {
  customers: any[] = [];

  customer = {
    code: '',
    name: '',
    address: ''
  };

  isEdit: boolean = false;
  editIndex: number = -1;

  ngOnInit() {
    if (typeof window !== 'undefined' && localStorage.getItem('customers')) {
      this.customers = JSON.parse(localStorage.getItem('customers')!);
    }
  }

  onSubmit() {
    if (this.isEdit) {
      this.customers[this.editIndex] = { ...this.customer };
      this.isEdit = false;
      this.editIndex = -1;
    } else {
      this.customers.push({ ...this.customer });
    }
   localStorage.setItem('customers', JSON.stringify(this.customers));
    this.customer = { code: '', name: '', address: '' };
  }

 
  addCustomer(customer: any) {
    this.customers.push(customer);
    if (typeof window !== 'undefined') {
      localStorage.setItem('customers', JSON.stringify(this.customers));
    }
  }


  onEdit(index: number) {
    this.customer = { ...this.customers[index] };
    this.isEdit = true;
    this.editIndex = index;
  }

  onDelete(index: number) {
    this.customers.splice(index, 1);
    localStorage.setItem('customers', JSON.stringify(this.customers));
    if (this.isEdit && index === this.editIndex) {
      this.customer = { code: '', name: '', address: '' };
      this.isEdit = false;
      this.editIndex = -1;
    }
  }
}
