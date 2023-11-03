// Requiring modules---
const express = require('express');
const path = require('path');
const logger = require('morgan');
const session = require('express-session')

const passport = require('passport')
const connectFlash = require('connect-flash')
const connectMongo = require('connect-mongo')
const mongoose = require('mongoose')
const nocache = require('nocache')
const expressLayouts = require('express-ejs-layouts')
require('dotenv').config()
const dataBase = require('./config/dataBase')
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const methodOverride= require('method-override')

// importing routes--
const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute');





// Create an Express app
const app = express();

// Connect to the database
dataBase.dbConnect();

// Middleware
app.use(nocache())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Session config
app.use(
    session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  
    },

})
);

// using for sending message to ejs
app.use(connectFlash());
app.use((req, res, next) => {
    res.locals.messages = req.flash()
    next();
})



// for passport authentication
app.use(passport.initialize())
app.use(passport.session())
require('./utility/passportAuth')

// for user session activity checking
app.use((req, res, next) => {
    res.locals.user = req.user;
    next()
});



// view engine setup
app.use(express.static("public"));
app.use("/admin", express.static(__dirname + "public/admin"));

app.use(expressLayouts)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));

// Routes-----
app.use('/admin', adminRoute) // user routes
app.use('/', userRoute); // AdminRoutes---




// error Handling---
app.use(notFound);
app.use(errorHandler);



// server setup--
const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server Started on http://localhost:${process.env.PORT}`)
})

module.exports = app;
