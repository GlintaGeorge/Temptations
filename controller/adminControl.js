const expressHandler = require('express-async-handler')
const User = require('../models/usermodel') 
const validateMongoDbId = require("../utility/validateMongodbId");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const OrderItem = require("../models/orderItemModel");
const { status } = require("../utility/status");
const Wallet = require("../models/walletModel") ;

const  numeral = require("numeral");
const moment = require("moment")
const { handleReturnedOrder, handleCancelledOrder, updateOrderStatus } = require("../helpers/admin_orderHelper");

// Loading loginPage--   
const loadLogin = expressHandler(async(req,res)=>{

    try {
        res.render('./admin/pages/login',{title:'Login'})
    } catch (error) {
        throw new Error(error)
    }
})
// verifyAdmin--
const verifyAdmin = expressHandler(async(req,res)=>{

    try {
      
        const email = process.env.ADMIN_EMAIL
        const password =   process.env.ADMIN_PASSWORD
          
            const emailCheck = req.body.email
           const user = await User.findOne({email:emailCheck})

            if(user){
                     res.render('./admin/pages/login',{adminCheck:'You are not an Admin',title:'Login'})
            }
         if(email === email && req.body.password === password){
              
              req.session.admin = email; 
            res.render('./admin/pages/index',{title:'dashboard'})
         }else{
            res.render('./admin/pages/login', {adminCheck: 'Invalid Credentials',title:'Login'})
         }

    } catch (error) {
        throw new Error(error)
    }
}) 


// loadDashboard---  
const loadDashboard = expressHandler(async(req,res)=>{

    try {
        res.render('./admin/pages/index',{title:'Dashboard'})
    } catch (error) {
        throw new Error(error)
    }
})

// UserManagement-- 
const userManagement = expressHandler(async(req,res)=>{

    try {
     
        const findUsers = await User.find();
            
        res.render('./admin/pages/userList',{users:findUsers,title:'UserList'})
    } catch (error) {
        throw new Error(error) 
    }
}) 
// searchUser
const searchUser = expressHandler(async(req,res)=>{

    try {
     
        const  data = req.body.search
        const searching = await User.find({userName:{$regex: data , $options: 'i' }});
        if(searching){
             res.render('./admin/pages/userList',{users:searching,title:'Search'})
        }else{
            res.render('./admin/pages/userList',{title:'Search'})
        }
            
       
    } catch (error) {
        throw new Error(error) 
    }
}) 
// Block a User
const blockUser = expressHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndUpdate(id, { isBlock: true }, { new: true });

        if (user) {
            // Send a JSON response indicating success
            res.json({ message: "User blocked successfully" });
        } else {
            // Handle the case where the user was not found or not updated
            res.status(404).json({ message: "User not found or could not be updated" });
        }
    } catch (error) {
        // Handle any errors that occurred during the update
        res.status(500).json({ message: "Error while blocking the user" });
    }
});

// Unblock a User
const unBlockUser = expressHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndUpdate(id, { isBlock: false }, { new: true });

        if (user) {
            // Send a JSON response indicating success
            res.json({ message: "User unblocked successfully" });
        } else {
            // Handle the case where the user was not found or not updated
            res.status(404).json({ message: "User not found or could not be updated" });
        }
    } catch (error) {
        // Handle any errors that occurred during the update
        res.status(500).json({ message: "Error while unblocking the user" });
    }
});

// Admin Logout--
const logout = (req, res)=>{
    try {
        req.session.admin = null;
        res.redirect('/admin')
    } catch (error) {
        throw new Error(error)
    }
}

//order Management

const ordersPage = expressHandler(async (req, res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: "orderItems",
                select: "product status _id",
                populate: {
                    path: "product",
                    select: "title images",
                    populate: {
                        path: "images",
                    },
                },
            })
            .select("orderId orderedDate shippingAddress city zip totalPrice")
            .sort({ orderedDate: -1 });
        // res.json(orders);
        res.render("admin/pages/orders", { title: "Orders", orders });
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Edit Order Page Route
 * Method GET
 */
const editOrder = expressHandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ orderId: orderId })
            .populate({
                path: "orderItems",
                modal: "OrderItems",
                populate: {
                    path: "product",
                    modal: "Product",
                    populate: {
                        path: "images",
                        modal: "Images",
                    },
                },
            })
            .populate({
                path: "user",
                modal: "User",
            });
        res.render("admin/pages/viewOrder", { title: "Edit Order", order });
    } catch (error) {
        throw new Error(error);
    }
});
 
/**
 * Update Order Status
 * Method PUT
 */
const updateOrderStatuss = expressHandler(async (req, res) => {
    try {
        const orderId = req.params.id;

console.log(orderId)
console.log(req.body.status)
console.log(status)
const newStatus = req.body.status
        // const order = await updateOrderStatus(orderId, req.body.status);\
        const order = await OrderItem.findByIdAndUpdate(orderId, { status: newStatus })
        if (req.body.status === status.shipped) {
            order.shippedDate = Date.now();
        } else if (req.body.status === status.delivered) {
            order.deliveredDate = Date.now();
        }
        console.log("2")
        await order.save();

        if (req.body.status === status.cancelled) {
            await handleCancelledOrder(order);
        }
    
        if (order.status === status.returnPending) {
            await handleReturnedOrder(order);
        }

        res.redirect("back");
    } catch (error) {
        throw new Error(error);
    }
});
/**
 * Search Order
 * Method POST
 */
const searchOrder = expressHandler(async (req, res) => {
    try {
        const search = req.body.search;
        const order = await Order.findOne({ orderId: search });
        if (order) {
            res.redirect(`/admin/orders/${search}`);
        } else {
            req.flash("danger", "Can't find Order!");
            res.redirect("/admin/dashboard");
        }
    } catch (error) {
        throw new Error(error);
    }
});



module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard,
    userManagement,
    searchUser,
    blockUser,
    unBlockUser,
    logout,
    searchOrder,
    updateOrderStatuss,
    editOrder,
    ordersPage,





}