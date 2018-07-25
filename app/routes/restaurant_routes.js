const express = require('express')
const passport = require('passport')

const Restaurant = require('../models/restaurant')

const handle = require('../../lib/error_handler')
const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership

const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

// index action -- GET /restaurants
router.get('/restaurants', requireToken, (req, res) => {
  Restaurant.find({ owner: req.user.id })
    .then((restaurants) => {
      return restaurants.map((restaurant) => {
        return restaurant.toObject()
      })
    })
    .then(restaurants => res.status(200).json({restaurants: restaurants}))
    .catch(err => handle(err, res))
})

// show action -- GET /restaurants/:id
router.get('/restaurants/:id', requireToken, (req, res) => {
  Restaurant.findById(req.params.id)
    .then(handle404)
    // requireOwnership gets the req object as its first argument and the
    // document we want to check as second argument.
    // .then(restaurant => requireOwnership(req, restaurant))
    .then((restaurant) => res.status(200).json({restaurant: restaurant.toObject()}))
    .catch(err => handle(err, res))
})

// destroy action -- DELETE /restaurants/:id
router.delete('/restaurants/:id', requireToken, (req, res) => {
// first we find the document (req.params.id will be the dynamic segment of
// the url, e.g. the part that comes after '/restaurants')
  Restaurant.findById(req.params.id)
  // send back  useful message (and 404) if restaurant isn't found
    .then(handle404)
    .then(restaurant => {
      requireOwnership(req, restaurant)
      restaurant.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(err => handle(err, res))
})

// update action -- PATCH /restaurants
router.patch('/restaurants/:id', requireToken, (req, res) => {
  // prevents users from gifting docs to other users
  delete req.body.restaurant.owner

  Restaurant.findById(req.params.id)
    .then(handle404)
    .then(restaurant => {
      requireOwnership(req, restaurant)
      // Removes any empty fields so no empty fields exist in object/overwrite
      // object data
      Object.keys(req.body.restaurant).forEach(key => {
        if (req.body.restaurant[key] === '') {
          delete req.body.restaurant[key]
        }
      })
      // update doc in db
      return restaurant.update(req.body.restaurant)
    })
    .then(() => res.sendStatus(204))
    .catch(err => handle(err, res))
})

// create action -- POST /restaurants
// Always require token so owner can be assigned
router.post('/restaurants', requireToken, (req, res) => {
  // Adds user ID as owner for new object
  req.body.restaurant.owner = req.user.id
  // req.body.restaurant is what is saved to DB, with added owner. Saved with
  //  restaurant.create
  Restaurant.create(req.body.restaurant)
  // send newly created object back to uder with status 201
    .then(restaurant => {
      res.status(201).json({ restaurant: restaurant.toObject() })
    })
    // handle any errors
    .catch(err => handle(err, res))
})

module.exports = router
