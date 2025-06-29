import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { name, address, description, latitude, longitude, submitterEmail } = req.body;
  if (!name || !address || !description || typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const submission = await prisma.userSubmission.create({
      data: {
        name,
        address,
        description,
        latitude,
        longitude,
        submitterEmail,
        approved: false,
      },
    });
    res.status(200).json({ success: true, submission });
  } catch {
    res.status(500).json({ error: "Failed to submit place" });
  }
}
