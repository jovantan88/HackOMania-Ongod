import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Metadata {
    url: string
    datetime: Date | null
    lat: string | null
    lon: string | null
    address: string | null
    country: string | null
    price: string | null
    currency: string | null
}

// DeepSeek configuration
const DEEPSEEK_URL = Deno.env.get('DEEPSEEK_URL') ?? ''
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') ?? ''

/**
 * Extracts metadata from a URL's HTML head section
 * @param url - The URL to extract metadata from
 */
async function extractFromHead(url: string): Promise<Metadata> {
    try {
        const response = await fetch(url)
        const html = await response.text()
        
        // Parse HTML using regex (since we're only looking at head section)
        const headContent = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
        
        // Extract metadata using regex patterns
        const metadata: Metadata = {
            url,
            datetime: null,
            lat: null,
            lon: null,
            address: null,
            country: null,
            price: null,
            currency: null
        }

        // Extract latitude from meta tags or data attributes
        const latMatch = headContent.match(/latitude|lat|geo:lat|data-lat/i) || 
                         headContent.match(/content="[^"]*?([0-9.-]+)[^"]*?latitude|lat/i)
        metadata.lat = latMatch?.[1] || null

        // Extract longitude from meta tags or data attributes
        const lonMatch = headContent.match(/longitude|lon|geo:lon|data-lon/i) || 
                         headContent.match(/content="[^"]*?([0-9.-]+)[^"]*?longitude|lon/i)
        metadata.lon = lonMatch?.[1] || null

        // Extract address from meta tags or schema.org data
        const addressMatch = headContent.match(/<meta\s+name="address"[^>]*content="([^"]*)"/i) ||
                             headContent.match(/<meta\s+property="og:address"[^>]*content="([^"]*)"/i)
        metadata.address = addressMatch?.[1] || null

        // Extract country from meta tags or schema.org data
        const countryMatch = headContent.match(/<meta\s+name="country"[^>]*content="([^"]*)"/i) ||
                             headContent.match(/<meta\s+property="og:country"[^>]*content="([^"]*)"/i)
        metadata.country = countryMatch?.[1] || null

        // Extract price and currency from schema.org data
        const priceMatch = headContent.match(/<meta\s+property="price:amount"[^>]*content="([^"]*)"/i) ||
                           headContent.match(/<meta\s+property="product:price:amount"[^>]*content="([^"]*)"/i)
        const currencyMatch = headContent.match(/<meta\s+property="price:currency"[^>]*content="([^"]*)"/i) ||
                             headContent.match(/<meta\s+property="product:price:currency"[^>]*content="([^"]*)"/i)

        metadata.price = priceMatch?.[1] || null
        metadata.currency = currencyMatch?.[1] || null
        
        return metadata
    } catch (error) {
        console.error("Error in extractFromHead:", error);
        return {
            url,
            datetime: null,
            lat: null,
            lon: null,
            address: null,
            country: null,
            price: null,
            currency: null
        };
    }
}

/**
 * Uses DeepSeek to scrape the URL and extract missing metadata
 * @param url - The URL to scrape
 * @param missingFields - Array of metadata fields to extract
 */
async function searchWithDeepSeek(url: string, missingFields: string[]): Promise<Partial<Metadata>> {
  try {
    // Construct a prompt that instructs the model to scrape and extract specific fields
    const systemMessage = `You are a web scraping assistant. Your task is to fetch and parse the provided webpage’s HTML to extract metadata. Only return the following fields as a JSON object: ${missingFields.join(
      ", "
    )}. For any field that cannot be found, use null.`;
    const userMessage = `Please scrape the webpage at ${url} and extract the required metadata.`;

    const response = await fetch(`${DEEPSEEK_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-reasoner", // or use deepseek-chat if preferred
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    const results = await response.json();
    // Expecting the response in the first choice's message content as a JSON string
    let parsed: Partial<Metadata> = {};
    try {
      parsed = JSON.parse(results.choices[0].message.content);
    } catch (parseError) {
      console.error("Failed to parse DeepSeek response as JSON:", parseError);
    }
    return parsed;
  } catch (error) {
    console.error("Error in searchWithDeepSeek:", error);
    return {};
  }
}


/**
 * Main Edge Function handler
 * Handles incoming requests and returns extracted metadata
 */
export async function handler(req: Request): Promise<Response> {
    // Supabase recommends using the request origin for CORS
    const origin = req.headers.get('origin');

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin || '*', // Or specify a specific origin
        'Access-Control-Allow-Headers': 'apikey, X-Client-Info, Authorization, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request body
        const body = await req.json()
        const url = body.url
        
        // Validate required parameter
        if (!url) {
            return new Response(
                JSON.stringify({ error: 'URL is required' }),
                { 
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            )
        }

        // First, try to extract from head
        const headMetadata = await extractFromHead(url)
        
        // Find missing fields
        const missingFields = Object.entries(headMetadata)
            .filter(([key, value]) => key !== 'url' && key !== 'datetime' && !value)
            .map(([key]) => key);

        // If we have missing fields, try DeepSeek
        if (missingFields.length > 0) {
            const deepSeekResults = await searchWithDeepSeek(url, missingFields);
            
            // Merge results (be careful with types here)
            Object.assign(headMetadata, deepSeekResults);
        }

        return new Response(
            JSON.stringify(headMetadata),
            { 
                headers: { 
                    ...corsHeaders, 
                    "Content-Type": "application/json" 
                }
            }
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { 
                status: 500,
                headers: { 
                    ...corsHeaders, 
                    "Content-Type": "application/json" 
                }
            }
        )
    }
}

// Only needed when running locally without the Edge runtime
// Deno.serve(handler); 

