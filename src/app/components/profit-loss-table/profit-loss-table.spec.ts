import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitLossTable } from './profit-loss-table';

describe('ProfitLossTable', () => {
  let component: ProfitLossTable;
  let fixture: ComponentFixture<ProfitLossTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitLossTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitLossTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
