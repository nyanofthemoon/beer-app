const rp = require('request-promise');

const PUNK_API_ENDPOINT = 'https://api.punkapi.com';
const PUNK_API_VERSION = 'v2';
const PUNK_API_BEER_RESOURCE = 'beers';
const PUNK_API_BEER_ENDPOINT = `${PUNK_API_ENDPOINT}/${PUNK_API_VERSION}/${PUNK_API_BEER_RESOURCE}`;

// @NOTE This provider returns promises

module.exports = ({

  findBeersByName: beerName => rp({
    method: 'GET',
    uri: PUNK_API_BEER_ENDPOINT,
    qs: {
      beer_name: beerName
    },
    json: true,
    headers: {}
  })

});
