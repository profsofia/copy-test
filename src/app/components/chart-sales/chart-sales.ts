// src/app/components/chart-sales/chart-sales.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { EcommerceService, Order } from '../../services/ecommerce-service';
import { CustomButtonComponent } from '../custom-button/custom-button';

@Component({
  selector: 'app-chart-sales',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    CustomButtonComponent,
    NgbDropdownModule,
    FontAwesomeModule
  ],
  templateUrl: './chart-sales.html',
  styleUrls: ['./chart-sales.scss'],
  providers: [DatePipe, EcommerceService]
})
export class ChartSalesComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public selectedPeriod: 'day' | 'week' | 'month' = 'day';

  public selectedMetric: keyof Order = 'net_revenue';
  public selectedMetricLabel: string = 'Ingresos Brutos';
  public metricOptions: { value: keyof Order; label: string }[] = [
    { value: 'net_revenue', label: 'Ingresos Brutos' },
    { value: 'aov', label: 'AOV' },
    { value: 'orders_count', label: 'Pedidos' },
    { value: 'items_sold', label: 'Productos Vendidos' },
    { value: 'conversion_rate', label: 'Tasa de Conversión' },
    { value: 'taxes', label: 'Impuestos' },
    { value: 'discounts', label: 'Descuentos' },
    { value: 'shipping_costs', label: 'Costos de Envío' },
  ];

  faChevronDown = faChevronDown;
  public isDropdownOpen: boolean = false;


  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: '',
        fill: false,
        tension: 0.3,
        borderColor: '#8e5ea2',
        backgroundColor: 'rgba(142, 94, 162, 0.2)',
        pointBackgroundColor: '#8e5ea2',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(142, 94, 162, 0.8)',
      }
      // ¡ELIMINADO! El dataset de la línea de "Media"
      /*
      ,
      {
        data: [],
        label: 'Media',
        fill: false,
        pointRadius: 0,
        borderColor: '#3cba9f',
        borderDash: [5, 5],
        borderWidth: 2,
        pointHitRadius: 0,
        hoverBorderWidth: 0,
      }
      */
    ],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true, // Ensure tooltip is enabled
        backgroundColor: '#ffffff', // Set background to white
        titleColor: '#666666', // Set title color to gray
        bodyColor: '#333333', // Set body color (value) to a dark gray
        footerColor: '#fff',
        cornerRadius: 4,
        displayColors: false,
        padding: 10, // Maintain consistent padding
        animation: {
          duration: 0 // Desactiva la animación de entrada/salida para que aparezca instantáneamente
        },

        // Key adjustments for custom tooltip!
        titleFont: {
          size: 12, // Smaller font size for the title (metric name)
          weight: 'normal'
        },
        bodyFont: {
          size: 18, // Larger font size for the metric value
          weight: 'bold' // Make the value font bolder
        },
        // Disable footer if not needed
        footerFont: {
          size: 0 // Hide footer if not used
        },

        callbacks: {
          title: (context) => {
            return this.selectedMetricLabel;
          },
          label: (context) => {
            const value = context.parsed.y;
            return this.getFormattedValue(value, this.selectedMetric);
          },
          footer: (context) => {
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          callback: (value) => {
            return this.getFormattedValue(value as number, this.selectedMetric);
          },
          color: '#666'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onHover: (event, elements, chart) => {
      if (chart && chart.canvas) {
        if (elements.length > 0) {
          chart.canvas.style.cursor = 'pointer'; // Cursor pointer when hovering over a data point
        } else {
          chart.canvas.style.cursor = 'default'; // Default cursor otherwise
        }
      }
    }
  };

  public lineChartType: 'line' = 'line';


  constructor(private datePipe: DatePipe, private ecommerceService: EcommerceService) { }

  async ngOnInit(): Promise<void> {
    await this.ecommerceService.loadDashboardData();
    this.processSalesData();
  }

  processSalesData() {
    const allOrders: Order[] = this.ecommerceService.getDashboardData().orders || [];

    const filteredData = this.ecommerceService.getFilteredOrdersByPeriod(
      this.selectedPeriod,
      this.selectedMetric,
      allOrders
    );

    const dates = filteredData.labels;
    const values = filteredData.data;

    // Ya no necesitamos calcular la media ni el averageData, solo la línea principal
    // const sum = values.reduce((a, b) => a + b, 0);
    // const average = values.length > 0 ? sum / values.length : 0;
    // const averageData = new Array(values.length).fill(average);

    this.lineChartData.labels = dates;
    this.lineChartData.datasets[0].data = values;
    this.lineChartData.datasets[0].label = this.selectedMetricLabel;
    // ¡ELIMINADO! Ya no asignamos datos al segundo dataset
    // this.lineChartData.datasets[1].data = averageData;

    this.chart?.update();
  }

  onPeriodChange(period: 'day' | 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.processSalesData();
  }

  onMetricChange(metric: keyof Order, label: string): void {
    this.selectedMetric = metric;
    this.selectedMetricLabel = label;
    this.processSalesData();
  }

  onDropdownOpenChange(isOpen: boolean): void {
    this.isDropdownOpen = isOpen;
  }

  downloadChart(): void {
    if (this.chart && this.chart.chart) {
      const canvas = this.chart.chart.canvas;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${this.selectedMetricLabel}_${this.selectedPeriod}_chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('El gráfico no está disponible para descargar.');
    }
  }

  private getFormattedValue(value: number, metric: keyof Order): string {
    switch (metric) {
      case 'net_revenue':
      case 'aov':
      case 'taxes':
      case 'discounts':
      case 'shipping_costs':
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'conversion_rate':
        return value.toFixed(2) + '%';
      case 'orders_count':
      case 'items_sold':
        return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
      default:
        return value.toLocaleString('es-AR');
    }
  }
}
