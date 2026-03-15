import { createClient } from "redis";

const pub = createClient({
  url: process.env.REDIS_URL
});

await pub.connect();

export const emitSocketEvent = async (room, event, data) => {
  try {
    await pub.publish(
      "socket-events",
      JSON.stringify({ room, event, data })
    );
  } catch (err) {
    console.error("Socket publish failed", err);
  }
};