const express = require('express');
const bodyParser = require('body-parser');
const Joi = require('@hapi/joi');

const PunkApiProvider = require('./providers/punkApi');
const DatabaseProvider = require('./providers/noSql');
const CacheProvider = require('./providers/memoryCache');

const app = express();

app.use(express.static('dist'));
app.use(bodyParser.json({ type: 'application/json' }));

const CACHE_NAMESPACE = 'beerapp_';


// @NOTE x-user Header should be present for all requests
const xUserSchema = Joi.string().email().required();
app.use((req, res, next) => {
  const xUser = req.headers['x-user'];
  const xUserValidation = xUserSchema.validate(xUser);
  // @NOTE Fail fast.
  if (xUserValidation.error !== undefined) {
    // @NOTE We probably want a 401 Unauthorized?
    return res.status(401).send({
      timestamp: new Date().getTime(),
      message: 'NOk',
      error: xUserValidation.error.details
    });
  }

  req.xUser = xUser;

  // @TODO Add proper exception handling for this
  DatabaseProvider.persistToAuditLog(xUser, req.originalUrl);

  return next();
});

// @NOTE Get all beers by name
// @TODO We might want to implement pagination here.
app.get('/api/beers/:beerName', (req, res) => {
  // @TODO We should probably validate this input
  const { beerName } = req.params;
  const cacheKey = `${CACHE_NAMESPACE}beer_${beerName}`;
  const cachedResults = CacheProvider.get(cacheKey);
  if (!cachedResults) {
    console.debug(`No cached results for key ${cacheKey}`);
    PunkApiProvider.findBeersByName(beerName)
      .then((response) => {
        // @NOTE We only want to return a small subset of information for each beer
        const normalizedBeers = response.map(beerStruct => ({
          id: beerStruct.id,
          name: beerStruct.name,
          description: beerStruct.description,
          first_brewed: beerStruct.first_brewed,
          food_pairings: beerStruct.food_pairing,
        }));

        CacheProvider.set(cacheKey, normalizedBeers);

        res.send({
          timestamp: new Date().getTime(),
          message: 'Ok',
          data: normalizedBeers
        });

        // @TODO Implement exception using a standardized JSON representation of an error
      })
      .catch((findBeersByNameException) => {
        console.error(findBeersByNameException);
        res.send({
          timestamp: new Date().getTime(),
          message: 'Ok',
          data: []
        });
      });
  } else {
    // @NOTE We should probably add Cache-Control headers, cache expiry, etag, etc.
    console.debug(`${cachedResults.length} cached results found for key ${cacheKey}`);
    res.send({
      timestamp: new Date().getTime(),
      message: 'Ok',
      data: cachedResults
    });
  }
});

// @NOTE Attach rating and comment to a beer
const beerIdSchema = Joi.number().integer().min(1).required();
const ratingSchema = Joi.number().integer().min(1).max(5)
  .required();

app.post('/api/beers/rate/:id', (req, res) => {
  const { id } = req.params;

  // @NOTE Validate rating is an integer between 1 and 5
  const beerIdValidation = beerIdSchema.validate(id);
  // @NOTE Fail fast.
  if (beerIdValidation.error !== undefined) {
    res.status(400);
    return res.send({
      timestamp: new Date().getTime(),
      message: 'NOk',
      error: beerIdValidation.error.details
    });
  }

  const { rating, comments } = req.body;

  // @TODO We should probably validate that comments is a valid array

  // @NOTE Validate rating is an integer between 1 and 5
  const ratingValueValidation = ratingSchema.validate(rating);
  // @NOTE Fail fast.
  if (ratingValueValidation.error !== undefined) {
    res.status(400);
    return res.send({
      timestamp: new Date().getTime(),
      message: 'NOk',
      error: ratingValueValidation.error.details
    });
  }

  // @TODO Better exception handling
  try {
    DatabaseProvider.persistBeerRating(id, rating, comments || [], req.xUser);

    // @NOTE Status 201 Created
    res.status(201);
    res.send({
      timestamp: new Date().getTime(),
      message: 'Ok',
      data: {}
    });
  } catch (databaseProviderException) {
    res.status(500);
    res.send({
      timestamp: new Date().getTime(),
      message: 'NOk',
      error: databaseProviderException.toString()
    });
  }
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
