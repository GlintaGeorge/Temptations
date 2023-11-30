const User = require('../models/usermodel')
const validateMongoDbId = require('../utility/validateMongodbId');
const Product = require('../models/productModel')
const asyncHandler = require('express-async-handler');
const Cart= require('../models/cartModel')
const { incrementQuantity, decrementQuantity, calculateCartTotals } = require("../helpers/cartHelper");




const cartpage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const messages = req.flash();
    

    try {
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "products.product",
                populate: {
                    path: "images",
                    model: "Images",
                },
            })
            .exec();

        if (cart) {
            const { subtotal, total} = calculateCartTotals(cart.products);
            
            
            res.render("user/pages/cart", {
                title: "Cart",
                page: "cart",
                cartItems: cart,
                messages,
                subtotal,
                total,
                
                
            });
        } else {
            res.render("user/pages/cart", { title: "Cart", page: "cart", messages, cartItems: null });
        }
    } catch (error) {
        throw new Error(error);
    }
});


const addToCart = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;
    validateMongoDbId(productId);

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity < 1) {
            return res.status(400).json({ message: "Product is out of stock" });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({
                user: userId,
                products: [{ product: productId, quantity: 1 }],
            });
        } else {
            const existingProduct = cart.products.find((item) => item.product.equals(productId));

            if (existingProduct) {
                if (product.quantity <= existingProduct.quantity) {
                    return res.json({
                        message: "Out of Stock",
                        status: "danger",
                        count: cart.products.length,
                    });
                }
                existingProduct.quantity += 1;
            } else {
                cart.products.push({ product: productId, quantity: 1 });
            }
            await cart.save();
        }

        res.json({ message: "Product Added to Cart", count: cart.products.length, status: "success" });
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Remove From Cart Route
 * Method GET
 */
const removeFromCart = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;
    validateMongoDbId(productId);
    try {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.products = cart.products.filter((product) => product.product.toString() !== productId);
            await cart.save();
        }
        req.flash("warning", `Item Removed`);
        res.redirect("back");
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Increment Quantity Route
 * Method PUT
 */
const incQuantity = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await incrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Decrement Quantity Route
 * Method PUT
 */
const decQuantity = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await decrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error);
    }
});


module.exports = {decQuantity,cartpage,incQuantity,removeFromCart,addToCart}