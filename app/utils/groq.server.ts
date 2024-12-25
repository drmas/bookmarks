if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

interface SummaryMetadata {
  originalLength: number;
  processingTimeMs: number;
  source: 'auto' | 'manual';
}

interface SummaryResponse {
  summary: string;
  metadata: SummaryMetadata;
}

export async function generateSummary(
  content: string,
  maxLength: number = 150,
  source: 'auto' | 'manual' = 'manual'
): Promise<SummaryResponse> {
  // Input validation
  if (!content?.trim()) {
    throw new Error('Content is required');
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You are a precise summarizer. Create a concise summary of the provided content in ${maxLength} words or less. Focus on key points and maintain professional language.`
        }, {
          role: 'user',
          content: content
        }],
        temperature: 0.8,
        max_tokens: 1024,
        top_p: 1,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `API request failed: ${response.statusText}`
      );
    }

    const result = await response.json();
    
    if (!result?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Groq API');
    }
    
    const summary = result.choices[0].message.content.trim();

    return {
      summary,
      metadata: {
        originalLength: content.length,
        processingTimeMs: Date.now() - startTime,
        source,
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Summary generation timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}