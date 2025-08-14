#!/usr/bin/env node

/**
 * Script para aplicar índices de rendimiento a la base de datos
 * Ejecutar después de las migraciones iniciales
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('🔄 Aplicando índices de rendimiento...');
    
    // Leer el archivo de índices
    const indexesPath = path.join(__dirname, '../prisma/migrations/add_performance_indexes.sql');
    const indexesSQL = fs.readFileSync(indexesPath, 'utf8');
    
    // Dividir por líneas y ejecutar cada comando
    const commands = indexesSQL
      .split('\n')
      .filter(line => line.trim().startsWith('CREATE INDEX'))
      .map(line => line.trim());
    
    console.log(`📊 Aplicando ${commands.length} índices...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        await prisma.$executeRawUnsafe(command);
        console.log(`✅ Índice ${i + 1}/${commands.length} aplicado`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ${i + 1}/${commands.length} ya existe`);
        } else {
          console.error(`❌ Error aplicando índice ${i + 1}/${commands.length}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Índices aplicados correctamente');
    
    // Verificar que los índices se crearon
    console.log('\n📋 Verificando índices creados...');
    
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;
    
    console.log(`📊 Se encontraron ${indexes.length} índices:`);
    indexes.forEach(index => {
      console.log(`  - ${index.indexname} en ${index.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Error aplicando índices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyIndexes();
}

module.exports = { applyIndexes };
