"use server";

import { z } from "zod";
import { supabase } from "@/lib/supabase/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data.map((category) => category.name);
}

async function getCategoryIds(categoryNames) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .in("name", categoryNames);

  if (error) {
    console.error("Error fetching category IDs:", error);
    return [];
  }

  return data;
}

async function searchWithGemini(url, categories) {
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
    "currency": , (SGD if unknown)
  },
  "categories": ["", ...] (select all applicable categories from the list of possible categories)
}

<possible_categories>
${categories.join(", ")}
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
      console.error(
        "Failed to parse Gemini FLASH response as JSON:",
        parseError
      );
    }
    return parsed;
  } catch (error) {
    console.error("Error in searchWithGemini:", error);
    return {};
  }
}

async function categorizeSubreddit(subreddit, categories) {
  try {
    const prompt = `<instruction>
You are a web scraping assistant. Your task is to categorize the provided subreddit, ${subreddit}, into one or more categories. Only return the following fields as a JSON object:
<response_format>
{
  "categories": ["", ...] (select all applicable categories from the list of possible categories)
}

<possible_categories>
${categories.join(", ")}
</possible_categories>
</instruction>

<web_data>
${subreddit.name}
${subreddit.description}
</web_data>`;

    const result = await model.generateContent(prompt);

    let parsed = {};
    try {
      console.log(result.response.text());
      parsed = JSON.parse(result.response.text().replace(/^```json|```$/g, ""));
    } catch (parseError) {
      console.error("Failed to parse Gemini FLASH response as JSON:", parseError);
    }
    return parsed;
  }
  catch (error) {
    console.error("Error in categorizeSubreddit:", error);
    return {};
  }
}

async function insertCategoryEvents(eventUrl, categoryIds) {
  const categoryEvents = categoryIds.map((categoryId) => ({
    event_url: eventUrl, // Changed from event_id to event_url
    category_id: categoryId,
  }));

  // Delete existing category relationships for this event
  const { error: deleteError } = await supabase
    .from("category_events")
    .delete()
    .eq("event_url", eventUrl);

  if (deleteError) {
    console.error("Error deleting existing category events:", deleteError);
    throw deleteError;
  }

  // Insert new category relationships
  const { error: insertError } = await supabase
    .from("category_events")
    .insert(categoryEvents);

  if (insertError) {
    console.error("Error inserting category_events:", insertError);
    throw insertError;
  }
}

const eventSchema = z.object({
  eventLink: z
    .string()
    .url()
    .refine((url) => url.includes("eventbrite.") || url.includes("lu.ma"), {
      message: "Only eventbrite and lu.ma links are allowed",
    }),
});

async function checkEventsByUrl(inputUrl) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("url", inputUrl.toLowerCase())
      .is("name", null);

    if (error) {
      throw error;
    }

    return {
      hasNullNames: data.length > 0,
      matchingEvents: data,
      count: data.length,
    };
  } catch (error) {
    console.error("Error checking events:", error.message);
    throw error;
  }
}

