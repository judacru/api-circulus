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

app.use(cors())

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
