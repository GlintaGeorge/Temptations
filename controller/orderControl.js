const asyncHandler = require("express-async-handler");
const {
    getOrders,
    getSingleOrder,
    getReview,
    cancelOrderById,
    cancelSingleOrder,
    generateInvoice,
} = require("../helpers/orderHelper");
const OrderItem = require("../models/orderItemModel");
const moment = require('moment'); 

const pdfMake = require("pdfmake/build/pdfmake");
const vfsFonts = require("pdfmake/build/vfs_fonts");

/**
 * Orders Page Route
 * Method GET
 */
exports.orderspage = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);

        const orders = await getOrders(userId);

        res.render("user/pages/orders", {
            title: "Orders",
            page: "orders",
            orders,
        });
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Checkout Page Route
 * Method GET
 */
exports.singleOrder = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;

        const { order, orders } = await getSingleOrder(orderId);
        const review = await getReview(req.user._id, order.product._id);

        // Pass moment to the template
        res.render("user/pages/singleOrder", {
            title: order.product.title,
            page: order.product.title,
            order,
            review,
            orders,
            moment: require('moment'), // Add this line
        });
    } catch (error) {
        throw new Error(error);
    }
});


/**
 * Cancel Order Route
 * Method PUT
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;

        const result = await cancelOrderById(orderId);

        if (result === "redirectBack") {
            res.redirect("back");
        } else {
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Cancel Single Order Route
 * Method PUT
 */
exports.cancelSingleOrder = asyncHandler(async (req, res) => {
    try {
        const orderItemId = req.params.id;

        const result = await cancelSingleOrder(orderItemId, req.user._id);
        return res.redirect("/orders");
        if (result === "redirectBack") {
           
        } else {
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Return Order Requst
 * Method POST
 */
// exports.returnOrder = asyncHandler(async (req, res) => {
//     try {
//         const returnOrderItemId = req.params.id;
//         const result = await returnOrder(returnOrderItemId);

//         if (result === "redirectBack") {
//             res.redirect("back");
//         } else {
//             res.json(result);
//         }
//     } catch (error) {
//         throw new Error(error);
//     }
// });

/**
 * Download Invoice
 * Method GET
 */
exports.donwloadInvoice = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;

        const data = await generateInvoice(orderId);
        pdfMake.vfs = vfsFonts.pdfMake.vfs;

        // Create a PDF document
        const pdfDoc = pdfMake.createPdf(data);

        // Generate the PDF and send it as a response
        pdfDoc.getBuffer((buffer) => {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=invoices.pdf`);

            res.end(buffer);
        });
    } catch (error) {
        throw new Error(error);
    }
});