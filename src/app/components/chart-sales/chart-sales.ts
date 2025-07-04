// src/app/components/chart-sales/chart-sales.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
    FontAwesomeModule,
    CurrencyPipe
  ],
  templateUrl: './chart-sales.html',
  styleUrls: ['./chart-sales.scss'],
  providers: [DatePipe, EcommerceService, CurrencyPipe]
})
export class ChartSalesComponent implements OnInit, AfterViewInit {

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

    ],
    labels: [] // Las etiquetas ahora serán objetos Date
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#ffffff',
        titleColor: '#666666',
        bodyColor: '#333333',
        footerColor: '#fff',
        cornerRadius: 4,
        displayColors: false,
        padding: 10,
        animation: {
          duration: 0
        },
        titleFont: {
          size: 12,
          weight: 'normal'
        },
        bodyFont: {
          size: 18,
          weight: 'bold'
        },
        footerFont: {
          size: 0
        },
        callbacks: {
          title: (context) => {
            return this.selectedMetricLabel;
          },
          label: (context) => {
            const value = context.parsed.y;
            // Usar getFormattedValue para el tooltip, sin abreviación K/M
            return this.getFormattedValue(value, this.selectedMetric, false);
          },
          footer: (context) => {
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time', // Indica a Chart.js que este eje es de tiempo
        time: {
          // Adaptar la unidad a la selección del período
          unit: 'day', // Valor inicial, se actualizará en processSalesData
          tooltipFormat: 'dd.MM.yyyy',
          displayFormats: {
            day: 'dd.MM.yyyy',
            week: 'dd.MM.yyyy',
            month: 'dd.MM.yyyy'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#666',
          // Usamos una función de flecha para mantener el contexto 'this' del componente.
          // Esto nos permite acceder directamente a 'this.datePipe'.
          callback: (value: any, index: any, ticks: any) => {
            // 'value' será un timestamp que DatePipe puede transformar
            return this.datePipe.transform(value, 'dd.MM.yyyy');
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          color: '#666',
          // Usamos una función de flecha para mantener el contexto 'this' del componente.
          // Accedemos a 'selectedMetric' y llamamos a 'getFormattedValue' con 'isForAxis = true'.
          callback: (value: number | string) => {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return this.getFormattedValue(numValue, this.selectedMetric, true); // Pasar true para isForAxis
          }
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
          chart.canvas.style.cursor = 'pointer';
        } else {
          chart.canvas.style.cursor = 'default';
        }
      }
    }
  };

  public lineChartType: 'line' = 'line';


  constructor(private datePipe: DatePipe, private ecommerceService: EcommerceService, private currencyPipe: CurrencyPipe) { }

  async ngOnInit(): Promise<void> {
    await this.ecommerceService.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.processSalesData();
  }

  processSalesData() {
    const allOrders: Order[] = this.ecommerceService.getDashboardData().orders || [];

    const filteredData = this.ecommerceService.getFilteredOrdersByPeriod(
      this.selectedPeriod,
      this.selectedMetric,
      allOrders
    );

    this.lineChartData.labels = filteredData.labels;
    this.lineChartData.datasets[0].data = filteredData.data;
    this.lineChartData.datasets[0].label = this.selectedMetricLabel;

    if (this.lineChartOptions.scales && this.lineChartOptions.scales['x'] && (this.lineChartOptions.scales['x'] as any).time) {
      (this.lineChartOptions.scales['x'] as any).time.unit =
        this.selectedPeriod === 'day' ? 'day' : (this.selectedPeriod === 'week' ? 'week' : 'month');
    }

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

  /**
   * Formatea un valor numérico según la métrica seleccionada.
   * Puede aplicar formato de moneda, porcentaje, o números simples.
   * También aplica la abreviación K/M para el eje Y si 'isForAxis' es true.
   * @param value El valor numérico a formatear.
   * @param metric La métrica actual seleccionada (ej. 'net_revenue', 'conversion_rate').
   * @param isForAxis Booleano que indica si el formato es para las etiquetas del eje Y.
   * @returns El valor formateado como string.
   */
  private getFormattedValue(value: number, metric: keyof Order, isForAxis: boolean = false): string {
    let formattedValue: string;
    const rawValue = value;

    switch (metric) {
      case 'net_revenue':
      case 'aov':
      case 'taxes':
      case 'discounts':
      case 'shipping_costs':
        if (isForAxis) {
          // Para el eje Y, si el valor es grande, se abrevia con K/M
          if (rawValue >= 1000000) {
            formattedValue = (rawValue / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M';
          } else if (rawValue >= 1000) {
            formattedValue = (rawValue / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'K';
          } else {
            // --- CAMBIO CLAVE AQUÍ: Usamos 'symbol-narrow' en CurrencyPipe ---
            formattedValue = this.currencyPipe.transform(rawValue, 'EUR', 'symbol-narrow', '1.2-2', 'es-AR') || '';
          }
        } else {
          // Para el tooltip, siempre se usa CurrencyPipe para el formato de moneda completo
          // --- CAMBIO CLAVE AQUÍ: Usamos 'symbol-narrow' en CurrencyPipe ---
          formattedValue = this.currencyPipe.transform(rawValue, 'EUR', 'symbol-narrow', '1.2-2', 'es-AR') || '';
        }
        break;
      case 'conversion_rate':
        // El porcentaje no se abrevia con K/M, solo se formatea
        formattedValue = rawValue.toFixed(2) + '%';
        break;
      case 'orders_count':
      case 'items_sold':
        if (isForAxis) {
          // Para el eje, aplicar K/M si es un número grande, sino formato de número entero
          if (rawValue >= 1000000) {
            formattedValue = (rawValue / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M';
          } else if (rawValue >= 1000) {
            formattedValue = (rawValue / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'K';
          } else {
            formattedValue = rawValue.toLocaleString('es-AR', { maximumFractionDigits: 0 });
          }
        } else {
          // Para el tooltip, siempre mostrar el formato de número entero
          formattedValue = rawValue.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        }
        break;
      default:
        // Caso por defecto, aplicar K/M si es para el eje, sino formato numérico general
        if (isForAxis) {
          if (rawValue >= 1000000) {
            formattedValue = (rawValue / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M';
          } else if (rawValue >= 1000) {
            formattedValue = (rawValue / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'K';
          } else {
            formattedValue = rawValue.toLocaleString('es-AR');
          }
        } else {
          formattedValue = rawValue.toLocaleString('es-AR');
        }
        break;
    }
    return formattedValue;
  }
}
