import { AuthenticationError } from "apollo-server-express"; // Correct import for AuthenticationError
import models from "../models/index.js";
import { BookDocument } from "../models/Book.js"; // Ensure this import points to the correct model
import { signToken } from "../services/auth.js";
const {User} = models
interface IUserDocument {
    username: string;
    email: string;
    password: string;
    savedBooks: BookDocument[];
}

const resolvers = {
    Query: {
        me: async (_: unknown, __: unknown, context: any): Promise<IUserDocument | null | any> => {
            if (context.user) {
                const user = await User.findById(context.user._id).select('-__v -password');
                return user;
            }
            throw new AuthenticationError('Not logged in');
        },
    },

    Mutation: {
       // Example for login mutation, added for completeness
        login: async (_parent: unknown, { email, password }: { email: string; password: string }): Promise<{ token: string; user: IUserDocument | any }> => {
            const user = await User.findOne({ email });
            if (!user || !(await user.isCorrectPassword(password))) {
                throw new AuthenticationError('Invalid credentials');
            }
            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },

        // Save a book (added for completeness)
        saveBook: async (_: unknown, { authors, description, title, bookId, image, link }: { authors: string[], description: string, title: string, bookId: string, image: string, link: string }, context: any) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    context.user._id,
                    { $addToSet: { savedBooks: { authors, description, title, bookId, image, link } } },
                    { new: true }
                ).select('-__v -password');
                return updatedUser;
            }
            throw new AuthenticationError('Not logged in');
        },

        // Remove a book (added for completeness)
        removeBook: async (_: unknown, { bookId }: { bookId: string }, context: any) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    context.user._id,
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                ).select('-__v -password');
                return updatedUser;
            }
            throw new AuthenticationError('Not logged in');
        },
    },
};

export default resolvers;