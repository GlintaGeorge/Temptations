const User = require('../models/usermodel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Images = require('../models/imageModel'); // Import the 'Images' model


const asyncHandler = require('express-async-handler')

const { sendOtp } = require('../utility/nodeMailer')

// Import the generateOTP function from the utility module
const { generateOTP } = require('../utility/nodeMailer'); // Adjust the path accordingly


// Index
const loadLandingPage = async (req, res) => {
    try {
        const products = await Product.find({ isListed: true }).populate('images').populate({
            path: 'categoryName',
            select: 'categoryName -_id' // Select only the categoryName field
        }).limit(4)
        console.log(products);

        // const banner = await Banner.find({ isActive: true })
        res.render('./user/pages/index', { products: products });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
}


// loading register page---
const loadRegister = async (req, res) => {
    try {
        console.log("qqqqqqqqqqqqqq")
        res.render('./user/pages/register')
    } catch (error) {
        // console.log(error)
        throw new Error(error)
    }
}

// inserting User-- 
const insertUser = async (req, res) => {
    try {
        const emailCheck = req.body.email;
        const checkData = await User.findOne({ email: emailCheck });
        if (checkData) {
            return res.render('./user/pages/register', { userCheck: "User already exists, please try with a new email" });
        } else {
            const UserData = {
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password,
            };

            const OTP = generateOTP() /** otp generating **/
            
            req.session.otpUser = { ...UserData, otp: OTP };
            console.log(req.session.otpUser.otp)
            // req.session.mail = req.body.email;  

            /***** otp sending ******/
            try {
                sendOtp(req.body.email, OTP, req.body.userName);
                return res.redirect('/sendOTP');
            } catch (error) {
                console.error('Error sending OTP:', error);
                return res.status(500).send('Error sending OTP');
            }
        }
    } catch (error) {
        throw new Error(error);
    }
}
/*************** OTP Section *******************/
// loadSentOTP page Loding--
const sendOTPpage = asyncHandler(async (req, res) => {
    try {
        const email = req.session.otpUser.email
        res.render('./user/pages/verifyOTP', { email })
    } catch (error) {
        throw new Error(error)
    }

})

// verifyOTP route handler
const verifyOTP = asyncHandler(async (req, res) => {
    try {

        // const otp = generateOTP();
        // req.session.otpUser = otp;
        
        const enteredOTP = req.body.otp;
        const email = req.session.otpUser.email
        const storedOTP = req.session.otpUser.otp; // Getting the stored OTP from the session
        console.log(storedOTP);
        const user = req.session.otpUser;

        if (enteredOTP == storedOTP) {
            const newUser = await User.create(user);

            delete req.session.otpUser.otp;
            res.redirect('/login');
        } else {
            
            messages = 'Verification failed, please check the OTP or resend it.';
            console.log('verification failed');

        }
        res.render('./user/pages/verifyOTP', { messages,email})


    } catch (error) {
        throw new Error(error);
    }
});
/**********************************************/

// Resending OTP---
const reSendOTP = async (req, res) => {
    try {
        const OTP = generateOTP() /** otp generating **/
        req.session.otpUser.otp = { otp: OTP };

        const email = req.session.otpUser.email
        const userName = req.session.otpUser.userName


        /***** otp resending ******/
        try {
            sendOtp(email, OTP, userName);
            console.log('otp is sent');
            return res.render('./user/pages/reSendOTP', { email });
        } catch (error) {
            console.error('Error sending OTP:', error);
            return res.status(500).send('Error sending OTP');
        }

    } catch (error) {
        throw new Error(error)
    }
}

// verify resendOTP--
const verifyResendOTP = asyncHandler(async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        console.log(enteredOTP);
        const storedOTP = req.session.otpUser.otp;
        console.log(storedOTP);

        const user = req.session.otpUser;

        if (enteredOTP == storedOTP.otp) {
            console.log('inside verification');
            const newUser = await User.create(user);
            if (newUser) {
                console.log('new user insert in resend page', newUser);
            } else { console.log('error in insert user') }
            delete req.session.otpUser.otp;
            res.redirect('/login');
        } else {
            console.log('verification failed');
        }
    } catch (error) {
        throw new Error(error);
    }
});


