const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const validator = require('../validator/validator')


const addToCart=async function(req,res){
const userId=req.params.userId
const tokenUserId=req.userId
const data=req.body
let {items}=data


if(!validator.isValidObjectId(userId)){
    res.status(400).send({msg:"The UserId is Not valid"})
}
 let checkUser=await userModel.findById(userId)
 if(!checkUser){
    res.status(404).send({msg:"User Not Found"})
 }


 if (checkUser._id.toString() != tokenUserId) {
    res.status(401).send({ status: false, message: "You Are Not Authorized" });
    return
}

let item=JSON.parse(items)

if(!validator.isValidObjectId(item.productId)){
    res.status(400).send({msg:"The productId is Not valid"})
}
let checkProduct=await userModel.findById(item.productId)
 if(!checkProduct){
    res.status(404).send({msg:"Product Not Found"})
 }

let cart=[]
let saveCartDetails={
    userId:userId,items:cart,totalPrice:,totalItems:}

let productAddToCart=await cartModel.create(saveCartDetails)
return res.status(201).send({status:true,msg:"Product Added To Cart Successful",data:productAddToCart})
}


module.exports={addToCart}