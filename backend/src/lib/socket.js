import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

let io;
export const initSocket = async (server) => {

  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URl],
      credentials: true
    }
  });

  const eventSub = createClient({
    url: process.env.REDIS_URL
  });

  await eventSub.connect();

  await eventSub.subscribe("socket-events", (message) => {
    try {
        const { room, event, data } = JSON.parse(message);
        io.to(room).emit(event, data);
    } catch (err) {
        console.error("Socket event parse error", err);
    }
  });

  
  io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;

    if (userId) {
      socket.join(userId);
      console.log("User connected:", userId);
    }

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

  });

};

export { io };