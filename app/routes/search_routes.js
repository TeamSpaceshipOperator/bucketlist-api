// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

const yelp = require('yelp-fusion')

const client = yelp.client(*APIKEY HERE*)
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// Yelp API search
router.get('/search', requireToken, (req, res) => {
  client.search({
    term: req.term,
    location: req.location
  })
    .then(search => res.status(200).json({ search: search }))
    .catch(error => {
      console.error(error)
    })
})

module.exports = router
