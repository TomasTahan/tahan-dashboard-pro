import { Client, Connection } from "@temporalio/client";

let client: Client | undefined;

export async function getTemporalClient() {
  if (client) return client;

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
    tls: false, // Disable TLS for local development
  });

  client = new Client({
    connection,
  });

  return client;
}
