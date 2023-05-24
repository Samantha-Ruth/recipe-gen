const { User, RecipeSchema } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");
const fetch = require("cross-fetch");
require("dotenv").config();

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const username = context.user.username;
        const userData = await User.findOne({ username }).select(
          "-__v -password"
        );

        return userData;
      }

      throw new AuthenticationError("Not logged in");
    },
    getUser: async (parent, args) => {
      const users = await User.find({}).select("-__v -password");
      return users;
    },
    getSingleUser: async (parent, { username }) => {
      const userData = await User.findOne({ username }).select(
        "-__v -password"
      );
      return userData;
    },
    getRecipe: async (parent, { ingredients, page }) => {
      let recipes = [RecipeSchema];
      if (!page) page=0;
      const start = page*40;
      try {
        // synchronous fetch - takes upwards of 2 seconds
        const response = await fetch(
          `https://tasty.p.rapidapi.com/recipes/list?from=${start}&size=40&q=${ingredients}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.API_KEY,
              "X-RapidAPI-Host": "tasty.p.rapidapi.com",
            },
          }
        );
        // response.ok?
        const data = await response.json();
        console.log(`Fetch to tasty API executed for ${ingredients}: results ${data.results.length}`);
        const isMore = data.count > (page+1)*40;
        // Filter out non-recipes
        data.results = data.results.filter((result) =>
          result.canonical_id.includes("recipe")
        );
        // deconstruct and save only the data we want
        data.results = data.results.map(
          ({
            name,
            id,
            description,
            thumbnail_url,
            instructions,
            sections,
          }) => {
            const directions = instructions.map(({ display_text }) => {
              return display_text;
            });
            const ingredients = sections[0].components.map(({ raw_text }) => {
              const rawText = raw_text;
              return rawText;
            });

            return {
              name,
              id,
              description,
              thumbnail_url,
              directions,
              ingredients,
            };
          }
        );
        recipes = data.results;
        return { recipes: recipes, isMore };
      } catch (err) {
        console.log(err);
        return;
      }
      //yada yada yada
    },
    getDessertInsp: async (parent, { dessertArr }) => {
      let recipes = [RecipeSchema];
      try {
        // synchronous fetch - takes upwards of 2 seconds
        const response = await fetch(
          `https://tasty.p.rapidapi.com/recipes/list?from=0&size=40&q=${dessertArr}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.API_KEY,
              "X-RapidAPI-Host": "tasty.p.rapidapi.com",
            },
          }
        );
        // response.ok?
        const data = await response.json();
        
        console.log(`Fetch to tasty API executed for ${dessertArr}: results ${data.results.length}`);
        // Filter out non-recipes
        data.results = data.results.filter((result) =>
          result.canonical_id.includes("recipe")
        );
        // deconstruct and save only the data we want
        data.results = data.results.map(
          ({
            name,
            id,
            description,
            thumbnail_url,
            instructions,
            sections,
          }) => {
            const directions = instructions.map(({ display_text }) => {
              return display_text;
            });
            const ingredients = sections[0].components.map(({ raw_text }) => {
              const rawText = raw_text;
              return rawText;
            });

            return {
              name,
              id,
              description,
              thumbnail_url,
              directions,
              ingredients,
            };
          }
        );
        recipes = data.results;

        var gen_nums = [];

        function in_array(recipes, el) {
          for(var i = 0 ; i < recipes.length; i++) 
              if(recipes[i] == el) return true;
          return false;
        }

        function get_rand(recipes) {
            var rand = recipes[Math.floor(Math.random()*recipes.length)];
            if(!in_array(gen_nums, rand)) {
              gen_nums.push(rand); 
              return rand;
            }
            return get_rand(recipes);
        }
        const randRecipes = []
        for(var i = 0; i < 10; i++) {
          randRecipes.push(get_rand(recipes));
        }
        console.log(randRecipes);
        return randRecipes;
      } catch (err) {
        console.log(err);
        return;
      }
    },
    getDinnerInsp: async (parent, { dinnerArr }) => {
      let recipes = [RecipeSchema];
      try {
        // synchronous fetch - takes upwards of 2 seconds
        const response = await fetch(
          `https://tasty.p.rapidapi.com/recipes/list?from=0&size=40&q=${dinnerArr}`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.API_KEY,
              "X-RapidAPI-Host": "tasty.p.rapidapi.com",
            },
          }
        );
        // response.ok?
        const data = await response.json();
        console.log(`Fetch to tasty API executed for ${dinnerArr}: results ${data.results.length}`);
        // Filter out non-recipes
        data.results = data.results.filter((result) =>
          result.canonical_id.includes("recipe")
        );
        // deconstruct and save only the data we want
        data.results = data.results.map(
          ({
            name,
            id,
            description,
            thumbnail_url,
            instructions,
            sections,
          }) => {
            const directions = instructions.map(({ display_text }) => {
              return display_text;
            });
            const ingredients = sections[0].components.map(({ raw_text }) => {
              const rawText = raw_text;
              return rawText;
            });

            return {
              name,
              id,
              description,
              thumbnail_url,
              directions,
              ingredients,
            };
          }
        );
        
        recipes = data.results;
        var gen_nums = [];

        function in_array(recipes, el) {
          for(var i = 0 ; i < recipes.length; i++) 
              if(recipes[i] == el) return true;
          return false;
        }

        function get_rand(recipes) {
            var rand = recipes[Math.floor(Math.random()*recipes.length)];
            if(!in_array(gen_nums, rand)) {
              gen_nums.push(rand); 
              return rand;
            }
            return get_rand(recipes);
        }
        const randRecipes = []
        for(var i = 0; i < 10; i++) {
          randRecipes.push(get_rand(recipes));
        }

        return randRecipes;
      } catch (err) {
        console.log(err);
        return;
      }
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);

      return { token, user };
    },
    saveRecipe: async (parent, args, context) => {
      if (context.user) {
        console.log(args);
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: {
              savedRecipes: args,
            },
          },
          { new: true, runValidators: true }
        );

        return user;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
    removeRecipe: async (parent, { id }, context) => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $pull: {
              savedRecipes: { id: id },
            },
          },
          { new: true, runValidators: true }
        );
        return user;
      }
    },
  },
};

module.exports = resolvers;