import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.NEON_DB;

export const sql = neon(connectionString);