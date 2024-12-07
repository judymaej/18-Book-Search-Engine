import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import db from '../models';;
import typeDefs from './schemas/typeDefs';
import resolvers from './schemas/resolvers';
import { authMiddleware } from '../services/auth';


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware,
  });

  await server.start();
  server.applyMiddleware({ app });

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`🌍 Server running at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
};

startServer();
