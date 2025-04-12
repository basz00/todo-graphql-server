const resolvers = {
  Query: {
    todos: async (_parent, _args, context) => {
      return context.prisma.todo.findMany();
    },
  },
  Mutation: {
    createTodo: async (_parent, args, context) => {
      const { title, note, creatorId } = args;
      const newNote = await context.prisma.todo.create({
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
    updateTodo: async (_parent, args, context) => {
      const { id, title, note, status } = args;
      const updatedNote = await context.prisma.todo.update({
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
    deleteTodo: async (_parent, args, context) => {
      const { id } = args;
      const deletedNote = await context.prisma.todo.delete({
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
