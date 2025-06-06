import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutvertFormComponent } from './outvert-form.component';

describe('OutvertFormComponent', () => {
  let component: OutvertFormComponent;
  let fixture: ComponentFixture<OutvertFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutvertFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutvertFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
