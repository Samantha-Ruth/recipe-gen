const router = require('express').Router();
const recipeRoutes = require('./recipe-routes');

router.use('/recipes', recipeRoutes);

module.exports = router;