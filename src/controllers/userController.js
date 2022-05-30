const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('../validator/validator')
const aws_s3 = require('../validator/aws-s3')



/*********************************************************Create User*************************************************/

const createUser = async function (req, res) {

    try{

    let files = req.files;

    let userDetails = req.body 
  
    if(!validator.isValidRequestBody(userDetails)) {
        return res.status(400).send({ status: false, message: "please provide valid user Details" })
    }

    if (!validator.isValid(userDetails.fname)) {
        return res.status(400).send({ status: false, message: "first name is required" })
    }

    if (!validator.isValid(userDetails.lname)) {
        return res.status(400).send({ status: false, message: "last name is required" })
    }

    if (!validator.isValid(userDetails.email)) {
        return res.status(400).send({ status: false, message: "Email-ID is required" })
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userDetails.email))
        return res.status(400).send({ status: false, message: "Invalid Email id." })

    const checkEmailFromDb = await userModel.findOne({ email :userDetails.email})

    if (checkEmailFromDb) {
        return res.status(400).send({ status: false, message: `emailId is Exists. Please try another email Id.` })
    }

    if (!files.length) {
        return res.status(400).send({ status: false, message: "Profile Image is required" })
    }

    if (!validator.isValid(userDetails.phone)) {
        return res.status(400).send({ status: false, message: "phone number is required" })
    }

    if (!(/^(\+\d{1,3}[- ]?)?\d{10}$/).test(userDetails.phone))
        return res.status(400).send({ status: false, message: "Phone number must be a valid Indian number." })

    const checkPhoneFromDb = await userModel.findOne({ phone:userDetails.phone })

    if (checkPhoneFromDb) {
        return res.status(400).send({ status: false, message: `${userDetails.phone} is already in use, Please try a new phone number.` })
    }

    if (!validator.isValid(userDetails.password)) {
        return res.status(400).send({ status: false, message: "password is required" })
    }

    if (userDetails.password.length < 8 || userDetails.password.length > 15) {
        return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
    }

    if (!validator.isValid(userDetails.address)) {
        return res.status(400).send({ status: false, message: "Address is required" })
    }

    let userAddress=JSON.parse(userDetails.address)
    userDetails.address=userAddress
    
    if (!validator.isValid(userAddress.shipping.street)) {
        return res.status(400).send({ status: false, message: "Please provide address shipping street" });
    }
    if (!validator.isValid(userAddress.shipping.city)) {
        return res.status(400).send({ status: false, message: "Please provide address shipping city" });
    }
    if (!validator.isValid(userAddress.shipping.pincode)) {
        return res.status(400).send({ status: false, message: "Please provide address shipping pincode" });
    }
    if (!validator.isValid(userAddress.billing.street)) {
        return res.status(400).send({ status: false, message: "Please provide address billing street" });
    }
    if (!validator.isValid(userAddress.billing.city)) {
        return res.status(400).send({ status: false, message: "Please provide address billing city" });
    }
    if (!validator.isValid(userAddress.billing.pincode)) {
        return res.status(400).send({ status: false, message: "Please provide address billing pincode" });
    }
   
    let userImage = await aws_s3 .uploadFile(files[0]);

    const hashedPassword = await bcrypt.hash(userDetails.password, 10)

    userDetails.profileImage = userImage
    userDetails.password = hashedPassword

    const saveUserInDb = await userModel.create(userDetails);

    return res.status(201).send({ status: true, message: "user created successfully!!", data: saveUserInDb });

    }catch(err){

        return res.status(500).send({status: false,error: err.message})

    }

}

/**********************************************************User LogIn************************************************/


const userLogin = async function (req, res) {

    try {

        const loginDetails = req.body;

        const { email, password } = loginDetails;

        if (!validator.isValidRequestBody(loginDetails)) {
            return res.status(400).send({ status: false, message: 'Please provide login details' })
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email-Id is required' })
        }


        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }

        const userData = await userModel.findOne({ email });

        if (!userData) {
            return res.status(401).send({ status: false, message: `Login failed! Email-Id is incorrect!` });
        }

        const checkPassword = await bcrypt.compare(password, userData.password)

        if (!checkPassword) return res.status(401).send({ status: false, message: `Login failed! password is incorrect.` });
        const token = jwt.sign({
            userId: userData._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
        }, 'BYRD87KJVUV%^%*CYTC')
        
        return res.status(200).send({ status: true, message: "LogIn Successful!!", data: token});

    } catch (err) {

        return res.status(500).send({ status: false, error: err.message });

    }
}


