const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Probando conectividad con Supabase...\n');

  // Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante');
  console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('\n❌ Error: Variables de entorno faltantes');
    return;
  }

  try {
    // Crear cliente de Supabase
    console.log('\n🔧 Creando cliente de Supabase...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Probar conexión básica
    console.log('🌐 Probando conexión básica...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Error en conexión:', error.message);
      console.log('Detalles:', error);
    } else {
      console.log('✅ Conexión exitosa');
      console.log('Datos:', data);
    }

    // Probar autenticación
    console.log('\n🔐 Probando autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Error en autenticación:', authError.message);
    } else {
      console.log('✅ Autenticación funcionando');
      console.log('Sesión:', authData.session ? 'Activa' : 'No hay sesión');
    }

    // Probar ping a Supabase
    console.log('\n🏓 Probando ping a Supabase...');
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Ping exitoso');
      } else {
        console.log('❌ Ping falló:', response.status, response.statusText);
      }
    } catch (pingError) {
      console.log('❌ Error en ping:', pingError.message);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('Stack:', error.stack);
  }
}

testSupabaseConnection();
