import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { placeId, vote } = req.body;
  if (!placeId || (vote !== "up" && vote !== "down")) {
    return res.status(400).json({ error: "Missing or invalid placeId/vote" });
  }
  try {
    // Upsert vote count for the place
    const place = await prisma.place.upsert({
      where: { placeId },
      update: {
        votes: {
          increment: vote === "up" ? 1 : -1,
        },
      },
      create: {
        name: placeId, // fallback if name is not available
        placeId,
        votes: vote === "up" ? 1 : -1,
      },
    });
    res.status(200).json({ votes: place.votes });
  } catch (error) {
    res.status(500).json({ error: "Failed to update vote" });
  }
}
