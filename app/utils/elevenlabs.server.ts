if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY environment variable is required");
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

interface TextToSpeechResponse {
  audioUrl: string;
}

export async function textToSpeech(
  text: string,
  voiceId = "I6FCyzfC1FISEENiALlo"
): Promise<TextToSpeechResponse> {
  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.detail?.message || `API request failed: ${response.statusText}`
      );
    }

    // Convert the audio blob to a base64 string
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return { audioUrl };
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    throw error;
  }
} 