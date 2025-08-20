const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const client = new Client({
  connectionString: 'postgresql://postgres:Soydabid2567@db.ppxgtjfwhfjipihtdhpc.supabase.co:5432/postgres?sslmode=require'
});

async function applyMigrations() {
  try {
    console.log('🔧 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontradas ${migrationFiles.length} migraciones:`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    for (const file of migrationFiles) {
      console.log(`\n📄 Aplicando: ${file}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`  ✅ ${file} aplicado exitosamente`);
      } catch (error) {
        console.log(`  ⚠️  ${file} - algunos comandos pueden haber fallado:`, error.message);
      }
    }

    console.log('\n🎉 Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyMigrations();
}

module.exports = { applyMigrations };
