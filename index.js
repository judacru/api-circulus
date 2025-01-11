const config = require('./config/index')
const cors = require('cors')
const express = require('express')
const { logErrors, wrapErrors, errorHandler } = require('./middlewares/error')

const UserRoutes = require('./routes/user')
const PublicationRoutes = require('./routes/publication')
const FollowRoutes = require('./routes/follow')

console.log('API Node para Circulus')

const app = express()
const port = config.PORT
const allowedOrigins = config.CORS_ORIGIN

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      } else {
        return callback(new Error('No autorizado por CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/user', UserRoutes)
app.use('/api/publication', PublicationRoutes)
app.use('/api/follow', FollowRoutes)

app.use(logErrors)
app.use(wrapErrors)
app.use(errorHandler)

app.listen(port, () => {
  console.log('🌎 Servidor corriendo en el puerto: ', port)
})
