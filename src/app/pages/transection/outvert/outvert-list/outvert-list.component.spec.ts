import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutvertListComponent } from './outvert-list.component';

describe('OutvertListComponent', () => {
  let component: OutvertListComponent;
  let fixture: ComponentFixture<OutvertListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutvertListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutvertListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
