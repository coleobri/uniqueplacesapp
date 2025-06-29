import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { id, approve } = req.body;
  if (typeof id !== "number" || typeof approve !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid id/approve" });
  }
  try {
    const updated = await prisma.userSubmission.update({
      where: { id },
      data: { approved: approve },
    });
    res.status(200).json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update submission" });
  }
}
