const { header } = require('express/lib/response')
const jwt = require('jsonwebtoken')


const userAuthentication = async function(req, res, next){

    try {

        const token = req.header('Authorization')
console.log(req.header)
        if (!token) {
        return res.status(403).send({ status: false, message: `Token Not Found` })}
            
        let splitToken = token.split(' ')
console.log(splitToken)
        let decodeToken = jwt.decode(splitToken[1], 'BYRD87KJVUV%^%*CYTC')
console.log(decodeToken)
        if (Date.now() > (decodeToken.exp) * 1000) {
        return res.status(403).send({ status: false, message: `Session Expired, please login again` })}

        let verify = jwt.verify(splitToken[1], 'BYRD87KJVUV%^%*CYTC')
        
        if (!verify) {
        return res.status(403).send({ status: false, message: `Invalid Token` })}

        req.userId = decodeToken.userId
        next()



    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = {userAuthentication}