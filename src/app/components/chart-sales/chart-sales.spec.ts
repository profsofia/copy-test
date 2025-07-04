import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSales } from './chart-sales';

describe('ChartSales', () => {
  let component: ChartSales;
  let fixture: ComponentFixture<ChartSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartSales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartSales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
