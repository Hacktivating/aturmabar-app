import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/users";
import memberRoutes from "./routes/members";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/users", userRoutes);

app.use("/api/members", memberRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});