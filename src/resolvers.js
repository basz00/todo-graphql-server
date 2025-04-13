import { GraphQLDateTimeISO } from "graphql-scalars";

const resolvers = {
  DateTime: GraphQLDateTimeISO,
  Query: {
    notes: async (_parent, _args, context) => {
      return context.prisma.note.findMany();
    },
  },
  Mutation: {
    createNote: async (_parent, args, context) => {
      const { title, note, creatorId } = args;
      const newNote = await context.prisma.note.create({
        data: {
          title: title || "",
          note,
          creatorId: creatorId ? parseInt(creatorId) : 0,
        },
      });

      const eventPayload = {
        type: "CREATED",
        note: newNote,
        id: newNote.id,
      };
      context.pubsub.publish("NOTE_CHANGED_EVENT", {
        noteChanged: eventPayload,
      });
      return newNote;
    },
    updateNote: async (_parent, args, context) => {
      const { id, title, note, status } = args;
      const updatedNote = await context.prisma.note.update({
        where: { id: parseInt(id) },
        data: {
          ...{ title, status, note },
        },
      });

      const eventPayload = {
        type: "UPDATED",
        note: updatedNote,
        id: updatedNote.id,
      };
      context.pubsub.publish("NOTE_CHANGED_EVENT", {
        noteChanged: eventPayload,
      });
      return updatedNote;
    },
    deleteNote: async (_parent, args, context) => {
      const { id } = args;
      const deletedNote = await context.prisma.note.delete({
        where: { id: parseInt(id) },
      });

      const eventPayload = {
        type: "DELETED",
        note: deletedNote,
        id: deletedNote.id,
      };
      context.pubsub.publish("NOTE_CHANGED_EVENT", {
        noteChanged: eventPayload,
      });
      return deletedNote;
    },
  },
  Subscription: {
    noteChanged: {
      subscribe: (_parent, _args, context) =>
        context.pubsub.asyncIterableIterator(["NOTE_CHANGED_EVENT"]),
    },
  },
};

export default resolvers;
