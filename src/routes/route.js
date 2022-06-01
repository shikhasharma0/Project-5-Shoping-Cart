const express=require('express')
const router=express.Router()

/*importing module */
const userController=require('../controllers/userController')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const {userAuthentication}=require('../middleWare/authentication')

/**unprotected & protected order API's */
router.post('/register', userController.createUser)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile', userAuthentication,userController.getUserDetails)
router.put('/user/:userId/profile',userAuthentication, userController.updateUserDetails)

/**unprotected prote API's */
router.post('/products', productController.productCreation)
router.get('/products', productController.getAllProducts)
router.get('/products/:productId', productController.getProductsById)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteProduct)

/**protected cart API's */
router.post('/users/:userId/cart', userAuthentication ,cartController.addToCart)
router.put('/users/:userId/cart', userAuthentication, cartController.updateCart)
router.get('/users/:userId/cart', userAuthentication, cartController.getCart)
router.delete('/users/:userId/cart', userAuthentication, cartController.deleteCart)

/**protected order API's */
router.post('/users/:userId/orders', userAuthentication, orderController.createOrder)
router.put('/users/:userId/orders', userAuthentication, orderController.updateOrder)



module.exports=router