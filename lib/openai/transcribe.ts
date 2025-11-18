/**
 * Servicio de transcripción de audio usando OpenAI Whisper API
 */

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe un archivo de audio a texto usando OpenAI Whisper
 * @param audioUrl - URL del archivo de audio (debe ser accesible públicamente)
 * @returns Texto transcrito
 */
export async function transcribeAudio(
  audioUrl: string
): Promise<TranscriptionResult> {
  try {
    console.log(`Iniciando transcripción de audio: ${audioUrl}`);

    // 1. Descargar el audio desde la URL
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      throw new Error(
        `Failed to fetch audio from URL: ${audioResponse.status} ${audioResponse.statusText}`
      );
    }

    // 2. Convertir a blob/buffer
    const audioBlob = await audioResponse.blob();

    // 3. Extraer extensión del archivo de la URL
    const urlPath = new URL(audioUrl).pathname;
    const extension = urlPath.split('.').pop() || 'mp3';
    const fileName = `audio.${extension}`;

    // 4. Preparar FormData para OpenAI
    const formData = new FormData();
    formData.append("file", audioBlob, fileName); // Usar la extensión real del archivo
    formData.append("model", "whisper-1");
    formData.append("language", "es"); // Español por defecto, puedes omitir para detección automática
    formData.append("response_format", "verbose_json"); // Para obtener más info (opcional)

    // 5. Llamar a OpenAI Whisper API
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY no está configurada en las variables de entorno"
      );
    }

    const transcriptionResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: formData,
      }
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(
        `OpenAI Whisper API error: ${transcriptionResponse.status} - ${errorText}`
      );
    }

    const transcriptionData = await transcriptionResponse.json() as any;

    console.log(`Transcripción completada: "${transcriptionData.text}"`);

    return {
      text: transcriptionData.text,
      language: transcriptionData.language,
      duration: transcriptionData.duration,
    };
  } catch (error) {
    console.error("Error transcribiendo audio:", error);
    throw new Error(
      `Transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Valida que una URL de audio sea válida
 */
export function isValidAudioUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Validar que sea HTTPS (más seguro)
    if (parsedUrl.protocol !== "https:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
