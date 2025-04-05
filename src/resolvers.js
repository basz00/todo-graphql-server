const resolvers = {
  Query: {
    todos: async (_parent, _args, context) => {
      return context.prisma.todo.findMany();
    },
  },
  Mutation: {
    createTodo: async (_parent, args, context) => {
      const { note } = args;
      const newTodo = await context.prisma.todo.create({
        data: {
          note,
        },
      });
      context.pubsub.publish("TODO_UPDATED", { todoUpdated: newTodo });
      return newTodo;
    },
    updateTodo: async (_parent, args, context) => {
      const { id, status, note } = args;
      const updatedTodo = await context.prisma.todo.update({
        where: { id: parseInt(id) },
        data: {
          ...{ status, note },
        },
      });
      context.pubsub.publish("TODO_UPDATED", { todoUpdated: updatedTodo });
      return updatedTodo;
    },
    deleteTodo: async (_parent, args, context) => {
      const { id } = args;
      const deletedTodo = await context.prisma.todo.delete({
        where: { id: parseInt(id) },
      });
      context.pubsub.publish("TODO_UPDATED", { todoUpdated: deletedTodo });
      return deletedTodo;
    },
  },
  Subscription: {
    todoUpdated: {
      subscribe: (_parent, _args, context) =>
        context.pubsub.asyncIterableIterator(["TODO_UPDATED"]),
    },
  },
};

export default resolvers;
