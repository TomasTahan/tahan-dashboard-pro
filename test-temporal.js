/**
 * Script de prueba para los endpoints de Temporal
 *
 * Uso:
 *   node test-temporal.js process-receipt
 *   node test-temporal.js create-expense
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testProcessReceipt() {
  console.log('🧪 Probando endpoint /api/process-receipt...\n');

  const testData = {
    trip_id: "test-trip-123",
    fotoUrl: "https://example.com/test-receipt.jpg",
    conductorDescription: "Compra de combustible para el viaje",
    // audioUrl: "https://example.com/test-audio.mp3" // Opcional
  };

  try {
    const response = await fetch(`${API_BASE}/api/process-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    console.log('📊 Respuesta del servidor:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Workflow iniciado exitosamente!');
      console.log(`   Workflow ID: ${data.workflowId}`);
      console.log('\n💡 Puedes monitorear este workflow en la UI de Temporal');
    } else {
      console.log('\n❌ Error en la respuesta');
    }

    return data;
  } catch (error) {
    console.error('❌ Error ejecutando test:', error.message);
    throw error;
  }
}

async function testCreateExpense() {
  console.log('🧪 Probando endpoint /api/create-expense...\n');

  const testData = {
    boleta_id: 1, // ID de una boleta existente en tu DB
    product_id: 123, // Opcional: ID del producto en Odoo
  };

  try {
    const response = await fetch(`${API_BASE}/api/create-expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    console.log('📊 Respuesta del servidor:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Workflow iniciado exitosamente!');
      console.log(`   Workflow ID: ${data.workflowId}`);
      console.log('\n💡 Puedes monitorear este workflow en la UI de Temporal');
    } else {
      console.log('\n❌ Error en la respuesta');
    }

    return data;
  } catch (error) {
    console.error('❌ Error ejecutando test:', error.message);
    throw error;
  }
}

// Main
const command = process.argv[2];

if (!command) {
  console.log('📖 Uso:');
  console.log('  node test-temporal.js process-receipt   - Prueba el procesamiento de boletas');
  console.log('  node test-temporal.js create-expense    - Prueba la creación de gastos en Odoo');
  console.log('\n💡 Asegúrate de tener el servidor Next.js corriendo (npm run dev)');
  process.exit(0);
}

switch (command) {
  case 'process-receipt':
    testProcessReceipt();
    break;
  case 'create-expense':
    testCreateExpense();
    break;
  default:
    console.error('❌ Comando desconocido:', command);
    process.exit(1);
}
