"use server"

<<<<<<< Updated upstream
import { z } from "zod"
=======
import { z } from "zod";
import { supabase } from "@/lib/supabase/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEEPSEEK_URL = process.env.DEEPSEEK_URL || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

/**
 * Extracts metadata from a URL's HTML head section.
 * @param {string} url - The URL to extract metadata from.
 * @returns {Promise<Object>} A metadata object.
 */
// async function extractFromHead(url) {
//   try {
//     const response = await fetch(url);
//     const html = await response.text();

//     // Extract the <head> section from the HTML
//     const headContent = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [])[1] || "";

//     // Build the metadata object with default null values.
//     const metadata = {
//       url: url,
//       datetime: null,
//       lat: null,
//       lon: null,
//       address: null,
//       country: null,
//       price: null,
//       currency: null,
//     };

//     // Extract datetime from <meta property="event:start_time" content="...">
//     const datetimeMatch = headContent.match(
//       /<meta\s+property=["']event:start_time["'][^>]*content=["']([^"']+)["']/i
//     );
//     metadata.datetime = datetimeMatch ? datetimeMatch[1] : null;

//     // Extract latitude from <meta property="event:location:latitude" content="...">
//     const latMatch = headContent.match(
//       /<meta\s+property=["']event:location:latitude["'][^>]*content=["']([^"']+)["']/i
//     );
//     metadata.lat = latMatch ? latMatch[1] : null;

//     // Extract longitude from <meta property="event:location:longitude" content="...">
//     const lonMatch = headContent.match(
//       /<meta\s+property=["']event:location:longitude["'][^>]*content=["']([^"']+)["']/i
//     );
//     metadata.lon = lonMatch ? lonMatch[1] : null;

//     // Extract address from <meta name="twitter:data1" value="...">
//     const addressMatch = headContent.match(
//       /<meta\s+name=["']twitter:data1["'][^>]*value=["']([^"']+)["']/i
//     );
//     metadata.address = addressMatch ? addressMatch[1] : null;

//     // Extract country from <meta property="og:locale" content="...">
//     const countryMatch = headContent.match(
//       /<meta\s+property=["']og:locale["'][^>]*content=["']([^"']+)["']/i
//     );
//     metadata.country = countryMatch ? countryMatch[1] : null;

//     // match price from "price":"xx.xx"
//     const priceMatch = headContent.match(/"price":"(\d+\.\d{2})"/i);
//     metadata.price = priceMatch ? priceMatch[1] : null;

//     // match currency from "priceCurrency":"USD"
//     const currencyMatch = headContent.match(/"priceCurrency":"([A-Z]{3})"/i);
//     metadata.currency = currencyMatch ? currencyMatch[1] : null;
//     // Price and currency extraction can be added here if available.
//     return metadata;
//   } catch (error) {
//     console.error("Error in extractFromHead:", error);
//     return {
//       url: url,
//       datetime: null,
//       lat: null,
//       lon: null,
//       address: null,
//       country: null,
//       price: null,
//       currency: null,
//     };
//   }
// }

/**
 * Uses DeepSeek to scrape the URL and extract missing metadata.
 * @param {string} url - The URL to scrape.
 * @param {string[]} missingFields - Array of metadata fields to extract.
 * @returns {Promise<Object>} Parsed metadata object.
 */

async function searchWithGemini(url) {
  try {

    const response = await fetch(url);
    const html = await response.text();

    const prompt = `<instruction>
You are a web scraping assistant. Your task is to parse the provided webpage's HTML, available in <web_data>, to extract metadata. Only return the following fields as a JSON object: 
<response_format>
{
  "event": {
  "title": "",
  "thumbnail_image_url": "",
  "description": "",
  "short_description": "", (summarise the description）
  "datetime": "", (MM/DD/YYYY HH:MM:SS)
  "latitude": ,
  "longitude": ,
  "address": "", (street address)
  "country": "", (full name)
  "price": , (0 if free)
  "currency" , (SGD if unknown)
  },
  "categories": ["", ...] (select all applicable categories from the list of possible categories)
}

</response_format>
if you cannot find any fields, return as null.

do not include anything in your response other than the explicitly requested json.

<possible_categories>

</possible_categories>
</instruction>

<web_data>
${html}
</web_data>`;

    const result = await model.generateContent(prompt);

    let parsed = {};
    try {
      parsed = JSON.parse(result.response.text().replace(/^```json|```$/g, ""));
    } catch (parseError) {
      console.error("Failed to parse Gemini FLASH response as JSON:", parseError);
    }
    return parsed;

  } catch (error) {
    console.error("Error in searchWithGemini:", error);
    return {};
  }
}

async function searchWithDeepSeek(url, missingFields) {
  try {
    const systemMessage = `You are a web scraping assistant. Your task is to fetch and parse the provided webpage's HTML to extract metadata. Only return the following fields as a JSON object: ${missingFields.join(
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
        model: "deepseek-reasoner", // or "deepseek-chat" if you prefer
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    const results = await response.json();
    let parsed = {};
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
>>>>>>> Stashed changes

const eventSchema = z.object({
  eventLink: z
    .string()
    .url()
<<<<<<< Updated upstream
    .refine((url) => url.includes("eventbrite.com") || url.includes("lu.ma"), {
      message: "Only Eventbrite and Lu.ma links are allowed",
=======
    .refine((url) => url.includes("eventbrite.") || url.includes("lu.ma"), {
      message: "Only eventbrite and lu.ma links are allowed",
>>>>>>> Stashed changes
    }),
})

export async function registerEvent(prevState, formData) {
  const eventLink = formData.get("eventLink")

  try {
    const validatedData = eventSchema.parse({ eventLink })

    // Here you would typically save the event link to your database
    // For this example, we'll just simulate a successful registration
    console.log("Event registered:", validatedData.eventLink)

    return {
      success: true,
      message: "Event registered successfully!",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      }
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

