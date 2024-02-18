const jwt = require("jwt-simple");
const moment = require("moment");

//Clave secreta

const secret = "CLAVE_SECRETA_del_proyecto_DE_CIRcuLUS_311220";

const createToken = (user) => {
    const payload = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix() 
    };

    return jwt.encode(payload, secret);
}

module.exports = {
    secret,
    createToken
}

