// src/app/services/ecommerce-service.ts
import { Injectable } from '@angular/core';

// Interfaces existentes
export interface KeyMetrics {
  net_revenue: number;
  aov: number;
  orders_count: number;
  items_sold: number;
  conversion_rate: number;
}

export interface Order {
  date: string;
  net_revenue: number;
  aov: number;
  taxes: number;
  items_sold: number;
  orders_count: number;
  discounts: number;
  shipping_costs: number;
  conversion_rate: number;
}

export interface ProfitLossEntry {
  concepto: string;
  Ene: number | null;
  Feb: number | null;
  Mar: number | null;
  Abr: number | null;
  May: number | null;
  Jun: number | null;
  Jul: number | null;
  Ago: number | null;
  Sep: number | null;
  Oct: number | null;
  Nov: number | null;
  Dic: number | null;
  Total: number | null;
  Var: string;
  [key: string]: string | number | null;
}

export interface ProfitLossData {
  year: number;
  data: ProfitLossEntry[];
}

export interface DashboardData {
  key_metrics: KeyMetrics;
  orders: Order[];
  profit_loss: ProfitLossData;
}

@Injectable({
  providedIn: 'root',
})
export class EcommerceService {
  private dashboardData: DashboardData | undefined;

  constructor() { }

  async loadDashboardData(): Promise<void> {
    if (this.dashboardData) {
      return;
    }
    try {
      const response = await fetch('/data/ecommerce.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.dashboardData = await response.json() as DashboardData;
      console.log('Datos de dashboard cargados:', this.dashboardData);
    } catch (error) {
      console.error('Error al cargar los datos del dashboard:', error);
    }
  }

  getDashboardData(): DashboardData {
    if (!this.dashboardData) {
      console.error('Los datos del dashboard no se han cargado aún.');
      return {
        key_metrics: { net_revenue: 0, aov: 0, orders_count: 0, items_sold: 0, conversion_rate: 0 },
        orders: [],
        profit_loss: { year: new Date().getFullYear(), data: [] }
      };
    }
    return this.dashboardData;
  }

  // ¡NUEVO MÉTODO PARA FILTRAR Y AGREGAR DATOS POR PERÍODO!
  getFilteredOrdersByPeriod(
    period: 'day' | 'week' | 'month',
    metric: keyof Order,
    allOrders: Order[]
  ): { labels: string[], data: number[] } {
    const aggregatedData: { [key: string]: { sum: number, count: number } } = {};
    const isAverageMetric = ['aov', 'conversion_rate'].includes(metric as string);

    allOrders.forEach(order => {
      const orderDate = new Date(order.date);
      let key: string; // La clave para agrupar (ej. '2024-01-01', '2024-W1', '2024-01')
      let label: string; // La etiqueta para mostrar en el gráfico

      if (period === 'day') {
        key = order.date;
        label = new Date(order.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      } else if (period === 'week') {
        // Calcular el número de semana (simplificado, puede requerir una librería para mayor precisión)
        const startOfWeek = new Date(orderDate);
        startOfWeek.setDate(orderDate.getDate() - orderDate.getDay()); // Domingo como inicio de semana
        key = `${startOfWeek.getFullYear()}-W${this.getWeekNumber(startOfWeek)}`;
        label = `Semana ${this.getWeekNumber(startOfWeek)}`;
      } else { // month
        key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        label = orderDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = { sum: 0, count: 0 };
      }

      const value = order[metric];
      if (typeof value === 'number') {
        aggregatedData[key].sum += value;
        aggregatedData[key].count += 1;
      }
    });

    // Ordenar las claves (fechas/semanas/meses) para asegurar el orden correcto en el gráfico
    const sortedKeys = Object.keys(aggregatedData).sort((a, b) => {
      if (period === 'day') {
        return new Date(a).getTime() - new Date(b).getTime();
      } else if (period === 'week') {
        // Ordenar por año y luego por número de semana
        const [yearA, weekA] = a.split('-W').map(Number);
        const [yearB, weekB] = b.split('-W').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return weekA - weekB;
      } else { // month
        // Ordenar por año y luego por número de mes
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      }
    });


    const labels: string[] = [];
    const data: number[] = [];

    sortedKeys.forEach(key => {
      const agg = aggregatedData[key];
      labels.push(this.formatKeyAsLabel(key, period)); // Usa un helper para formatear la etiqueta final
      data.push(isAverageMetric ? (agg.sum / agg.count) : agg.sum);
    });

    return { labels, data };
  }

  // Helper para calcular el número de semana (ISO week date, simplificado)
  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Helper para formatear la clave de agrupación como una etiqueta legible
  private formatKeyAsLabel(key: string, period: 'day' | 'week' | 'month'): string {
    if (period === 'day') {
      return new Date(key).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } else if (period === 'week') {
      const [year, weekNum] = key.split('-W');
      return `Semana ${weekNum}, ${year}`;
    } else { // month
      const [year, monthNum] = key.split('-');
      const date = new Date(Number(year), Number(monthNum));
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    }
  }
}
