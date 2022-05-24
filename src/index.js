const express=require('express')
const app=express()

const route=require('./routes/route')

const bodyparser=require('body-parser')
const multer=require('multer')
 app.use(bodyparser.json())
 app.use(bodyparser.urlencoded({extended:true}))
 app.use(multer().any())

const mongoose=require('mongoose')
mongoose.connect('mongodb+srv://tara:rVnCoeQUcaLqFprm@cluster0.k1yor.mongodb.net/group50Database',{ useNewUrlParser: true })
    .then(() => console.log('MongoDB is connected!!'))
    .catch(err => console.log(err))


app.use('/',route)

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});