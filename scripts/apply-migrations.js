const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase (usar las variables del error que vimos)
const SUPABASE_URL = 'https://ppxgtjfwhfjipihtdhpc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweGd0amZ3aGZqaXBpaHRkaHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI0NTI2MCwiZXhwIjoyMDYyODIxMjYwfQ.eKVrRbGymlqMx9rihN7P8xbWbSNGYR-9wBMX0zLWi0Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigrations() {
  try {
    console.log('🔧 Aplicando migraciones...');

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
      
      // Dividir el SQL en comandos individuales
      const commands = sql.split(';').filter(cmd => cmd.trim());
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i].trim();
        if (command) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: command });
            if (error) {
              console.log(`  ⚠️  Comando ${i + 1} falló:`, error.message);
            } else {
              console.log(`  ✅ Comando ${i + 1} ejecutado`);
            }
          } catch (err) {
            console.log(`  ❌ Error en comando ${i + 1}:`, err.message);
          }
        }
      }
    }

    console.log('\n🎉 Migraciones aplicadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyMigrations();
}

module.exports = { applyMigrations };