/****************************************************************Get User Data********************************************/

const getUserDetails = async function (req, res) {

    try {

        const userId = req.params.userId
        const userIdFromToken = req.userId


        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }

        const findUserDetails = await userModel.findById(userId)

        if (!findUserDetails) {
            return res.status(400).send({ status: false, message: "User Not Found!!" })
        }

        if (findUserDetails._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: "You Are Not Authorized!!" });
        }

        return res.status(200).send({ status: true, message: "Profile Fetched Successfully!!", data: findUserDetails })

    } catch (err) {

        return res.status(500).send({ status: false, error: err.message })

    }
}
/************************************************************Update User Details*********************************************/

const updateUserDetails = async function (req, res) {

    try {

        let files = req.files
        let userDetails = req.body
        let userId = req.params.userId
        let userIdFromToken = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" })
        }

        const findUserData = await userModel.findById(userId)

        if (!findUserData) {
            return res.status(400).send({ status: false, message: "user not found" })
        }
 
        if (findUserData._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: "You Are Not Authorized!!" })
        }
        
        let { fname, lname, email, phone, password, address, profileImage } =userDetails
        
        if (!validator.isValidRequestBody(userDetails)) {
            return res.status(400).send({ status: false, message: "Please provide user's details to update." })
        }

        if (!validator.validString(fname)) {
        return res.status(400).send({ status: false, message: 'first name is Required' })
        }

      
        if (!validator.validString(lname)) {
            return res.status(400).send({ status: false, message: 'last name is Required' })
        }
       
       
        if (!validator.validString(email)) {
            return res.status(400).send({ status: false, message: 'email is Required' })
        }
        if (email) {
            
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userDetails.email))
            return res.status(400).send({ status: false, message: "Invalid Email id." })
        
            const checkEmailFromDb = await userModel.findOne({ email :userDetails.email})
        
            if (checkEmailFromDb) 
            return res.status(400).send({ status: false, message: `emailId is Exists. Please try another email Id.` })
        }

    
        if (!validator.validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is Required' })
        }

        if (phone) {
            if (!(/^(\+\d{1,3}[- ]?)?\d{10}$/).test(userDetails.phone))
        return res.status(400).send({ status: false, message: "Phone number must be a valid Indian number." })

        const checkPhoneFromDb = await userModel.findOne({ phone:userDetails.phone })

        if (checkPhoneFromDb) {
        return res.status(400).send({ status: false, message: `${userDetails.phone} is already in use, Please try a new phone number.` })
    }
        }

        
        if (!validator.validString(password)) {
            return res.status(400).send({ status: false, message: 'password is Required' })
        }
        
        if (password) {
           
            if (!(password.length >= 8 && password.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }
            var hashedPassword = await bcrypt.hash(password, 10)
            userDetails.password=hashedPassword
        }

        if (!validator.validString(address)) {
            return res.status(400).send({ status: false, message: 'Address is Required' })
        }
        
        if (address) {
            
            let userAddress=JSON.parse(userDetails.address)
            userDetails.address=userAddress
    
        if(userAddress.shipping){
            
            if (!validator.isValid(userAddress.shipping.street)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping street" });
            
        }
            
            if (!validator.isValid(userAddress.shipping.city)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping city" });
           
        }
            
            if (!validator.isValid(userAddress.shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping pincode" });
            
        }
        }

        if(userAddress.billing){
            
            if (!validator.isValid(userAddress.billing.street)) {
                return res.status(400).send({ status: false, message: "Please provide address billing street" });
           
        }
            
            if (!validator.isValid(userAddress.billing.city)) {
                return res.status(400).send({ status: false, message: "Please provide address billing city" });
        }
            
            if (!validator.isValid(userAddress.billing.pincode)) {
                return res.status(400).send({ status: false, message: "Please provide address billing pincode" });
            }
       
        }}
       
       if(profileImage){
        
                if (!files.length) {
                return res.status(400).send({ status: false, message: "please provide profile image" })
                }
                let userImage = await aws_s3.uploadFile(files[0])
                userDetails.profileImage=userImage
            
        }


        let updateProfileDetails = await userModel.findOneAndUpdate(
            { _id: userId },
             userDetails, 
             { new: true })

        return res.status(200).send({ status: true, msg:"User Update Successful!!",data: updateProfileDetails })
   



    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createUser, userLogin, getUserDetails, updateUserDetails }


