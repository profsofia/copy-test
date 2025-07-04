// src/main.ts

/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app'; // Asumiendo que tu componente raíz se llama 'App'

// Importaciones de Chart.js y el adaptador de fechas
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'; // ¡Importa el adaptador de fechas!

// --- AÑADE ESTAS DOS LÍNEAS PARA EL REGISTRO DE LOCALES DE ANGULAR ---
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
// -------------------------------------------------------------------

// Registra todos los elementos de Chart.js (incluyendo escalas, elementos, etc.)
Chart.register(...registerables);

// Registra el locale 'es-AR' para los pipes de Angular
// --- AÑADE ESTA LÍNEA ---
registerLocaleData(localeEsAr);
// -----------------------

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
