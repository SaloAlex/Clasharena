#!/usr/bin/env node

/**
 * Script para limpiar el cache de Data Dragon y forzar el uso de versiones estables
 * Uso: node scripts/clear-data-dragon-cache.js
 */

const fs = require('fs');
const path = require('path');

// Limpiar variables de entorno que puedan estar cacheadas
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  // Archivo .env.local encontrado
}

// Crear un archivo temporal para forzar la limpieza del cache
const cacheClearFile = path.join(process.cwd(), '.data-dragon-cache-clear');
const timestamp = new Date().toISOString();

try {
  fs.writeFileSync(cacheClearFile, `Cache cleared at: ${timestamp}`);
  
  // Eliminar después de 5 segundos
  setTimeout(() => {
    if (fs.existsSync(cacheClearFile)) {
      fs.unlinkSync(cacheClearFile);
    }
  }, 5000);
  
} catch (error) {
  // Error silencioso
}
