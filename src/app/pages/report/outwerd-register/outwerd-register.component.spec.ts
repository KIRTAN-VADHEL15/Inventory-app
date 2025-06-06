import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutwerdRegisterComponent } from './outwerd-register.component';

describe('OutwerdRegisterComponent', () => {
  let component: OutwerdRegisterComponent;
  let fixture: ComponentFixture<OutwerdRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutwerdRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutwerdRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
