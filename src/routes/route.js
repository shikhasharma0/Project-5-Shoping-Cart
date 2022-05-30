const express=require('express')
const router=express.Router()

const userController=require('../controllers/userController')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const {userAuthentication}=require('../middleWare/authentication')


router.post('/register', userController.createUser)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile',userAuthentication,userController.getUserDetails)
router.put('/user/:userId/profile',  userController.updateUserDetails)

router.post('/products', productController.productCreation)
router.get('/products', productController.getAllProducts)
router.get('/products/:productId', productController.getProductsById)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteProduct)

router.post('/users/:userId/cart', cartController.addToCart)
router.put('/users/:userId/cart', cartController.updateCart)
router.get('/users/:userId/cart', cartController.getCart)
router.delete('/users/:userId/cart', cartController.deleteCart)

router.post('/users/:userId/orders', orderController.createOrder)
router.put('/users/:userId/orders', orderController.updateOrder)



module.exports=router