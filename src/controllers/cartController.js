const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const validator = require('../validator/validator')


/**********************************************************************************Add To Cart**************************************************************/

const addToCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId
        const data = req.body
        let { items, cartId } = data


        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Add Item In Cart" })
        }

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ msg: "The UserId is Not valid" })
        }
        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            res.status(404).send({ msg: "User Not Found" })
        }


        //  if (checkUser._id.toString() != tokenUserId) {
        //     res.status(401).send({ status: false, message: "You Are Not Authorized" });
        //     return
        // }

        /*-----------------------if cartId-------------------------*/

        if (cartId) {
            if (!validator.isValidObjectId(cartId)) {
                res.status(400).send({ msg: "The CartId is Not valid" })
            }
            let checkCart = await cartModel.findById(cartId)
            if (!checkCart) {
                res.status(404).send({ msg: "Cart Not Found" })
            }

            let cart = [] /*price of each element goes here*/
            let product = [] /*productid goes here*/

            // checkCart.items.forEach(element => {
            //     if(element.productId.toString()==items.productId){
            //     let checkProduct = await productModel.findOne({ _id: checkCart.items.productId, isDeleted: false }) 
            //         cart.push(checkProduct.productPrice*checkCart.items.quantity)
            //     }

            // });

            for (let item of items) {
                if (!validator.isValidObjectId(item.productId)) {
                    return res.status(400).send({ msg: "The productId is Not valid" })
                }
                let checkProduct = await productModel.findOne({ _id: item.productId, isDeleted: false }) 
                if (!checkProduct) continue /*if invalid productId,isDeleted true then it will be ignored */
                let productPrice = checkProduct.price * item.quantity
                if(productPrice==0)continue /*if quantity 0 then it will be ignored */
                product.push(item)
                cart.push(productPrice)
                let totalProductPrice = cart.reduce((a, b) => a + b, 0)

                let productAddToCart = await cartModel.updateOne(
                    {_id:cartId},
                    {$set:{items:product,totalItems:product.length,totalPrice:totalProductPrice}},
                    {new:true})
                return res.status(201).send({ status: true, msg: "Product Added To Cart Successful", data: productAddToCart })
            }

        }

        /*--------------------if no cartId-------------------*/

        let cart = [] /*price of each element goes here*/
        let product = [] /*productid goes here*/


        for (let item of items) {
            if (!validator.isValidObjectId(item.productId)) {
                return res.status(400).send({ msg: "The productId is Not valid" })
            }
            let checkProduct = await productModel.findOne({ _id: item.productId, isDeleted: false })
            if (!checkProduct) continue /*if invalid productId,isDeleted true then it will be ignored */
            let productPrice = checkProduct.price * item.quantity
            if(productPrice==0)continue /*if quantity 0 then it will be ignored */
            product.push(item)
            cart.push(productPrice)
        }


        let totalProductPrice = cart.reduce((a, b) => a + b, 0)
        let saveCartDetails = {
            userId: userId, items: product, totalPrice: totalProductPrice, totalItems: cart.length
        }

        let productAddToCart = await cartModel.create(saveCartDetails)
        return res.status(201).send({ status: true, msg: "Product Added To Cart Successful", data: productAddToCart })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}


/******************************************************************************Update Cart*********************************************************/