export async function registerEvent(prevState, formData) {
  const eventLink = formData.get("eventLink").toLowerCase(); // Normalize URL to lowercase

  try {
    const validatedData = eventSchema.parse({ eventLink });
    const { hasNullNames, count } = await checkEventsByUrl(
      validatedData.eventLink
    );

    if (hasNullNames || count === 0) {
      // Fetch categories first
      const categories = await fetchCategories();

      // Get metadata including categories from Gemini
      const metadata = await searchWithGemini(
        validatedData.eventLink,
        categories
      );

      const eventData = {
        url: validatedData.eventLink, // This is now the primary key
        datetime: metadata.event.datetime,
        address: metadata.event.address,
        price: metadata.event.price !== undefined ? metadata.event.price : "0",
        currency: metadata.event.currency || "SGD",
        lat: metadata.event.latitude,
        lon: metadata.event.longitude,
        country: metadata.event.country,
        verified: false,
        name: metadata.event.title,
        description: metadata.event.description,
        image_url: metadata.event.thumbnail_image_url,
        short_description: metadata.event.short_description,
      };

      // Upsert the event using the URL as the primary key
      const { error: eventError } = await supabase
        .from("events")
        .upsert([eventData]);

      if (eventError) {
        throw eventError;
      }

      if (metadata.categories) {
        // Get category IDs for the matched categories
        const categoryData = await getCategoryIds(metadata.categories);
        const categoryIds = categoryData.map((cat) => cat.id);

        // Insert category-event relationships using the URL
        await insertCategoryEvents(validatedData.eventLink, categoryIds);
      }

      return {
        success: true,
        message: "Event registered successfully with categories!",
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }
    console.error("Error registering event:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getAllEvents() {
  const { data, error } = await supabase.from("events").select(`
      *,
      category_events (
        categories (
          id,
          name
        )
      )
    `);

  if (error) {
    console.error("Error fetching events:", error);
    return { success: false, error };
  }
  return { success: true, events: data };
}


export async function getSubredditEvents(subreddit) {
  // fetch the subreddit from the database
  const { data, error } = await supabase
    .from("subreddits")
    .select('*')
    .eq('name', subreddit);

  if (error) {
    console.error("Error fetching subreddit:", error);
    return { success: false, error };
  }

  if (data.length === 0) {
    // fetch the subreddit to check if it exists on reddit
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/about.json`);
      if (!response.ok) {
        return { success: false, error: "Subreddit not found" };
      }
      else {
        const data = await response.json();
        subreddit = {
          name: data.data.display_name,
          description: data.data.public_description
        };
      }
    } catch (error) {
      console.error("Error fetching subreddit:", error);
      return { success: false, error };
    }

    // since subreddit not found, add subreddit
    const { success, error } = await addSubreddit(subreddit);
    if (!success) {
      return { success: false, error };
    }

    // get subreddit id of the newly added subreddit
    const { data, error: fetchError } = await supabase
      .from("subreddits")
      .select('*')
      .eq('name', subreddit.name);

    if (fetchError) {
      console.error("Error fetching subreddit:", fetchError);
      return { success: false, error: fetchError };
    }

    // gemini to categorize subreddit
    const categories = await fetchCategories();
    const { categories: subredditCategories } = await categorizeSubreddit(subreddit, categories);

    // Insert subreddit categories
    const categoryData = await getCategoryIds(subredditCategories);
    const categoryIds = categoryData.map(cat => cat.id);

    const { error: insertError } = await supabase
      .from("subreddit_categories")
      .insert(categoryIds.map(categoryId => ({
        subreddit_id: data[0].id,
        category_id: categoryId
      }))
    );

    if (insertError) {
      console.error("Error inserting subreddit categories:", insertError);
      return { success: false, error: insertError };
    }

    // Fetch events for the categories of the subreddit
    const { data: events, error: eventsError } = await supabase
      .from("category_events")
      .select("event_url")
      .in("category_id", categoryIds);

    if (eventsError) {
      console.error("Error fetching events for subreddit:", eventsError);
      return { success: false, error: eventsError };
    }

    // ensure unique events
    const eventUrls = events.map(event => event.event_url);
    const uniqueEventUrls = [...new Set(eventUrls)];

    // fetch all event details using the unique event urls
    const { data: eventDetails, error: eventDetailsError } = await supabase
    .from("events")
    .select('*')
    .in('url', uniqueEventUrls);

    if (eventDetailsError) {
      console.error("Error fetching event details:", eventDetailsError);
      return { success: false, error: eventDetailsError };
    }

    return { success: true, events: eventDetails };
  }
  else {
    const { data: subredditCategories, error: categoriesError } = await supabase
      .from("subreddit_categories")
      .select('*')
      .eq('subreddit_id', data[0].id);

    if (categoriesError) {
      console.error("Error fetching subreddit categories:", categoriesError);
      return { success: false, error: categoriesError };
    }

    const categoryIds = subredditCategories.map(cat => cat.category_id);

    // Fetch events for the categories of the subreddit
    const { data: events, error: eventsError } = await supabase
      .from("category_events")
      .select("event_url")
      .in("category_id", categoryIds);

    if (eventsError) {
      console.error("Error fetching events for subreddit:", eventsError);
      return { success: false, error: eventsError };
    }

    // ensure unique events
    const eventUrls = events.map(event => event.event_url);
    const uniqueEventUrls = [...new Set(eventUrls)];

    // fetch all event details using the unique event urls
    const { data: eventDetails, error: eventDetailsError } = await supabase
      .from("events")
      .select('*')
      .in('url', uniqueEventUrls);

    if (eventDetailsError) {
      console.error("Error fetching event details:", eventDetailsError);
      return { success: false, error: eventDetailsError };
    }

    return { success: true, events: eventDetails };
  }
}

export async function addSubreddit(subreddit) {
  const { data, error } = await supabase
    .from("subreddits")
    .insert({ name: subreddit.name });

  if (error) {
    console.error("Error adding subreddit:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function trackEventClick(eventUrl, githubUsername) {
  const { error } = await supabase.from("event_clicks").insert([
    {
      event_url: eventUrl,
      username: githubUsername,
    },
  ]);

  if (error) {
    console.error("Error tracking event click:", error);
    return { success: false, error };
  }
  return { success: true };
}

export async function getAllEventClickCounts() {
  const { data, error } = await supabase
    .from("event_clicks")
    .select("event_url, username");
  if (error) {
    console.error("Error fetching event clicks:", error);
    return {};
  }
  const counts = {};
  data.forEach(item => {
    if (counts[item.event_url]) {
      counts[item.event_url].add(item.username);
    } else {
      counts[item.event_url] = new Set([item.username]);
    }
  });
  Object.keys(counts).forEach(key => {
    counts[key] = Array.from(counts[key]);
  });
  return counts;
}
