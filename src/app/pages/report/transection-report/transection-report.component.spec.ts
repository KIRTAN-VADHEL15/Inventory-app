import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransectionReportComponent } from './transection-report.component';

describe('TransectionReportComponent', () => {
  let component: TransectionReportComponent;
  let fixture: ComponentFixture<TransectionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransectionReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransectionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
