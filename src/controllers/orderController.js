const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const validator = require("../validator/validator");

const createOrder = async function (req, res) {
    let userId = req.params.userId
    let tokenUserId=req.userId
    let data=req.body


    if (!validator.isValidObjectId(userId)) {
        return res.status(400).send({ status: 'false', msg: "invalid userId" })
    }

    let checkUser = await userModel.findById(userId)
    if (!checkUser) {
        return res.status(400).send({ status: 'false', msg: "user not found" })
    }

    //  if (checkUser._id.toString() != tokenUserId) {
    //     res.status(401).send({ status: false, message: "You Are Not Authorized" });
    //     return
    // }

    if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Add Item In Cart" })
        }
 
        let{cartId,cancellable, status}=data

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: 'false', msg: "invalid cartId" })
        }
    
        let checkCart = await userModel.findOne({userId:userId,_id:cartId})
        if (!checkCart) {
            return res.status(400).send({ status: 'false', msg: "cart not found" })
        }


}

module.exports = { createOrder }