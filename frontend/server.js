const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')

require('dotenv').config();

// Products
const getmodelsRoute = require('./routes/products/models')

// Main paths
const productsRoute = require('./routes/main/products')
const tilesRoute = require('./routes/main/tiles')

// ForestMask Paths
const imageslocationsRoute = require('./routes/forestmask/imageslocations')

// Users paths
const updateRoute = require('./routes/auth/update')
const loginRoute = require('./routes/auth/login')
const logoutRoute = require('./routes/auth/logout')
const meRoute = require('./routes/auth/me')
const registerRoute = require('./routes/auth/register')
const verifyRoute = require('./routes/auth/verify')

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(imageslocationsRoute)
app.use(productsRoute)
app.use(tilesRoute)
app.use(loginRoute)
app.use(logoutRoute)
app.use(meRoute)
app.use(registerRoute)
app.use(verifyRoute)
app.use(updateRoute)
app.use(getmodelsRoute)

app.use(express.static(path.join(__dirname,'build')))
app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname+"/build/index.html"))
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,() =>{console.log(`Server listening on port ${PORT}`);})
