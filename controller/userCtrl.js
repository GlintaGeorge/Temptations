const User = require('../models/usermodel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Images = require('../models/imageModel'); // Import the 'Images' model
const asyncHandler = require('express-async-handler')
const { sendOtp } = require('../utility/nodeMailer')
const crypto = require('crypto')
const bcrypt = require('bcrypt');
const Wallet = require("../models/walletModel");
const WalletTransaction = require("../models/walletTransactionModel");
const Review = require('../models/reviewModel')
// Import the generateOTP function from the utility module
const { generateOTP } = require('../utility/nodeMailer'); // Adjust the path accordingly
const { sendVerifymail } = require('../utility/nodeMailer')
const { isValidQueryId } = require('../middlewares/idValidation')
const moment = require("moment")

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
        res.render('./user/pages/verifyOTP', { messages, email })


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
        const wallet = await Wallet.findOne({ user: user._id });
        res.render('./user/pages/profile', { user, wallet })
    } catch (error) {
        throw new Error(error);
    }
});


const loadShop = asyncHandler(async (req, res) => {
    console.log('request from unauth user ');
    try {
        const user = req.user;
        const page = req.query.p || 1;
        const limit = 6;

        const listedCategories = await Category.find({ isListed: true });
        const categoryMapping = {};

        listedCategories.forEach(category => {
            categoryMapping[category.categoryName] = category._id;
        });
        const filter = { isListed: true };
        let cat = '6528e157b4fe45ab5e23b889'
        if (req.query.category) {
            console.log(0);
            // Check if the category name exists in the mapping
            if (categoryMapping.hasOwnProperty(req.query.category)) {
                filter.categoryName = categoryMapping[req.query.category];
            } else {
                filter.categoryName = cat
            }
        }

        // Check if a search query is provided
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                
            ];
            // if search and category both included in the query parameters 
            if (req.query.search && req.query.category) {
                if (categoryMapping.hasOwnProperty(req.query.category)) {
                    filter.categoryName = categoryMapping[req.query.category];
                } else {
                    filter.categoryName = cat
                }
            }
        }

        let sortCriteria = {};

// Check for price sorting
if (req.query.sort === 'lowtoHigh') {
    console.log("1");
    console.log("1");
    console.log("1");
    console.log("1");
    console.log("1");
    console.log("1");

    sortCriteria.salePrice = 1;
} else if (req.query.sort === 'highToLow') {
    sortCriteria.salePrice = -1;
}
        

        //filter by both category and price
        if (req.query.category && req.query.sort) {
            console.log(2);
            if (categoryMapping.hasOwnProperty(req.query.category)) {
                filter.categoryName = categoryMapping[req.query.category];
            } else {
                filter.categoryName = cat
            }

            if (req.query.sort) {
                sortCriteria.salePrice = 1;
            }
            if (req.query.sort === 'highToLow') {
                sortCriteria.salePrice = -1;
            }
        }


        const findProducts = await Product.find(filter).populate('images')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort(sortCriteria);

        let userWishlist;
        let cartProductIds;
        if (user) {
            if (user.cart || user.wishlist) {
                cartProductIds = user.cart.map(cartItem => cartItem.product.toString());
                userWishlist = user.wishlist;
            }

        } else {
            cartProductIds = null;
            userWishlist = false;
        }

        const count = await Product.find(filter)
            // { categoryName: { $in: listedCategoryIds }, isListed: true })
            .countDocuments();
        let selectedCategory = [];
        if (filter.categoryName) {
            selectedCategory.push(filter.categoryName)
        }
        console.log('selected cat', selectedCategory);


        res.render('./user/pages/shop', {
            products: findProducts,
            category: listedCategories,
            cartProductIds,
            user,
            userWishlist,
            currentPage: page,
            totalPages: Math.ceil(count / limit), // Calculating total pages
            selectedCategory
        });
    } catch (error) {
        throw new Error(error);
    }
});

