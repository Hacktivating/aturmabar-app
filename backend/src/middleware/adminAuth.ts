import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) });

    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden. Super Admin access required." });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};