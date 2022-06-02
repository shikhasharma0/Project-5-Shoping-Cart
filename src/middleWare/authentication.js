const jwt = require('jsonwebtoken')


const userAuthentication = async function(req, res, next){

    try {

        const token = req.headers.authorization

        if (!token) {
        return res.status(400).send({ status: false, message: `Token Not Found` })}
            
        let splitToken = token.split(' ')

        let decodeToken = jwt.verify(splitToken[1], 'BYRD87KJVUV%^%*CYTC')
    
        if (!decodeToken) {

        return res.status(403).send({ status: false, message: `Invalid Token` })}

        req.userId = decodeToken.userId

        next()


    } catch (err) {

        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = {userAuthentication}