const updateCart = async function (req, res) {

    let userId = req.params.userId
    let updateData = req.body
    const tokenUserId = req.userId

   
    if (!validator.isValidObjectId(userId)) {
        res.status(400).send({ status: false, msg: "The UserId is Not valid" })
    }
    let checkUser = await userModel.findById(userId)
    if (!checkUser) {
        res.status(404).send({ status: false, msg: "User Not Found" })
    }

    //  if (checkUser._id.toString() != tokenUserId) {
    //     res.status(401).send({ status: false, message: "You Are Not Authorized" });
    //     return
    // }

    let { cartId, productId, removeProduct } = updateData

    if (!validator.isValidRequestBody(updateData)) {
        return res.status(400).send({ status: false, message: "Please Add Item to Update Cart" })
    }

    if (!validator.isValidObjectId(cartId)) {
        res.status(400).send({ status: false, msg: "cartId is Not valid" })
    }
    let checkCart = await cartModel.findById(cartId)
    if (!checkCart) {
        res.status(404).send({ status: false, msg: "cart Not Found" })
    }

    if (!validator.isValidObjectId(productId)) {
        res.status(400).send({ status: false, msg: "productId is Not valid" })
    }

    let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!checkProduct) {
        res.status(404).send({ status: false, msg: "product Not Found" })
    }

    if (isNaN(Number(removeProduct))) {
        return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` })
    }

    if (!((removeProduct === 0) || (removeProduct === 1))) {
        return res.status(400).send({ status: false, message: 'removeProduct should be 0 or 1' })
    }

    let checkQuantity = checkCart.items.find( (item)=> (item.productId.toString() == productId))

    if (removeProduct === 0) {
        let totalAmount = checkCart.totalPrice - (checkProduct.price * checkQuantity.quantity)
        let updatedCart = await cartModel.findOneAndUpdate(
            { _id: cartId },
            { $pull: { items: { productId: productId } }, $set: { totalPrice: totalAmount }, $inc: { totalItems: -1 } },
            { new: true })
        return res.status(200).send({ status: true, msg: "successfully item removed from cart", data: updatedCart })
    }

    if (removeProduct === 1) {
        if (checkCart.totalPrice != 0) {
            if (checkQuantity.quantity > 1) {
                let totalAmount = checkCart.totalPrice - (checkProduct.price * 1)
                let updatedCart = await cartModel.findOneAndUpdate(
                    { _id: cartId },
                    { $set: { totalPrice: totalAmount }, $inc: { quantity: -1 } },
                    { new: true })
                return res.status(200).send({ status: true, msg: "Quantity reduce By 1 Successfully", data: updatedCart })
            }

            if (checkQuantity.quantity == 1) {
                let totalAmount = checkCart.totalPrice - (checkProduct.price * 1)
                let updatedCart = await cartModel.findOneAndUpdate(
                    { _id: cartId },
                    { $pull: { items: { productId: productId } }, $set: { totalPrice: totalAmount }, $inc: { totalItems: -1 } },
                    { new: true })
                return res.status(200).send({ status: true, msg: "successfully item removed from cart", data: updatedCart })
            }
        }
        return res.status(200).send({ status: false, msg: "item removed from the cart successful!!" })
    }

}


/****************************************************************************Get Cart*************************************************************/

const getCart = async function (req, res) {
    const userId = req.params.userId;
    let tokenUserId = req.userId


    if (!validator.isValidObjectId(userId)) {
        res.status(400).send({ status: false, msg: "The UserId is Not valid" })
    }
    let checkUser = await userModel.findById(userId)
    if (!checkUser) {
        res.status(404).send({ status: false, msg: "User Not Found" })
    }

    //  if (checkUser._id.toString() != tokenUserId) {
    //     res.status(401).send({ status: false, message: "You Are Not Authorized" });
    //     return
    // }

    const checkCart = await cartModel.findOne({ userId: userId })

    if (!checkCart) {
        return res.status(400).send({ status: false, message: "cart not found" })
    }

    return res.status(200).send({ status: true, message: "Successfully fetched cart.", data: checkCart })
}


/*****************************************************************Delete Cart******************************************/

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        let userIdFromToken = req.userId


        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }
        const checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(400).send({ status: false, message: "user not found" })
        }

        // if (findUser._id.toString() != userIdFromToken) {
        //     return res.status(401).send({ status: false, message: `You are Not Authorized` });    
        // }

        const findCart = await cartModel.findOne({ userId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "cart not found" })
        }

        const deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalPrice: 0, totalItems: 0 } })

        return res.status(204).send({ status: true, message: "Cart deleted successfully" })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}



module.exports = { addToCart, updateCart, getCart, deleteCart }