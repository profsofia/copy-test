// src/app/components/profit-loss-table/profit-loss-table.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EcommerceService,
  ProfitLossData,
  ProfitLossEntry,
} from '../../services/ecommerce-service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-profit-loss-table',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    FontAwesomeModule
  ],
  templateUrl: './profit-loss-table.html',
  styleUrls: ['./profit-loss-table.scss'],
  providers: [EcommerceService],
})
export class ProfitLossTableComponent implements OnInit {
  profitLossData: ProfitLossData | undefined;
  months: string[] = [];
  isHeatmapView: boolean = false;

  private minHeatmapValue: number = 0;
  private maxHeatmapValue: number = 0;

  private highlightedConcepts: string[] = [
    'Ingresos netos',
    'Margen de contribución',
    'Margen de contribución ajustado',
  ];

  faChevronDown = faChevronDown;
  isYearDropdownOpen: boolean = false;
  availableYears: number[] = [2025, 2024, 2023, 2022];

  constructor(private ecommerceService: EcommerceService) {}

  async ngOnInit(): Promise<void> { // ¡HACER ngOnInit ASÍNCRONO!
    await this.ecommerceService.loadDashboardData(); // Esperar a que los datos se carguen
    this.initializeProfitLossData();
  }

  private initializeProfitLossData(): void {
    const data = this.ecommerceService.getDashboardData().profit_loss;
    if (data) {
      this.profitLossData = data;
      if (data.data.length > 0) {
        this.months = Object.keys(data.data[0]).filter(
          (key) => key !== 'concepto' && key !== 'Total' && key !== 'Var' && key !== 'year'
        );
      }
      this.calculateMinMaxForHeatmap();
    }
  }

  toggleView(): void {
    this.isHeatmapView = !this.isHeatmapView;
  }

  private calculateMinMaxForHeatmap(): void {
    if (!this.profitLossData) return;

    let min = Infinity;
    let max = -Infinity;

    this.profitLossData.data.forEach(entry => {
      this.months.forEach(month => {
        const value = entry[month];
        if (typeof value === 'number') {
          if (value < min) min = value;
          if (value > max) max = value;
        }
      });
      const totalValue = entry['Total'];
      if (typeof totalValue === 'number') {
        if (totalValue < min) min = totalValue;
        if (totalValue > max) max = totalValue;
      }
    });

    this.minHeatmapValue = min;
    this.maxHeatmapValue = max;
  }

  getHeatmapColor(value: number | string): string {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numericValue) || this.maxHeatmapValue === this.minHeatmapValue) {
      return 'transparent';
    }

    const normalizedValue = (numericValue - this.minHeatmapValue) / (this.maxHeatmapValue - this.minHeatmapValue);
    const hue = 210;
    const saturation = 70;
    const lightness = 95 - (45 * normalizedValue);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  getVariationClass(value: string | number): string {
    if (typeof value === 'string' && value.endsWith('%')) {
      const numValue = parseFloat(value);
      if (numValue > 0) {
        return 'positive-variation';
      } else if (numValue < 0) {
        return 'negative-variation';
      }
    }
    return '';
  }

  formatCurrency(value: number | string): string {
    let numericValue: number;
    if (typeof value === 'string') {
      numericValue = parseFloat(value);
    } else {
      numericValue = value;
    }

    if (isNaN(numericValue)) {
      return '';
    }
    return numericValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatPercentage(value: string | number): string {
    if (typeof value === 'number') {
      return value.toFixed(2) + '%';
    }
    return value;
  }

  isHighlightedRow(concepto: string): boolean {
    return this.highlightedConcepts.includes(concepto);
  }

  onYearDropdownOpenChange(isOpen: boolean): void {
    this.isYearDropdownOpen = isOpen;
  }

  onYearChange(year: number): void {
    if (this.profitLossData) {
      this.profitLossData.year = year;
      // En una aplicación real, aquí llamarías a tu servicio para obtener los datos
      // del nuevo año. Por ahora, solo actualizamos la propiedad.
      // Ejemplo: await this.ecommerceService.loadDashboardData(year);
      // this.initializeProfitLossData(); // Recargar datos para el nuevo año
    }
  }
}
