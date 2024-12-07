import { AuthenticationError } from "apollo-server-express";
import models from "../models/index.js";
import { signToken } from "../services/auth.js";

const { User } = models; // Ensure User model is properly exported from your models

const resolvers = {
  Query: {
    // Fetch the logged-in user's information
    me: async (_, __, context) => {
      if (context.user) {
        try {
          const user = await User.findById(context.user._id).select("-__v -password");
          return user;
        } catch (err) {
          throw new Error("Failed to fetch user data");
        }
      }
      throw new AuthenticationError("Not logged in");
    },
  },
  Mutation: {
    // Add a new user
    addUser: async (_parent, args) => {
      try {
        const user = await User.create(args);
        const token = signToken({ username: user.username, email: user.email, _id: user._id });
        return { token, user };
      } catch (err) {
        throw new Error("Failed to create user");
      }
    },

    // Log in an existing user
    login: async (_parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user || !(await user.isCorrectPassword(password))) {
          throw new AuthenticationError("Invalid credentials");
        }
        const token = signToken({ username: user.username, email: user.email, _id: user._id });
        return { token, user };
      } catch (err) {
        throw new Error("Login failed");
      }
    },

    // Save a book to the user's account
    saveBook: async (_, { authors, description, title, bookId, image, link }, context) => {
      if (context.user) {
        try {
          const updatedUser = await User.findByIdAndUpdate(
            context.user._id,
            {
              $addToSet: {
                savedBooks: { authors, description, title, bookId, image, link },
              },
            },
            { new: true, runValidators: true }
          ).select("-__v -password");
          return updatedUser;
        } catch (err) {
          throw new Error("Failed to save the book");
        }
      }
      throw new AuthenticationError("Not logged in");
    },

    // Remove a book from the user's account
    removeBook: async (_, { bookId }, context) => {
      if (context.user) {
        try {
          const updatedUser = await User.findByIdAndUpdate(
            context.user._id,
            { $pull: { savedBooks: { bookId } } },
            { new: true }
          ).select("-__v -password");
          return updatedUser;
        } catch (err) {
          throw new Error("Failed to remove the book");
        }
      }
      throw new AuthenticationError("Not logged in");
    },
  },
};

export default resolvers;
