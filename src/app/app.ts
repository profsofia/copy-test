import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KpiCardsComponent } from "./components/kpi-cards/kpi-cards";
import { ChartSalesComponent } from './components/chart-sales/chart-sales';
import { ProfitLossTableComponent } from './components/profit-loss-table/profit-loss-table';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, KpiCardsComponent, ChartSalesComponent, ProfitLossTableComponent
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'copi-front';
}
