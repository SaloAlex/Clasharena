#!/usr/bin/env node

/**
 * Cron job para escanear partidas automáticamente
 * Ejecutar cada 2-3 minutos en producción
 */

const { exec } = require('child_process');
const path = require('path');

async function runScanMatches() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/jobs/scan-matches`;

  console.log(`[${new Date().toISOString()}] Starting match scan...`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`[${new Date().toISOString()}] Scan completed:`, {
      processedMatches: result.processedMatches,
      newPoints: result.newPoints,
      tournamentsProcessed: result.tournamentsProcessed,
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Scan failed:`, error.message);
  }
}

// Ejecutar inmediatamente si se llama directamente
if (require.main === module) {
  runScanMatches();
}

module.exports = { runScanMatches };

