const { response } = require("express");
const fetch = require("cross-fetch");
require("dotenv").config();

const router = require("express").Router();

router.route("/").get((req, res) => {
  // TODO: should ingredients be an array to allow for multiple ingredients?
  let ingredients = req.query.q;

  let url = `https://tasty.p.rapidapi.com/recipes/list?from=0&size=20&q=${ingredients}`;

  console.log(url);
  console.log(process.env.API_KEY);
  fetch(url, {
    headers: {
      "X-RapidAPI-Key": process.env.API_KEY,
      "X-RapidAPI-Host": "tasty.p.rapidapi.com",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      recipeResults = data.results.filter((result) =>
        result.canonical_id.includes("recipe")
      );
      console.log(recipeResults);
      newRecipe = recipeResults.map(
        ({ name, id, description, thumbnail_url, instructions, sections }) => {
          const directions = instructions.map(({ display_text }) => {
            return { display_text };
          });
          const ingredients = sections[0].components.map(({ raw_text }) => {
            const rawText = raw_text;
            return { rawText };
          });

          return { name, id, description, thumbnail_url, directions, ingredients };
        }
      );
      console.log(newRecipe);
      res.json(newRecipe);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
