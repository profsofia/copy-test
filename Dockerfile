# --- Etapa de Construcción (Build Stage) ---
# Usa una imagen base de Node.js para compilar la aplicación Angular.
# La versión 20 de Node.js es adecuada para Angular 20.
FROM node:20 AS build

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copia los archivos package.json y package-lock.json para instalar las dependencias.
# Esto aprovecha el caché de Docker: si estos archivos no cambian, npm install no se ejecuta de nuevo.
COPY package.json package-lock.json ./

# Instala las dependencias del proyecto.
RUN npm install

# Copia el resto del código fuente de la aplicación.
COPY . .

# Construye la aplicación Angular en modo producción.
# Asegúrate de que 'tu-app' sea el nombre de tu proyecto Angular (normalmente el nombre de la carpeta raíz).
# Si no usas 'base-href', puedes omitirlo.
RUN npm run build --configuration production --output-path ./dist/tu-app

# --- Etapa de Servido (Serve Stage) ---
# Usa una imagen ligera de Nginx para servir la aplicación estática.
FROM nginx:alpine

# Copia la configuración de Nginx (crearemos este archivo en el siguiente paso).
# Si no necesitas una configuración personalizada, puedes omitir esto y Nginx usará la configuración por defecto.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos estáticos construidos desde la etapa de construcción al directorio de Nginx.
# Asegúrate de que 'tu-app' coincida con el nombre que usaste en la etapa de construcción.
COPY --from=build /app/dist/tu-app /usr/share/nginx/html

# Expone el puerto 80, que es el puerto por defecto que usa Nginx.
EXPOSE 80

# Comando para iniciar Nginx cuando el contenedor se ejecute.
CMD ["nginx", "-g", "daemon off;"]
