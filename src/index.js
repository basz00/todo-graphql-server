import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import http from "http";
import fs from "fs";
import path from "path";
import resolvers from "./resolvers.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { PubSub } from "graphql-subscriptions";

const prisma = new PrismaClient();
const pubsub = new PubSub();

// Load typeDefs
const typeDefs = fs.readFileSync(
  path.join(process.cwd(), "src", "schema.graphql"),
  "utf-8"
);

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Setup Express
const app = express();
const httpServer = http.createServer(app);

// Setup Apollo Server
const apolloServer = new ApolloServer({ schema });
await apolloServer.start();
app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(apolloServer, {
    context: async () => ({ prisma, pubsub }),
  })
);

// Setup WebSocket for Subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
useServer({ schema, context: async () => ({ prisma, pubsub }) }, wsServer);

// Start Server
httpServer.listen(4000, () => {
  console.log("🚀 HTTP Server running at http://localhost:4000/graphql");
  console.log("📡 Subscriptions at ws://localhost:4000/graphql");
});
