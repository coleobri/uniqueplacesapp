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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const submissions = await prisma.userSubmission.findMany({
      where: { approved: false },
      orderBy: { submittedAt: "desc" },
    });
    res.status(200).json({ submissions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
}
