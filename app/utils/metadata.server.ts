import * as cheerio from 'cheerio';

interface Metadata {
  title: string;
  description: string | null;
  favicon: string | null;
}

export async function fetchMetadata(url: string): Promise<Metadata> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      url;

    const description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null;

    const favicon = 
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      new URL('/favicon.ico', url).href;

    return { 
      title: title.trim(),
      description: description?.trim() || null,
      favicon: favicon || null
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {
      title: url,
      description: null,
      favicon: null
    };
  }
}