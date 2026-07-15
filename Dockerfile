# ─── Imagen base: Node LTS (alpine para imagen liviana) ─────────────────────
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo package.json y package-lock.json primero para aprovechar
# la caché de capas de Docker: si el código cambia pero las dependencias no,
# no se reinstalan.
COPY package*.json ./

# Instalación de dependencias (--include=dev porque nodemon es devDependency)
RUN npm install

# El código fuente se monta como volumen en docker-compose.yml (hot-reload),
# así que no hacemos COPY . . en desarrollo.
# En producción cambiar por COPY . . y CMD ["node", "app.js"].

# Puerto expuesto por la API
EXPOSE 3000

# Comando de arranque — docker-compose.yml lo sobreescribe con nodemon
CMD ["node", "app.js"]
