const express=require('express')
const router=express.Router()

const userController=require('../controllers/userController')
const productController=require('../controllers/productController')
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


module.exports=router