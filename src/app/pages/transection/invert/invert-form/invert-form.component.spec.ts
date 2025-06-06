import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvertFormComponent } from './invert-form.component';

describe('InvertFormComponent', () => {
  let component: InvertFormComponent;
  let fixture: ComponentFixture<InvertFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InvertFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvertFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