const loadProduct = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id
        const user = req.user
        console.log(user)
        const findProduct = await Product.findOne({ _id: id }).populate('categoryName').populate('images')

        const reviews = await Review.find({ product: id }).populate("user");


        let totalRating = 0;
        let avgRating = 0;

        if (reviews.length > 0) {
            for (const review of reviews) {
                totalRating += Math.ceil(parseFloat(review.rating));
            }
            const averageRating = totalRating / reviews.length;
            avgRating = averageRating.toFixed(2);

        } else {
            avgRating = 0;
        }
        if (!findProduct) {
            return res.status(404).render('./user/pages/404')
        }
        const products = await Product.find({ isListed: true }).populate('images').limit(3)
        let cartProductIds;
        let userWishlist;
        if (user) {
            if (user.cart || user.userWishlist) {
                cartProductIds = user.cart.map(cartItem => cartItem.product.toString());
                userWishlist = user.wishlist;
            }

        } else {
            cartProductIds = null;
            userWishlist = false;

        }
        res.render('./user/pages/products', { getalldata: findProduct, products: products, cartProductIds, userWishlist, reviews, avgRating })
    } catch (error) {
        throw new Error(error)
    }
})

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
const walletTransactionspage = asyncHandler(async (req, res) => {
    try {
        const walletId = req.params.id;
        const walletTransactions = await WalletTransaction.find({ wallet: walletId }).sort({ timestamp: -1 });
        res.render("user/pages/walletTransaction", {
            title: "Wallet Transactions",
            page: "Wallet-Transactions",
            walletTransactions,
        });
    } catch (error) {
        throw new Error(error);
    }
});

// // review
const addReview = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;

        const existingReview = await Review.findOne({ user: userId, product: productId });

        if (existingReview) {
            existingReview.review = req.body.review;
            existingReview.rating = req.body.rating;
            await existingReview.save();
        } else {
            const newReview = await Review.create({
                user: userId,
                product: productId,
                review: req.body.review,
                rating: req.body.rating,
            });
        }
        res.redirect("back");
    } catch (error) {
        throw new Error(error);
    }
});

//search
const search = asyncHandler(async (req, res) => {
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

        if (searching.length > 0) {
            res.render('./user/pages/shop', {
                user, cartProductIds, catList: searching, products: searching, category: listedCategories, currentPage: page,
                totalPages: Math.ceil(count / limit)
            })

        } else {
            res.render('./user/pages/shop', {
                user, cartProductIds, catList: searching, products: searching, category: listedCategories, currentPage: page,
                totalPages: Math.ceil(count / limit)
            })
        }

    } catch (error) {
        console.log(error.message);
    }
})

//edit profile ---
async function editProfilePost(req, res) {
    // Get the user's current information.
    const userId =req.user.id;
    const user = await User.findOne({ _id: userId });

    // Get the user's updated information.
    const newuserName = req.body.userName;
    const newEmail = req.body.email;


    // Update the user's information.
    user.userName = newuserName;
    user.email = newEmail;
    await user.save();

    // Return a success response.
    res.redirect('/profile')
}

//change password---
const UpdatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);


        console.log('Provided Old Password:', oldPassword);

        // Compare the old password
        if (!oldPassword) {
            console.error('Old password not provided');
            return res.status(400).json({ error: 'Old password not provided' });
        }

        const isPasswordValid = await user.isPasswordMatched(oldPassword);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Old password is incorrect' });
        }

        // Hash and update the new password
        try {
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            console.log(newPassword)
            user.password = hashedNewPassword;

        } catch (hashError) {
            console.error('Error hashing new password:', hashError);
            return res.status(500).json({ error: 'Error hashing new password' });
        }

        // Save the updated user
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//reset password page---
const forgetLoad = async (req, res) => {
    try {
        res.render('./user/pages/forgetpsw')
    } catch (error) {
        throw new Error(error)
    }
}

//reset pswd postemail--
const forgetpswd = async (req, res) => {
    try {

        const email = req.body.email
        const user = await User.findOne({ email: email });
        if (user) {
            const randomString = randomstring.generate();
            const updateData = await User.updateOne({ email: email }, { $set: { token: randomString } })
            sendVerifymail(user.userName, user.email, randomString);
            res.render('./user/pages/forgetpsw', { message: "Please check your mail to reset your password" })
        } else {
            res.render('./user/pages/forgetpsw', { message: "user email is incorrect" })
        }

    } catch (error) {
        throw new Error(error)
    }
}

//forget pswd page get---
const forgetPswdload = async(req,res)=>{

    try {
        const token =req.query.token;        
        const tokenData = await User.findOne({token:token})
        if(tokenData){
            res.render('./user/pages/forget-password',{user_id :tokenData._id});

        }else{
            res.render('./user/pages/404',{message:"Token is invalid"})
        }
    } catch (error) {
        throw new Error(error)
    }
}

//forget pswd post--
const resetPswd = async(req,res)=>{

    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);

       const updateData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password,token:''}})
       res.redirect('/login')

    } catch (error) {
        throw new Error(error)
    }
}



module.exports = {
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
    editProfilePost,
    walletTransactionspage,
    addReview,
    UpdatePassword,
    forgetLoad,
    forgetpswd,
    forgetPswdload,
    resetPswd,
    
}
