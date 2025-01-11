const jwt = require('jwt-simple')
const moment = require('moment')

const libjwt = require('../app/services/jwt')
const secret = libjwt.secret

exports.auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: 'error',
      message: 'La petición no tiene la cabecera de autenticación',
    })
  }

  let token = req.headers.authorization.replace(/['"]+/g, '')

  try {
    let payload = jwt.decode(token, secret)

    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: 'error',
        message: 'Token expirado',
        error,
      })
    }

    req.user = payload
  } catch (error) {
    return res.status(404).send({
      status: 'error',
      message: 'Token invalido',
      error,
    })
  }

  next()
}
