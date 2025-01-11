const config = require('../config')

function withErrorStack(error, stack) {
  if (config.dev) {
    return { ...error, stack }
  }
  return { error }
}

function logErrors(error, req, res, next) {
  console.error(error)
  next(error)
}

function wrapErrors(error, req, res, next) {
  const batImplementationError = {
    stack: error.stack,
    output: {
      statusCode: 500,
      payload: {
        error: 'Internal Server Error',
        message: error.message,
      },
    },
  }

  next(batImplementationError)
}

function errorHandler(error, req, res, next) {
  const { stack, output } = error
  res.status(output.statusCode)
  res.json(withErrorStack(output.payload, stack))
}

module.exports = {
  logErrors,
  wrapErrors,
  errorHandler,
}
