import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvertListComponent } from './invert-list.component';

describe('InvertListComponent', () => {
  let component: InvertListComponent;
  let fixture: ComponentFixture<InvertListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InvertListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvertListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
