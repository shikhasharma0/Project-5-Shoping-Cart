const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const validator = require("../validator/validator");



/**************************************************************Create Order*********************************************/


const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let tokenUserId = req.userId
        let data = req.body


        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: 'false', msg: "invalid userId" })
        }

        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: 'false', msg: "user not found" })
        }

        if (checkUser._id.toString() != tokenUserId) {
            res.status(401).send({ status: false, message: "You Are Not Authorized" });
            return
        }

        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Add input to complete the order" })
        }

        let { cartId, cancellable, status } = data

        if (!validator.isValid(cartId)) {
            return res.status(400).send({ status: 'false', msg: "please enter the cartId" })
        }

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: 'false', msg: "invalid cartId" })
        }

        let checkCart = await cartModel.findOne({ userId: userId, _id: cartId })
        if (!checkCart) {
            return res.status(404).send({ status: 'false', msg: "cart not found" })
        }

        if (!validator.validString(cancellable)) {
            return res.status(400).send({ status: false, message: `please enter true or false` });
        }

        if (cancellable) {

            if (typeof cancellable != "boolean") {
                return res.status(400).send({ status: false, message: `Cancellable must be either 'true' or 'false'.` });
            }
        }

        if (!validator.validString(status)) {
            return res.status(400).send({ status: false, message: `please enter the status of the order` });
        }

        if (status) {
            if (!(['pending', 'completed', 'cancelled'].includes(status))) {
                return res.status(400).send({ status: false, message: `Status must be among ['pending','completed','cancelled'].`, });
            }
        }

        let quantity = checkCart.items.map((item) => item.quantity).reduce((a, b) => a + b, 0)  /*total quantity*/

        if (quantity == 0) {
            return res.status(400).send({ status: false, message: "The cart is Empty" });
        }
        let orderData = {
            userId: userId,
            items: checkCart.items,
            totalPrice: checkCart.totalPrice,
            totalItems: checkCart.totalItems,
            totalQuantity: quantity,
            cancellable: cancellable,
            status: status
        }

        const orderDetails = await orderModel.create(orderData)

        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, /*cart will be empty after the order is done */
            { $set: { items: [], totalPrice: 0, totalItems: 0, } });

        return res.status(201).send({ status: true, msg: "Order Created Successfully", data: orderDetails })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}


/******************************************************************Update Order****************************************/

const updateOrder = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updateData = req.body;
        const tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: 'false', msg: "invalid userId" })
        }

        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: 'false', msg: "user not found" })
        }

        if (checkUser._id.toString() != tokenUserId) {
            res.status(401).send({ status: false, message: "You Are Not Authorized" });
            return
        }

        const { orderId, status } = updateData;

        if (!validator.isValidRequestBody(updateData)) {
            return res.status(400).send({ status: false, message: "please provide data to Update" })
        }

        if (!validator.isValid(orderId)) {
            return res.status(400).send({ status: false, message: `please enter orderId` });
        }

        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: 'false', msg: "invalid orderId" })
        }

        let checkOrder = await orderModel.findOne({ _id: orderId, userId: userId })
        if (!checkOrder) {
            return res.status(404).send({ status: 'false', msg: "order not found" })
        }

        if (!validator.isValid(status)) {
            return res.status(400).send({ status: false, message: `please enter updated status of order` });
        }

        if (status) {
            if (!(['pending', 'completed', 'cancelled'].includes(status))) {
                return res.status(400).send({ status: false, message: `Status must be among ['pending','completed','cancelled'].`, });
            }
        }

        if (checkOrder.cancellable == true) {

            if (checkOrder.status == status) {
                return res.status(200).send({ status: false, message: `Order status is alreday ${status}` })
            }

            if (checkOrder.status == "completed") {
                return res.status(200).send({ status: false, message: `Order alreday Completed Successfully.` })
            }
            if (checkOrder.status == "pending") {
                const updateorderStatus = await orderModel.findOneAndUpdate(
                    { _id: checkOrder._id },
                    { $set: { status: status } },
                    { new: true })
                return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updateorderStatus })
            }
            if (checkOrder.status == "cancelled") {
                return res.status(200).send({ status: false, message: `Order is already Cancelled.` })
            }
        }
        return res.status(400).send({ status: false, message: `Cannot cancel the order due to Non-cancellable policy.` })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }

}


module.exports = { createOrder, updateOrder }