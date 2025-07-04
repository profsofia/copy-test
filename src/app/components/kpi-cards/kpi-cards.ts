// src/app/components/kpi-cards/kpi-cards.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfoCircle, faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons';
import { NgbTooltipModule, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap'; // Importa NgbTooltipConfig

import { EcommerceService, KeyMetrics } from '../../services/ecommerce-service';

interface Kpi {
  title: string;
  value: string;
  change: number;
  unit: string;
  icon: 'up' | 'down' | 'none';
  description: string; // Esta será la descripción detallada en el tooltip
}

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NgbTooltipModule],
  templateUrl: './kpi-cards.html',
  styleUrls: ['./kpi-cards.scss'],
  providers: [EcommerceService],
})
export class KpiCardsComponent implements OnInit {
  faInfoCircle = faInfoCircle;
  faArrowTrendUp = faArrowTrendUp;
  faArrowTrendDown = faArrowTrendDown;

  kpis: Kpi[] = [];

  constructor(
    private ecommerceService: EcommerceService,
    private tooltipConfig: NgbTooltipConfig // Inyecta NgbTooltipConfig
  ) {
    // Configura los valores por defecto del tooltip para que aparezca instantáneamente
    this.tooltipConfig.openDelay = 0;
    this.tooltipConfig.closeDelay = 0;
    this.tooltipConfig.animation = false; // Desactiva la animación de fade por defecto
  }

  async ngOnInit(): Promise<void> {
    await this.ecommerceService.loadDashboardData();
    this.loadKpis();
  }

  private loadKpis(): void {
    const metrics = this.ecommerceService.getDashboardData().key_metrics;

    this.kpis = [
      {
        title: 'Ingresos Netos',
        value: this.formatCurrency(metrics.net_revenue),
        change: 5.2,
        unit: '%',
        icon: 'up',
        description: 'Ingresos totales después de descuentos y devoluciones.',
      },
      {
        title: 'AOV',
        value: this.formatCurrency(metrics.aov),
        change: -1.5,
        unit: '%',
        icon: 'down',
        description: 'Valor promedio de los pedidos.',
      },
      {
        title: 'Pedidos',
        value: metrics.orders_count.toLocaleString(),
        change: 3.1,
        unit: '%',
        icon: 'up',
        description: 'Número total de pedidos realizados.',
      },
      {
        title: 'Productos Vendidos',
        value: metrics.items_sold.toLocaleString(),
        change: 7.8,
        unit: '%',
        icon: 'up',
        description: 'Cantidad total de productos vendidos.',
      },
      {
        title: 'Tasa de Conversión',
        value: metrics.conversion_rate.toFixed(2) + '%',
        change: -0.8,
        unit: '%',
        icon: 'down',
        description: 'Porcentaje de visitantes que completaron una compra.',
      },
    ];
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
