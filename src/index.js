import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import resolvers from "./resolvers.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { PubSub } from "graphql-subscriptions";

const prisma = new PrismaClient();
const pubsub = new PubSub();

const httpsOptions = {
  key: fs.readFileSync("./localhost-key.pem"), // private key
  cert: fs.readFileSync("./localhost.pem"), // certificate
};

// Load typeDefs
const typeDefs = fs.readFileSync(
  path.join(process.cwd(), "src", "schema.graphql"),
  "utf-8"
);

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Setup Express
const app = express();
const httpServer = createServer(httpsOptions, app);

// Setup WebSocket for Subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer(
  { schema, context: async () => ({ prisma, pubsub }) },
  wsServer
);

// Setup Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
await server.start();
app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async () => ({ prisma, pubsub }),
  })
);

// Start Server
httpServer.listen(4000, () => {
  console.log("🚀 HTTP Server running at http://localhost:4000/graphql");
  console.log("📡 Subscriptions at ws://localhost:4000/graphql");
});
