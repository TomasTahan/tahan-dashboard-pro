// Test directo de conexión a Temporal
const { Connection } = require('@temporalio/client');

async function testConnection() {
  console.log('🔌 Intentando conectar a Temporal...');
  console.log('   Address:', process.env.TEMPORAL_ADDRESS || 'localhost:7233');

  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      tls: false,
      connectTimeout: '30s',
      metadata: {},
    });

    console.log('✅ Conexión exitosa!');

    // Intentar obtener info del sistema
    const workflowService = connection.workflowService;
    console.log('   Workflow Service conectado');

    // Listar namespaces para verificar conexión
    const systemInfo = await workflowService.getSystemInfo({});
    console.log('   System Info:', systemInfo);

    await connection.close();
    console.log('\n✅ Test completo - Temporal funciona correctamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles:', error.details);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  }
}

testConnection();
