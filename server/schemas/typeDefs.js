// import the gql tagged template function
const { gql } = require("apollo-server-express");

// create our typeDefs
const typeDefs = gql`
  type Recipe {
    name: String!
    id: Int
    description: String
    thumbnail_url: String
    ingredients: [String]
    directions: [String]
  }

  type User {
    _id: ID
    username: String
    email: String
    password: String
    savedRecipes: [Recipe]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    me: User
    getSingleUser(username: String!): User
    getUser: [User]
    getRecipe(ingredients: String!): [Recipe]
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!): Auth
    saveRecipe(
      name: String!
      id: Int!
      description: String
      thumbnail_url: String
      ingredients: [String]
      directions: [String]
      ): User
    removeRecipe(id: Int!): User
  }
`;

// export the typeDefs
module.exports = typeDefs;
