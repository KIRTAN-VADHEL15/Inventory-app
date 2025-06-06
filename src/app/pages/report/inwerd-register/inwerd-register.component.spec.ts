import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InwerdRegisterComponent } from './inwerd-register.component';

describe('InwerdRegisterComponent', () => {
  let component: InwerdRegisterComponent;
  let fixture: ComponentFixture<InwerdRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InwerdRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InwerdRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