// loading login page---
const loadLogin = async (req, res) => {
    try {
        console.log('10')
        res.render('./user/pages/login')
    } catch (error) {
        throw new Error(error)
    }
}
// UserLogout----
const userLogout = async (req, res) => {
    try {
        req.logout(function (err) {

            if (err) {
                next(err);
            }
        })
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}


// userProfile---
const userProfile = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        res.render('./user/pages/profile', { user })
    } catch (error) {
        throw new Error(error);
    }
});

const changePassword = asyncHandler(async  (req, res)=>{
    try {
        res.render('./user/pages/changePassword')

    } catch(error){
        throw new Error(error);
    }
});


// loading shop page---
const  loadShop = asyncHandler(async (req, res) => {
    console.log('request from unauth user ');
    try {
        const user = req.user
        const page = req.query.p || 1;
        const limit = 2;
        console.log(1);

        console.log('user ', user);
        const listedCategories = await Category.find({ isListed: true });
        console.log(listedCategories);

        // Get the IDs of the listed categories
        const listedCategoryIds = listedCategories.map(category => category._id);
        // Find products that belong to the listed categories
        const findProducts = await Product.find(
            { categoryName: { $in: listedCategoryIds }, isListed: true }).populate('images')
            .skip((page - 1) * limit)
            .limit(limit)
        console.log("products",findProducts);
        let cartProductIds ;
        if (user) {
           if(user.cart){
            console.log('cartsdfaaaaa',user.cart);
                cartProductIds = user.cart.map(cartItem => cartItem.product.toString());
               console.log(cartProductIds,'idsdklfj');
           }
          
        } else {
            cartProductIds = null;

        }

        const count = await Product.find(
            { categoryName: { $in: listedCategoryIds }, isListed: true })
            .countDocuments();


        res.render('./user/pages/shop', { products: findProducts, category: listedCategories, user, cartProductIds,currentPage: page,
            totalPages: Math.ceil(count / limit) // Calculating total pages
            
        });
        console.log(2);
    } catch (error) {
        throw new Error(error);
    }
});

// loading product details page---
const loadProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('images')
        console.log(product)
        res.render('./user/pages/products',{getalldata:product});
    } catch (error) {
        throw new Error(error)
    }

}

// loading about page---
const loadAbout = async (req, res) => {
    try {
        console.log("on shop")
        res.render('./user/pages/about')
    } catch (error) {
        throw new Error(error)
    }
}
// loading conatct page---
const loadContact = async (req, res) => {
    try {
        console.log("on shop")
        res.render('./user/pages/contact')
    } catch (error) {
        throw new Error(error)
    }
}
//search
const search =asyncHandler( async (req, res) => {
    console.log(req.body.search);
    try {
        const data = req.body.search;
        const user = req.user;
        const page = req.query.p || 1;
        const limit = 3;
        const listedCategories = await Category.find({ isListed: true });
        // Get the IDs of the listed categories
        const listedCategoryIds = listedCategories.map(category => category._id);
        
        const searching = await Product.find({ title: { $regex: data, $options: 'i' } }).populate('images')
        .skip((page - 1) * limit)
        .limit(limit);
        console.log(user);
        const count = await Product.find(
            { categoryName: { $in: listedCategoryIds }, isListed: true })
            .countDocuments();
            let cartProductIds;
            if (user) {
                if (user.cart) {
                    cartProductIds = user.cart.map(cartItem => cartItem.product.toString());
                }
    
            } else {
                cartProductIds = null;
    
            }
            
        if (searching.length>0) {
            res.render('./user/pages/shop', { user, cartProductIds, catList: searching ,products:searching, category: listedCategories,currentPage: page,
            totalPages: Math.ceil(count / limit)
           })

        } else {
            res.render('./user/pages/shop', { user, cartProductIds, catList: searching ,products:searching, category: listedCategories,currentPage: page,
                totalPages: Math.ceil(count / limit)
               })
        }

    } catch (error) {
        console.log(error.message);
    }
})

module.exports={
    loadLandingPage,
    loadRegister,
    loadLogin,
    loadShop,
    loadAbout,
    loadContact,
    userProfile,
    insertUser,
    userLogout,
    verifyResendOTP,
    reSendOTP,
    verifyOTP,
    sendOTPpage,
    loadProduct,
    search,
    changePassword






}
