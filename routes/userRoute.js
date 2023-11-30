 const express = require ("express")
 const userRoute=express.Router()
 const passport = require('passport')

const userController = require("../controller/userCtrl")
const cartController = require('../controller/cartControl')
const addressController = require('../controller/addressControl')
const checkoutController = require("../controller/checkoutControl");
const orderController = require("../controller/orderControl");
const methodOverride = require('method-override');
const moment = require('moment');
const { ensureNotAuthenticated, ensureAuthenticated } = require('../middlewares/userAuth')
const validateID = require('../middlewares/idValidation')

userRoute.use((req, res, next) => {
    req.app.set('layout', 'user/layout/user');
    next();
  })

  // userRoute.use(methodOverride('_method'));

// userRoute setting----
userRoute.get('/', userController.loadLandingPage); /* Loading home page */



userRoute.get('/register', ensureNotAuthenticated, userController.loadRegister); /* Register Page */
userRoute.post('/register', ensureNotAuthenticated, userController.insertUser);
userRoute.get('/sendOTP', ensureNotAuthenticated, userController.sendOTPpage); /* otp sending */
userRoute.post('/sendOTP', ensureNotAuthenticated, userController.verifyOTP);
userRoute.get('/reSendOTP', ensureNotAuthenticated, userController.reSendOTP); /* otp Resending */
userRoute.post('/reSendOTP', ensureNotAuthenticated, userController.verifyResendOTP);


// userRoute.get('/login',userController.loadLogin);/*loading login page */
userRoute.get('/shop',userController.loadShop);// loading shop page
userRoute.get('/about',userController.loadAbout);// loading about page
userRoute.get('/contact',userController.loadContact);// loading contact page
userRoute.post('/shop/search', userController.search);// searching....

// userRoute.post('/setNewPassword',userController.setNewPassword);// changePassword
userRoute.post("/review/add/:id", ensureAuthenticated,userController.addReview); // review section


// Login & Verification section---
userRoute.get('/login', ensureNotAuthenticated, userController.loadLogin);
userRoute.post('/login', ensureNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/', // Redirect on successful login
    failureRedirect: '/login', // Redirect on failed login
    failureFlash: true, // enable flash messages
  }));

  //<!--profile routes-->
userRoute.post('/edit-profile', ensureAuthenticated,userController. editProfilePost);
userRoute.put('/editpsw', ensureAuthenticated, userController.UpdatePassword);
userRoute.get('/forget',ensureNotAuthenticated,userController.forgetLoad)
userRoute.post('/forget', ensureAuthenticated,userController.forgetpswd)
userRoute.get('/forget-password',ensureNotAuthenticated,userController.forgetPswdload)
userRoute.post('/forget-password',ensureNotAuthenticated, userController.resetPswd)
  

userRoute.get('/products/:id', userController.loadProduct);
userRoute.get('/logout', ensureAuthenticated, userController.userLogout);

userRoute.get('/profile', ensureAuthenticated, userController.userProfile);
userRoute.get("/profile/wallet/:id", userController.walletTransactionspage);

// cart_section-- 
userRoute.get('/cart', ensureAuthenticated, cartController.cartpage);
userRoute.get('/cart/add/:id', ensureAuthenticated, cartController.addToCart);
userRoute.get('/remove/:id', ensureAuthenticated, cartController.removeFromCart);
userRoute.get('/cart/inc/:id',ensureAuthenticated, cartController.incQuantity);
userRoute.get('/cart/dec/:id', ensureAuthenticated, cartController.decQuantity);

// Address_Routes__
userRoute.get('/savedAddress', ensureAuthenticated, addressController.savedAddress)
userRoute.get('/addAddress', ensureAuthenticated, addressController.addAddressPage)
userRoute.post('/addAddress', ensureAuthenticated, addressController.insertAddress)
userRoute.get('/editAddress/:id',  ensureAuthenticated, addressController.editAddressPage)
userRoute.post('/editAddress/:id', ensureAuthenticated, addressController.updateAddress)
userRoute.get('/deleteAddress/:id', ensureAuthenticated, addressController.deleteAddress)


// Checkout routes
userRoute.post("/checkout", checkoutController.checkoutpage);
userRoute.get("/checkout/get", checkoutController.getCartData);
userRoute.post("/place-order", checkoutController.placeOrder);
userRoute.get("/order-placed/:id", checkoutController.orderPlaced);
userRoute.post("/update", checkoutController.updateCheckoutPage);
userRoute.post("/verify-payment", checkoutController.verifyPayment);
userRoute.post("/coupon", checkoutController.updateCoupon);
userRoute.get("/coupon/remove", checkoutController.removeAppliedCoupon);

userRoute.get("/wallet/:id", userController.walletTransactionspage);



// Order Routes
userRoute.get("/orders", orderController.orderspage);
userRoute.get("/orders/:id", orderController.singleOrder);
userRoute.put("/orders/:id", orderController.cancelOrder);
userRoute.put("/orders/single/:id", orderController.cancelSingleOrder);
userRoute.get("/orders/download/:id", orderController.donwloadInvoice);



// 404 notfound page--
userRoute.get('*',(req,res)=>{res.render('./user/pages/404')})



module.exports=userRoute;
