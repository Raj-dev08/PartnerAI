import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const dbQueues = new Queue("db-queue",{
    connection: redis
})