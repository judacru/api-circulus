require('dotenv').config()

const config = {
  DEV: process.env.NODE_ENV !== 'production',
  PORT: process.env.PORT || 3900,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_SERVER: process.env.DB_SERVER,
}

module.exports = config