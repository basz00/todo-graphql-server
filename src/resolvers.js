const resolvers = {
  Query: {
    info: () => "This is the note app test",
    feed: async (parent, args, context) => {
      return context.prisma.link.findMany();
    },
  },
  Mutation: {
    post: (parent, args, context) => {
      const { url, description } = args;
      const newLink = context.prisma.link.create({
        data: {
          url,
          description,
        },
      });
      return newLink;
    },
  },
  //   no need, because graphql default resolver will handle this as this contains only primitive data types
  //   Link: {
  //     id: (parent) => parent.id,
  //     description: (parent) => parent.description,
  //     url: (parent) => parent.url,
  //   },
};

module.exports = resolvers;
