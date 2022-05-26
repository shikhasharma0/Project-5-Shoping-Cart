const productModel = require('../models/productModel')
const aws_s3 = require('../validator/aws-s3')
const validator = require('../validator/validator')
const currencySymbol = require("currency-symbol-map")



/***********************************************************Create Product********************************************/

const productCreation = async function (req, res) {
    try {
    let files = req.files;
    let productDetails = req.body;

    if (!validator.isValidRequestBody(productDetails)) {
        return res.status(400).send({ status: false, message: "Please provide valid product details" })
    }

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage,
        style, availableSizes, installments } = productDetails

    if (!validator.isValid(title)) {
        return res.status(400).send({ status: false, message: "Title is required" })
    }

    const checkTitle = await productModel.findOne({ title })
    if (checkTitle) {
        return res.status(400).send({ status: false, message: `title is alraedy in use. Please use another` })
    }

    if (!validator.isValid(description)) {
        return res.status(400).send({ status: false, message: "Description is required" })
    }

    if (!validator.isValid(price)) {
        return res.status(400).send({ status: false, message: "Price is required" })
    }

    if (isNaN(Number(price))) {
        return res.status(400).send({ status: false, message: "Price Is a Valid Number" })
    }
    if (!validator.isValid(currencyId)) {
        return res.status(400).send({ status: false, message: "currencyId is required" })
    }

    if (currencyId != "INR") {
        return res.status(400).send({ status: false, message: "currencyId should be INR" })
    }

    if (!validator.isValid(currencyFormat)) {
        return res.status(400).send({ status: false, message: "currencyId is required" })
    }

    if (currencyFormat != "₹") {
        return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" })
    }
    productDetails.currencyFormat = currencySymbol('INR')
    console.log(currencySymbol('INR'))

    if (style) {
        if (!validator.validString(style)) {
            return res.status(400).send({ status: false, message: "style is required" })
        }
    }

    if (installments) {
        if (!validator.isValid(installments)) {
            return res.status(400).send({ status: false, message: "installments required" })
        }
    }

    if (installments) {
        if (!Number.isInteger(Number(installments))) {
            return res.status(400).send({ status: false, message: "installments can't be a decimal number or string" })
        }
    }

    if (isFreeShipping) {
        if (!((isFreeShipping == "true") || (isFreeShipping == "false"))) {
            return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
        }
    }

    if (!(files && files.length > 0)) {
        return res.status(400).send({ status: false, message: "Please provide product image" })
    }

    let productPhoto = await aws_s3.uploadFile(files[0])
    productDetails.productImage = productPhoto

    if (availableSizes) {
        let array = availableSizes.split(",").map(x => x.trim())
        for (let i = 0; i < array.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(',')}` })
            }
        }
        if (Array.isArray(array)) {
            console.log(Array.isArray(array))
            productRegister['availableSizes'] = array
        }
    }

    const saveProductDetails = await productModel.create(productDetails)

    return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })


    } catch (err) {
        return res.status(500).send({status: false,message: "Error is : " + err})
    }
}


/************************************************************Get All Product********************************************/



const getAllProducts = async function (req, res) {
    try {
        const inputs = req.query;
        inputs.isDeleted = false


        if (!validator.validString(inputs.size)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Valid Size!" })
        }
        if (inputs.size) {
            inputs['availableSizes'] = inputs.size
        }

        if (!validator.validString(inputs.name)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Name Of the Product!" })
        }
        //using $regex to match the subString of the names of products & "i" for case insensitive.
        if (inputs.name) {
            inputs['title'] = {}
            inputs['title']['$regex'] = inputs.name
            inputs['title']['$options'] = 'i'
        }


        if (!validator.validString(inputs.priceGreaterThan)) {
            return res.status(400).send({ status: false, msg: "Please Provide a upper Of the Product!" })
        }
        if (!validator.validString(inputs.priceLessThan)) {
            return res.status(400).send({ status: false, msg: "Please Provide a lower Of the Product!" })
        }
        if (inputs.priceGreaterThan) {

            if (!isNaN(Number(inputs.priceGreaterThan))) {
                return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
            }
            if (inputs.priceGreaterThan <= 0) {
                return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
            }

            inputs['price'] = {}
            inputs['price']['$gte'] = Number(inputs.priceGreaterThan)

        }


        if (inputs.priceLessThan) {

            if (!isNaN(Number(inputs.priceLessThan))) {
                return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
            }
            if (inputs.priceLessThan <= 0) {
                return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
            }


            inputs['price']['$lte'] = Number(inputs.priceLessThan)

        }

        if (!validator.validString(inputs.priceSort)) {
            return res.status(400).send({ status: false, msg: "Please Sort!" })
        }

        if (inputs.priceSort) {

            if (!((inputs.priceSort == 1) || (inputs.priceSort == -1))) {
                return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
            }

            const products = await productModel.find(inputs).sort({ price: inputs.priceSort })

            if (!products.length) {
                return res.status(404).send({ productStatus: false, message: 'No Product found' })
            }

            return res.status(200).send({ status: true, message: 'Product list', data2: products })
        }


        const products = await productModel.find(inputs)

        if (!products.length) {
            return res.status(404).send({ productStatus: false, message: 'No Product found' })
        }

        return res.status(200).send({ status: true, message: 'Product list', data: products })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}

/***********************************************************Get Product By Id*******************************************/

const getProductsById = async function (req, res) {
    try {
        const productId = req.params.productId


        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }


        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, message: `product does not exists` })
        }

        return res.status(200).send({ status: true, message: 'Product found successfully', data: product })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}

/**************************************************************Update Product*****************************************/


const updateProduct = async function (req, res) {

    try {
        const updatedData = req.body
        const productId = req.params.productId


        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }

        if (!validator.isValidRequestBody(updatedData)) {
            return res.status(400).send({ status: false, message: 'No Update Data Found!!. product unmodified!!', data: product })
        }

        // Extract params
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        //Declaring an empty object then using hasOwnProperty to match the keys and setting the appropriate values.
        const updatedProductDetails = {}

        if (validator.validString(title)) {
            return res.status(400).send({ status: false, message: `Title is required` })
        }
        if (title) {

            const isTitleAlreadyUsed = await productModel.findOne({ title: title });

            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: `${title} title is already used` })
            }

            updatedProductDetails[title] = title
        }

        if (validator.validString(description)) {
            return res.status(400).send({ status: false, message: `Description is required` })
        }

        if (description) {
            updatedProductDetails['description'] = description
        }

        if (validator.validString(price)) {
            return res.status(400).send({ status: false, message: `price is required` })
        }
        if (price) {

            if (isNaN(Number(price))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }

            updatedProductDetails['price'] = price
        }

        if (validator.validString(currencyId)) {
            return res.status(400).send({ status: false, message: `currencyId is required` })
        }

        if (currencyId) {
            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }

            updatedProductDetails['currencyId'] = currencyId;
        }

        if (validator.validString(isFreeShipping)) {
            return res.status(400).send({ status: false, message: `isFreeshiping is required` })
        }

        if (isFreeShipping) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }

            updatedProductDetails['isFreeShipping'] = isFreeShipping
        }

        if (validator.validString(productImage)) {
            return res.status(400).send({ status: false, message: `product image is required` })
        }

        if (productImage) {
            let productImage = req.files;
            if ((productImage && productImage.length > 0)) {

                let updatedproductImage = await aws_s3.uploadFile(productImage[0]);

                updatedProductDetails['productImage'] = updatedproductImage
            }
        }

        if (validator.validString(style)) {
            return res.status(400).send({ status: false, message: `style is required` })
        }
        if (style) {

            updatedProductDetails['style'] = style
        }

        if (validator.validString(availableSizes)) {
            return res.status(400).send({ status: false, message: `size is required` })
        }
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }
            if (!updatedProductDetails.hasOwnProperty(updatedProductDetails, '$addToSet'))
                updatedProductDetails['$addToSet'] = {}
            updatedProductDetails['$addToSet']['availableSizes'] = sizesArray
        }

        //verifying must be a valid no. & must be greater than 0.
        if (validator.validString(installments)) {
            return res.status(400).send({ status: false, message: `installment is required` })
        }
        if (installments) {

            if (Number.isInteger(Number(installments))) {
                return res.status(400).send({ status: false, message: `installments should be a valid number` })
            }

            updatedProductDetails['installments'] = installments
        }

        const updatedProduct = await productModel.findOneAndUpdate(
            { _id: productId },
            updatedProductDetails,
            { new: true })

        return res.status(200).send({ status: true, message: 'Product details updated successfully.', data: updatedProduct });

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


/********************************************************Delete Product*************************************************/

const deleteProduct = async function (req, res) {
    try {

        const productId = req.params.productId


        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `please enter a valid productId` })
        }

        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, message: `Product Found` })
        }
        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })

            return res.status(200).send({ status: true, message: `Product deleted successfully.` })
        }
        return res.status(400).send({ status: true, message: `Product has been already deleted.` })



    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}





module.exports = { productCreation, getAllProducts, getProductsById, updateProduct, deleteProduct }