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
            return res.status(400).send({ status: false, message: "currency fromat is required" })
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" })
        }
        productDetails.currencyFormat = currencySymbol('INR')

        if (!validator.validString(style)) {
            return res.status(400).send({ status: false, message: "style is required" })
        }


        if (!validator.validString(installments)) {
            return res.status(400).send({ status: false, message: "installments required" })
        }


        if (installments) {
            if (!Number.isInteger(Number(installments))) {
                return res.status(400).send({ status: false, message: "installments can't be a decimal number or string" })
            }
        }

        if (!validator.validString(isFreeShipping)) {
            return res.status(400).send({ status: false, message: "isFreeShipping required" })
        }

        if (isFreeShipping) {
            if (!((isFreeShipping == "true") || (isFreeShipping == "false"))) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            }
        }

        if (!files.length) {
            return res.status(400).send({ status: false, message: "Please provide product image" })
        }

        let productPhoto = await aws_s3.uploadFile(files[0])
        productDetails.productImage = productPhoto

        if (!validator.validString(availableSizes)) {
            return res.status(400).send({ status: false, message: "Available Size is required" })
        }

        if (availableSizes) {
            let sizes = availableSizes.split(",").map(x => x.trim())
            sizes.forEach((size) => {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size)) {
                    return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
                productDetails['availableSizes'] = sizes
            })

        }

        const saveProductDetails = await productModel.create(productDetails)

        return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })


    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


/************************************************************Get All Product********************************************/

const getAllProducts = async function (req, res) {
    try {
        const inputs = req.query;

        let filterData = {}
        filterData.isDeleted = false


        if (!validator.validString(inputs.size)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Valid Size!" })
        }
        if (inputs.size) {
            filterData['availableSizes'] = inputs.size
        }

        if (!validator.validString(inputs.name)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Name Of the Product!" })
        }

        if (inputs.name) {
            filterData['title'] = {}
            filterData['title']['$regex'] = inputs.name //$regex to match the subString
            filterData['title']['$options'] = 'i'  //"i" for case insensitive.

        }

        if (!validator.validString(inputs.priceGreaterThan)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Lowest Price Of the Product!" })
        }
        if (!validator.validString(inputs.priceLessThan)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Highest Price Of the Product!" })
        }
        if (inputs.priceGreaterThan || inputs.priceLessThan) {

            filterData.price = {}

            if (inputs.priceGreaterThan) {

                if (isNaN(Number(inputs.priceGreaterThan))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (inputs.priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan shouldn't be 0 or-ve number` })
                }

                filterData['price']['$gte'] = Number(inputs.priceGreaterThan)

            }


            if (inputs.priceLessThan) {

                if (isNaN(Number(inputs.priceLessThan))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (inputs.priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan can't be 0 or -ve` })
                }

                filterData['price']['$lte'] = Number(inputs.priceLessThan)

            }
        }

        if (!validator.validString(inputs.priceSort)) {
            return res.status(400).send({ status: false, msg: "Please Sort 1 for Ascending -1 for Descending order!" })
        }

        if (inputs.priceSort) {

            if (!((inputs.priceSort == 1) || (inputs.priceSort == -1))) {
                return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
            }

            const products = await productModel.find(filterData).sort({ price: inputs.priceSort })

            if (!products.length) {
                return res.status(404).send({ productStatus: false, message: 'No Product found' })
            }

            return res.status(200).send({ status: true, message: 'Product list', data2: products })
        }


        const products = await productModel.find(filterData)

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
        let files = req.files;


        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid ProductId" })
        }

        const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!checkProduct) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        if (!validator.isValidRequestBody(updatedData)) {
            return res.status(400).send({ status: false, message: "please provide product details to update" })
        }

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = updatedData

        const updatedProductDetails = {}

        if (!validator.validString(title)) {
            return res.status(400).send({ status: false, message: `Title is required` })
        }
        if (title) {

            const checkTitle = await productModel.findOne({ title: title });

            if (checkTitle) {
                return res.status(400).send({ status: false, message: ` Title is already used` })
            }

            updatedProductDetails['title'] = title
        }

        if (!validator.validString(description)) {
            return res.status(400).send({ status: false, message: `Description is required` })
        }

        if (description) {
            updatedProductDetails['description'] = description
        }

        if (!validator.validString(price)) {
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

        if (!validator.validString(currencyId)) {
            return res.status(400).send({ status: false, message: `currencyId is required` })
        }

        if (currencyId) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }

            updatedProductDetails['currencyId'] = currencyId;
        }

        if (!validator.validString(currencyFormat)) {
            return res.status(400).send({ status: false, message: `currency format is required` })
        }

        if (currencyFormat) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" })
            }
            updatedProductDetails['currencyFormat'] = currencySymbol('INR')
        }

        if (!validator.validString(isFreeShipping)) {
            return res.status(400).send({ status: false, message: `isFreeshiping is required` })
        }

        if (isFreeShipping) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }

            updatedProductDetails['isFreeShipping'] = isFreeShipping
        }

        if (!files.length) {
            return res.status(400).send({ status: false, message: "Please provide product image" })
        }

        let updatedproductImage = await aws_s3.uploadFile(files[0]);
        updatedProductDetails.productImage = updatedproductImage

        if (!validator.validString(style)) {
            return res.status(400).send({ status: false, message: `style is required` })
        }

        if (style) {

            updatedProductDetails['style'] = style
        }

        if (!validator.validString(availableSizes)) {
            return res.status(400).send({ status: false, message: `size is required` })
        }

        if (availableSizes) {
            let sizes = availableSizes.split(",").map(x => x.trim())
            sizes.forEach((size) => {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size)) {
                    return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
                updatedProductDetails['availableSizes'] = sizes
            })
        }

        if (!validator.validString(installments)) {
            return res.status(400).send({ status: false, message: `installment is required` })
        }
        if (installments) {

            if (!Number.isInteger(Number(installments))) {
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