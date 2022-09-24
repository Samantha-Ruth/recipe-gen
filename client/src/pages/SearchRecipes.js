import React, { useState } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { SAVE_RECIPE } from "../utils/mutations";
import { GET_RECIPES, GET_ME } from "../utils/queries";
import {
  Jumbotron,
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  CardColumns,
  Modal,
  ListGroup,
  Image,
} from "react-bootstrap";
import Mosaic from "../components/Mosaic";

import Auth from "../utils/auth";

const SearchRecipes = (props) => {
  // deconstruct state variables from props
  const {
    searchInput,
    setSearchInput,
    searchedRecipes,
    setSearchedRecipes,
    isMore,
    setIsMore,
    page,
    setPage,
  } = props.value;
  // create state for holding clicked recipe
  const [recipe, setRecipe] = useState({});
  // set modal display state
  const [showModal, setShowModal] = useState(false);
  // error state variable
  const [error, setError] = useState("");
  // save recipe using graphql
  const [saveRecipe] = useMutation(SAVE_RECIPE);
  // Check if logged in
  const { loading, data } = useQuery(GET_ME);
  const user = data?.me;
  // removed loading from const { loading, data } since we aren't calling it... yet.
  const [savedRecipeIds, setSavedRecipeIds] = useState([]);
  if (savedRecipeIds.length < user?.savedRecipeIds.length) {
    setSavedRecipeIds(user.savedRecipeIds)
  }
  // console.log(user, user?.savedRecipeIds, savedRecipeIds);
  const client = useApolloClient();
  
  // create method to search for recipes and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    // graphql query
    const { data } = await client.query({
      query: GET_RECIPES,
      variables: { ingredients: searchInput, page: 0 },
    });

    console.log(data.getRecipe.recipes)
    if (data.getRecipe.recipes.length === 0) {
      setError(
        "No results - try entering fewer ingredients or check your spelling"
      );
    } else {
      //   const newRecipe = data.getRecipe.map((data) => {
      //     return {...data, isMissing: data.ingredients.length - searchInput.split(' ').length }
      //   })
      setSearchedRecipes(data.getRecipe.recipes);
      // console.log(data.getRecipe.isMore);
      setIsMore(data.getRecipe.isMore);
      setPage(0);
      setError("");
    }
  };

  const handlePageNext = async (event) => {
    const { data } = await client.query({
      query: GET_RECIPES,
      variables: { ingredients: searchInput, page: page + 1 },
    });
    setSearchedRecipes(data.getRecipe.recipes);
    setPage(page + 1);
  };

  const handlePagePrevious = async (event) => {
    if (page > 0) {
      const { data } = await client.query({
        query: GET_RECIPES,
        variables: { ingredients: searchInput, page: page - 1 },
      });
      setSearchedRecipes(data.getRecipe.recipes);
      setPage(page - 1);
    }
  };

  // create function to handle saving a recipe to our database
  const handleSaveRecipe = async (id) => {

    const recipeToSave = searchedRecipes.find((recipe) => recipe.id === id);
    // get token - only save if user is logged in
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await saveRecipe({
        variables: {...recipeToSave },
      })
     // if book successfully saves to user's account, save recipe id to state
      setSavedRecipeIds([
        ...savedRecipeIds, recipeToSave.id
      ])
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <>
      <Jumbotron fluid className="text-light bg-dark jumbo">
        <Container>
          <h1>What's in your fridge?</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a recipe by ingredients"
                />
                <h4>{error}</h4>
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Container>
      </Jumbotron>
      {searchedRecipes.length ? <Container></Container> : <Mosaic />}
      <Container>
        {searchedRecipes.length ? (
          <>
            <h4>
              {page > 0 ? (
                <Image className="cp p-1" src={"/images/icons8-left.svg"} onClick={handlePagePrevious} />
              ) : (
                <Image
                  className="p-1 arrows-disabled"
                  src={"/images/icons8-left.svg"}
                />
              )}
              {`Viewing ${searchedRecipes.length} results:`}
              {isMore ? (
                <Image
                  className="cp p-1"
                  src={"/images/icons8-right.svg"}
                  onClick={handlePageNext}
                />
              ) : (
                <Image
                  className="p-1 arrows-disabled"
                  src={"/images/icons8-right.svg"}
                />
              )}
            </h4>
          </>
        ) : null}
        <CardColumns>
          {searchedRecipes.map((recipe) => {
            return (
              <Card
                key={recipe.id}
                border="dark"
                className="cp"
              >
                {recipe.thumbnail_url ? (
                  <Card.Img
                    src={recipe.thumbnail_url}
                    alt={`The thumbnail image for ${recipe.name}`}
                    variant="top"
                  />
                ) : null}
                <Card.Body>
                  <Card.Title>{recipe.name}</Card.Title>
                  <Card.Text>{recipe.description}</Card.Text>
                  {/* <p>❗You're missing {recipe.isMissing} ingredients</p> */}
                  <Button
                    className="btn-block btn- border-dark"
                    variant="light"
                    onClick={() => {
                      setRecipe(recipe);
                      setShowModal(true);
                    }}
                  >
                    View this Recipe!
                  </Button>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedRecipeIds?.some(
                        (savedRecipeId) => savedRecipeId === recipe.id
                      )}
                      className="btn-block btn-info"
                      onClick={() => handleSaveRecipe(recipe.id)}
                    >
                      {savedRecipeIds?.some(
                        (savedRecipeId) => savedRecipeId === recipe.id
                      )
                        ? "This recipe has already been saved!"
                        : "Save this Recipe!"}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </CardColumns>
      </Container>
      {/* set modal data up */}
      <Modal
        size="xl"
        show={showModal}
        onHide={() => setShowModal(false)}
        aria-labelledby="recipe-modal"
        // className="my-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title id="recipe-modal">
            <h2>{recipe.name}</h2>
            <h5>{recipe.description}</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12} md={3}>
              {recipe.thumbnail_url ? (
                <Image
                  src={recipe.thumbnail_url}
                  alt={`The thumbnail image for ${recipe.name}`}
                  fluid
                />
              ) : null}
            </Col>
            <Col xs={12} md={3}>
              <h4>Ingredients</h4>
              <ListGroup variant="flush">
                {recipe.ingredients &&
                  recipe.ingredients.map((ingredient, index) => {
                    const arraySearch = searchInput.split(" ");
                    const isPresent = arraySearch.reduce(
                      (is, word) => is || ingredient.includes(word),
                      false
                    );
                    if (isPresent) {
                      return (
                        <ListGroup.Item variant="success" key={index}>
                          {ingredient}
                        </ListGroup.Item>
                      );
                    } else {
                      return (
                        <ListGroup.Item key={index}>
                          {ingredient}
                        </ListGroup.Item>
                      );
                    }
                  })}
              </ListGroup>
            </Col>
            <Col xs={12} md={6}>
              <h4>Directions</h4>
              <ListGroup variant="flush">
                {recipe.directions &&
                  recipe.directions.map((direction, index) => {
                    return (
                      <ListGroup.Item key={index}>{direction}</ListGroup.Item>
                    );
                  })}
              </ListGroup>
            </Col>
          </Row>
          <Container handleModalClose={() => setShowModal(false)}></Container>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SearchRecipes;