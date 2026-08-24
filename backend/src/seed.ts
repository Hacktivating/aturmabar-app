import { db } from "./db";
import { users } from "./db/schema";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    const passwordHash = await bcrypt.hash("thisisthepassword", 10);
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@aturmabar.local",
      passwordHash,
      isVerified: true,
      role: "admin",
    });
    
    console.log("Admin account successfully created.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
}

seedAdmin();