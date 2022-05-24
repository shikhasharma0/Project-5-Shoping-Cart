const express=require('express')
const router=express.Router()

const userController=require('../controllers/userController')

router.get('/test',function(req,res){
    res.send('working')
})

router.post('/register', userController.createUser)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile',  userController.getUserDetails)
router.put('/user/:userId/profile',  userController.updateUserDetails)



module.exports=router