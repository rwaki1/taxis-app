const sequelize = require('../db/sequelize');
const User = require('./User');
const Ride = require('./Ride');

const db = { sequelize, User, Ride };

// Simple helper to authenticate and sync models in dev
db.initialize = async (opts = { force: false }) => {
  await sequelize.authenticate();
  await sequelize.sync(opts);
};

module.exports = db;
