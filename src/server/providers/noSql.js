const NoSQL = require('nosql');

const db = NoSQL.load('../storage/db.nosql');


module.exports = ({

  persistBeerRating: (beerId, rating, comments, xUser) => {
    // @NOTE Persist ratings as non-unique meta data for now
    // @NOTE db.insert returns DatabaseBuilder2 { '$callback': [Function: NOOP] }
    db.insert({
      beerId,
      rating,
      comments,
      xUser,
      created: new Date().getTime(),
    }, false);
  },

  // @TODO Define what we want to store in the audit log
  persistToAuditLog: (xUser, location) => {
    // @NOTE Persist audit logs as non-unique meta data for now
    // @NOTE db.insert returns DatabaseBuilder2 { '$callback': [Function: NOOP] }
    db.insert({
      xUser,
      location,
      created: new Date().getTime(),
    }, false);
  },

});
