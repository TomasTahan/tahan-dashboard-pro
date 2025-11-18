import { Connection, Client } from "@temporalio/client";

let cachedClient: Client | null = null;

/**
 * Obtiene el cliente de Temporal (singleton para reutilizar conexión)
 */
export async function getTemporalClient(): Promise<Client> {
  if (cachedClient) {
    return cachedClient;
  }

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
  });

  cachedClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
  });

  return cachedClient;
}

/**
 * Cierra la conexión (útil en desarrollo)
 */
export async function closeTemporalClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.connection.close();
    cachedClient = null;
  }
}
