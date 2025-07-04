// src/app/services/ecommerce-service.ts
import { Injectable } from '@angular/core';

// Interfaces existentes (sin cambios)
export interface KeyMetrics {
  net_revenue: number;
  aov: number;
  orders_count: number;
  items_sold: number;
  conversion_rate: number;
}

export interface Order {
  date: string; // Asumimos que esta fecha viene en formato 'YYYY-MM-DD' o similar, que Date() pueda parsear
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

  /**
   * Filtra y agrega datos de órdenes por período (día, semana, mes).
   * Ahora devuelve un array de objetos Date para las etiquetas, permitiendo a Chart.js manejar el formateo.
   * @param period El período de agregación ('day', 'week', 'month').
   * @param metric La métrica a agregar (ej. 'net_revenue').
   * @param allOrders Todas las órdenes disponibles.
   * @returns Un objeto con 'labels' (fechas como Date) y 'data' (valores agregados).
   */
  getFilteredOrdersByPeriod(
    period: 'day' | 'week' | 'month',
    metric: keyof Order,
    allOrders: Order[]
  ): { labels: Date[], data: number[] } { // <--- ¡CAMBIO CLAVE AQUÍ! labels ahora es Date[]
    // Usamos un objeto para agregar datos, donde la clave es una representación única del período
    // y el valor contiene la suma, el conteo y una referencia a un objeto Date para la etiqueta.
    const aggregatedData: { [key: string]: { sum: number, count: number, dateRef?: Date } } = {};
    const isAverageMetric = ['aov', 'conversion_rate'].includes(metric as string);

    allOrders.forEach(order => {
      const orderDate = new Date(order.date); // Convertir la fecha de la orden a objeto Date
      let key: string; // Clave para agrupar (ej. '2024-01-01', '2024-W1', '2024-01')
      let dateForLabel: Date; // El objeto Date real que se usará como etiqueta

      if (period === 'day') {
        // Para el período 'day', la clave es la fecha ISO string y la etiqueta es el objeto Date de la orden
        key = order.date; // Ej: "2024-01-01"
        dateForLabel = orderDate;
      } else if (period === 'week') {
        // Para el período 'week', calculamos el inicio de la semana y usamos eso para la clave y la etiqueta
        const startOfWeek = this.getStartOfWeek(orderDate); // Obtiene el objeto Date del inicio de la semana
        key = `${startOfWeek.getFullYear()}-W${this.getWeekNumber(startOfWeek)}`;
        dateForLabel = startOfWeek;
      } else { // month
        // Para el período 'month', la clave es 'YYYY-MM' y la etiqueta es el primer día del mes
        key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`; // Month es 0-indexado
        dateForLabel = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1); // Primer día del mes
      }

      // Inicializar el objeto de agregación si no existe
      if (!aggregatedData[key]) {
        aggregatedData[key] = { sum: 0, count: 0, dateRef: dateForLabel }; // Almacenar la referencia Date
      }

      // Sumar el valor de la métrica
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

    const labels: Date[] = []; // <--- ¡labels ahora es un array de Date!
    const data: number[] = [];

    sortedKeys.forEach(key => {
      const agg = aggregatedData[key];
      if (agg.dateRef) {
        labels.push(agg.dateRef); // Añadir el objeto Date almacenado
      }
      data.push(isAverageMetric ? (agg.sum / agg.count) : agg.sum);
    });

    return { labels, data };
  }

  /**
   * Helper para calcular el número de semana (ISO week date, simplificado).
   * Asegura que la fecha se trate como UTC para consistencia.
   * @param d La fecha para la cual calcular el número de semana.
   * @returns El número de semana.
   */
  private getWeekNumber(d: Date): number {
    // Copiar la fecha para no modificar el original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Establecer al jueves más cercano: fecha actual + 4 - número de día actual
    // Hacer que el número de día del domingo sea 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Obtener el primer día del año
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calcular semanas completas hasta el jueves más cercano
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  /**
   * Helper para obtener el inicio de la semana (Domingo) para una fecha dada.
   * @param d La fecha de referencia.
   * @returns Un objeto Date representando el inicio de la semana.
   */
  private getStartOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay(); // 0 para Domingo, 1 para Lunes, etc.
    const diff = date.getDate() - day; // Ajustar al Domingo
    date.setDate(diff);
    date.setHours(0, 0, 0, 0); // Establecer al inicio del día
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }

  // Se elimina la función formatKeyAsLabel ya que el formateo se hará en ChartSalesComponent
  // private formatKeyAsLabel(key: string, period: 'day' | 'week' | 'month'): string { /* ... */ }
}
