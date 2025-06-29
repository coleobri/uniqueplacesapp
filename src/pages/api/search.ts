import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY || "";
const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

// Keywords/categories to filter out (bars, tourist traps, etc)
const EXCLUDE_KEYWORDS = [
  "bar", "nightclub", "pub", "club", "hotel", "mall", "casino", "tourist", "resort", "chain", "fast food", "restaurant", "brewery", "winery", "liquor", "strip club", "convenience", "supermarket", "grocery", "pharmacy", "pharmacies", "bank", "atm", "car rental", "car dealership", "car wash", "gas station", "parking", "airport", "bus station", "train station", "subway", "transit", "taxi", "ferry", "cruise", "travel agency", "tour operator", "daycare", "party rental"
];

function isUniquePlace(place: any) {
  const name = (place.displayName?.text || "").toLowerCase();
  const types = (place.types || []).map((t: string) => t.toLowerCase());
  // Exclude if any keyword matches name or types
  return !EXCLUDE_KEYWORDS.some((kw) => name.includes(kw) || types.some((t) => t.includes(kw)));
}

function getPlaceId(place: any) {
  return (
    place.id ||
    place.place_id ||
    (place.displayName?.text || "") + "|" + (place.formattedAddress || "")
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Remove voting logic from here (handled by /api/vote)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { query, radiusMiles } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query" });
  }

  // Randomly select a search phrase template
  const PHRASES = [
    "unique things to do in [location]",
    "hidden gems near [location]",
    "unusual places in [location]",
  ];
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  const textQuery = phrase.replace(/\[location\]/gi, query);
  console.log(`[Google Places API] Using phrase: ${phrase} (location: ${query})`);

  // Helper: Geocode location to lat/lng
  async function geocodeLocation(location: string) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === "OK" && data.results && data.results[0]) {
      return data.results[0].geometry.location;
    }
    return null;
  }

  // Default radius: 10 miles if not provided
  const radius = typeof radiusMiles === "number" && radiusMiles > 0 ? radiusMiles : 20;
  const radiusMeters = radius * 1609.34;

  try {
    // Geocode the location
    const latlng = await geocodeLocation(query);
    if (!latlng) {
      return res.status(400).json({ error: "Could not geocode location" });
    }
    const response = await fetch(GOOGLE_PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.types,places.photos,places.location,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri"
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 20
      })
    });
    const data = await response.json();
    if (!data.places) {
      return res.status(200).json({ places: [] });
    }
    // Query approved user submissions within radius
    const userPlaces = await prisma.userSubmission.findMany({
      where: {
        approved: true,
        latitude: {
          gte: latlng.lat - (radiusMeters / 111320),
          lte: latlng.lat + (radiusMeters / 111320),
        },
        longitude: {
          gte: latlng.lng - (radiusMeters / (111320 * Math.cos(latlng.lat * Math.PI / 180))),
          lte: latlng.lng + (radiusMeters / (111320 * Math.cos(latlng.lat * Math.PI / 180))),
        },
      },
      take: 50
    });
    // Map to Google-like format for frontend
    const mappedUserPlaces = userPlaces.map((p: any) => ({
      displayName: { text: p.name },
      formattedAddress: p.address,
      description: p.description,
      location: { latitude: p.latitude, longitude: p.longitude },
      userSubmitted: true,
      _votes: 0, // will update below
    }));
    // Filter out non-unique places
    let uniquePlaces = data.places.filter(isUniquePlace);
    // Fetch vote counts for all places from DB
    const allPlaceIds = [
      ...uniquePlaces.map(getPlaceId),
      ...mappedUserPlaces.map(getPlaceId)
    ];
    const dbVotes = await prisma.place.findMany({
      where: { placeId: { in: allPlaceIds } },
      select: { placeId: true, votes: true },
    });
    const voteMap: Record<string, number> = {};
    dbVotes.forEach(v => { voteMap[v.placeId] = v.votes; });
    // Attach votes and sort by votes descending
    uniquePlaces = uniquePlaces.map((p: any) => ({ ...p, _votes: voteMap[getPlaceId(p)] || 0 }));
    const mappedUserPlacesWithVotes = mappedUserPlaces.map((p: any) => ({ ...p, _votes: voteMap[getPlaceId(p)] || 0 }));
    uniquePlaces.sort((a: any, b: any) => b._votes - a._votes);
    // Pagination logic: 6 per page
    const allPlaces = [...mappedUserPlacesWithVotes, ...uniquePlaces];
    const page = typeof req.body.page === "number" && req.body.page > 0 ? req.body.page : 1;
    const pageSize = 6;
    const total = allPlaces.length;
    const totalPages = Math.ceil(total / pageSize);
    const pagedPlaces = allPlaces.slice((page - 1) * pageSize, page * pageSize);
    res.status(200).json({
      places: pagedPlaces,
      page,
      totalPages,
      total
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch places" });
  }
}
