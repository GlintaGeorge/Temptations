const asyncHandler = require("express-async-handler");
const checkoutHelper = require("../helpers/checkoutHelper");
const User = require("../models/usermodel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const validateMongoDbId = require("../utility/validateMongodbId");
const OrderItems = require("../models/orderItemModel");


/**
 * Checkout Page Route
 * Method POST
 */
exports.checkoutpage = asyncHandler(async (req, res) => {
    try {
        const userid = req.user._id;
        const user = await User.findById(userid).populate("addresses");
        const cartItems = await checkoutHelper.getCartItems(userid);
        const cartData = await Cart.findOne({ user: userid });
         

        if (cartItems) {
            const { subtotal, total } = await checkoutHelper.calculateTotalPrice(
                cartItems,
                userid,
                false
                
            );

            if (!cartItems.products.length) {
                res.redirect("/cart");
            }

            

            res.render("user/pages/checkout", {
                title: "Checkout",
                page: "checkout",
                address: user.addresses,
                product: cartItems.products,
                total,
                subtotal,
                cartData
                
            
                
            });
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Checkout Page Route
 * Method GET
 */
exports.placeOrder = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId, payment_method } = req.body;  // Retrieve payment_method from the request body
        console.log("9999999999900000000000000000");
        const newOrder = await checkoutHelper.placeOrder(userId, addressId, payment_method);  // Use payment_method here

        if (payment_method === "cash_on_delivery") {
            console.log("9999999999999999999999999");
            res.status(200).json({
                message: "Order placed successfully",
                orderId: newOrder._id,
            });
        } else {
            res.status(400).json({ message: "Invalid payment method" });
        }
    } catch (error) {
        throw new Error(error);
    }
});


/**
 * Get Cart Data
 */
exports.getCartData = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const cartData = await Cart.findOne({ user: userId });
        res.json(cartData);
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Order Placed
 * Method GET
 */
exports.orderPlaced = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const userId = req.user._id;

        // Populate the order details, including product details
        const order = await Order.findById(orderId).populate({
            path: "orderItems",
            populate: {
                path: "product",
            },
        });

        const cartItems = await checkoutHelper.getCartItems(req.user._id);

        if (order.payment_method === "cash_on_delivery") {
            for (const item of order.orderItems) {
                item.isPaid = "cod";
                await item.save();
            }
        }
        
        if (cartItems) {
            for (const cartItem of cartItems.products) {
                const updateProduct = await Product.findById(cartItem.product._id);
                updateProduct.quantity -= cartItem.quantity;
                updateProduct.sold += cartItem.quantity;
                await updateProduct.save();
                await Cart.findOneAndDelete({ user: req.user._id });
            }
        }

        

        // Render the order placed page with orderDetails
        res.render("user/pages/orderPlaced", {
            title: "Order Placed",
            page: "Order Placed",
            order: order,
        });
    } catch (error) {
        throw new Error(error);
    }
});


exports.updateCheckoutPage = asyncHandler(async (req, res) => {
    try {
        const userid = req.user._id;
       
        const user = await User.findById(userid).populate("addresses");
        const cartItems = await checkoutHelper.getCartItems(userid);

        
            const { subtotal, total } = await checkoutHelper.calculateTotalPrice(
                cartItems,
                userid, // need to check and do this on nect week

            );
            res.json({ total, subtotal });
        }
    // }
    catch (error) {
        throw new Error(error);
    }
});

