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
        let { cartId, productId, quantity } = data


        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ msg: "The UserId is Not valid" })
        }

        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ msg: "User Not Found" })
        }

        if (checkUser._id.toString() != tokenUserId) {
            res.status(403).send({ status: false, message: "You Are Not Authorized" });
            return
        }

        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Add Item In Cart" })
        }

        if (!validator.isValid(productId)) {
            return res.status(400).send({ msg: "Enter the productId" })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ msg: "The productId is Not valid" })
        }

        if (quantity) {
            if (!validator.validString(quantity)) {
                return res.status(400).send({ msg: "Enter the quantity" })
            }

            if (!quantity > 0) {
                return res.status(400).send({ msg: "Quantity can't be 0 or -ve" })
            }
        }
        if (!data?.quantity) quantity = 1

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, message: `Product doesn't exist` })
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId })

        if (!findCartOfUser) { /*cart creating for new user */

            const cartData = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: quantity,
                }],
                totalPrice: findProduct.price * quantity,
                totalItems: 1
            }

            const createCart = await cartModel.create(cartData)
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart })
        }


        if (cartId) {  /*if the cart id is given */
            if (!validator.validString(cartId)) {
                return res.status(400).send({ msg: "Enter the cartId" })
            }
            let checkCart = await cartModel.findById(cartId)
            if (!checkCart) {
                return res.status(404).send({ msg: "cart Not Found" })
            }
            if (cartId != findCartOfUser._id.toString()) {
                return res.status(200).send({ status: true, message: `This Cart not belong to the userID ${userId}` })
            }
        }

        if (findCartOfUser) { /*if cart is exist */

            let price = findCartOfUser.totalPrice + (quantity * findProduct.price)
            let cartItems = findCartOfUser.items

            for (let item of cartItems) {

                if (item.productId.toString() === productId) {
                    item.quantity += quantity

                    let updatedCart = { items: cartItems, totalPrice: price, totalItems: cartItems.length }

                    let saveCartDetails = await cartModel.findOneAndUpdate(
                        { _id: findCartOfUser._id },
                        updatedCart,
                        { new: true })

                    return res.status(201).send({ status: true, message: `Product added successfully`, data: saveCartDetails })
                }
            }
            cartItems.push({ productId: productId, quantity: quantity }) //storing the updated prices and quantity to the newly created array.

            let updatedCart = { items: cartItems, totalPrice: price, totalItems: cartItems.length }
            let saveCartDetails = await cartModel.findOneAndUpdate(
                { _id: findCartOfUser._id },
                updatedCart,
                { new: true })

            return res.status(201).send({ status: true, message: `Product added successfully`, data: saveCartDetails })
        }
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }

}



/******************************************************************************Update Cart*********************************************************/

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let updateData = req.body
        const tokenUserId = req.userId


        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "The UserId is Not valid" })
        }
        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: false, msg: "User Not Found" })
        }

        if (checkUser._id.toString() != tokenUserId) {
            res.status(403).send({ status: false, message: "You Are Not Authorized" });
            return
        }

        let { cartId, productId, removeProduct } = updateData

        if (!validator.isValidRequestBody(updateData)) {
            return res.status(400).send({ status: false, message: "Please Add Item to Update Cart" })
        }

        if (!validator.validString(cartId)) {
            return res.status(400).send({ msg: "Enter the cartId" })
        }

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is Not valid" })
        }
        let checkCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!checkCart) {
            return res.status(404).send({ status: false, msg: "cart Not Found" })
        }

        if (!validator.validString(productId)) {
            return res.status(400).send({ msg: "Enter the productId" })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is Not valid" })
        }

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) {
            return res.status(404).send({ status: false, msg: "product Not Found" })
        }

        if (!validator.validString(removeProduct)) {
            return res.status(400).send({ msg: "Enter the 0 or 1" })
        }

        if (isNaN(Number(removeProduct))) {
            return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` })
        }

        if (!((removeProduct === 0) || (removeProduct === 1))) {
            return res.status(400).send({ status: false, message: 'removeProduct should be 0 or 1' })
        }

        let checkQuantity = checkCart.items.find((item) => (item.productId.toString() === productId))

        if (!checkQuantity) return res.status(400).send({ status: false, message: `The product is already remove with ${productId} this productId` })

        if (removeProduct === 0) {
            let totalAmount = checkCart.totalPrice - (checkProduct.price * checkQuantity.quantity)
            let updatedCart = await cartModel.findOneAndUpdate(
                { _id: cartId },
                { $pull: { items: { productId: productId } }, $set: { totalPrice: totalAmount }, $inc: { totalItems: -1 } },
                { new: true })
            return res.status(200).send({ status: true, msg: "successfully item removed from cart", data: updatedCart })
        }

        if (removeProduct === 1) {
            let totalAmount = checkCart.totalPrice - checkProduct.price
            let itemsArr = checkCart.items

            for (let item of itemsArr) {
                if (item.productId.toString() == productId) {
                    item.quantity = item.quantity - 1
                    if (checkQuantity.quantity > 0) {
                        let updatedCart = await cartModel.findOneAndUpdate(
                            { _id: cartId },
                            { $set: { totalPrice: totalAmount, items: itemsArr } },
                            { new: true })
                        return res.status(200).send({ status: true, msg: "Quantity reduce By 1 Successfully", data: updatedCart })
                    }
                }
            }
            let updatedCart = await cartModel.findOneAndUpdate(
                { _id: cartId },
                { $pull: { items: { productId: productId } }, $set: { totalPrice: totalAmount }, $inc: { totalItems: -1 } },
                { new: true })
            return res.status(200).send({ status: true, msg: "successfully item removed from cart", data: updatedCart })
        }
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}



/****************************************************************************Get Cart*************************************************************/

const getCart = async function (req, res) {

    try {

        const userId = req.params.userId;
        let tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "The UserId is Not valid" })
        }
        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            res.status(404).send({ status: false, msg: "User Not Found" })
        }

        if (checkUser._id.toString() != tokenUserId) {
            res.status(403).send({ status: false, message: "You Are Not Authorized" });
            return
        }

        const checkCart = await cartModel.findOne({ userId: userId })

        if (!checkCart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }

        return res.status(200).send({ status: true, message: "Successfully fetched cart.", data: checkCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
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
            return res.status(404).send({ status: false, message: "user not found" })
        }

        if (checkUser._id.toString() != userIdFromToken) {
            return res.status(403).send({ status: false, message: `You are Not Authorized` });
        }

        const findCart = await cartModel.findOne({ userId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "cart not found" })
        }

        const deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalPrice: 0, totalItems: 0 } })

        return res.status(204).send({ status: true, message: "Cart deleted successfully" })


    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}




module.exports = { addToCart, updateCart, getCart, deleteCart }