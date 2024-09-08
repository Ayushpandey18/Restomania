import {Router} from "express"
import {createorder,
    updateorderstatus,
    getpendingorders,
    specificorders} from "../controllers/order.controller.js";
import verifyJWT from "../middlewares/Auth.middleware.js";
const orderRouter=Router();
orderRouter.route("/placeorder").post(verifyJWT,createorder);
orderRouter.route("/update-order-status").put(updateorderstatus);
orderRouter.route("/get-pending-orders/:id").get(getpendingorders);
orderRouter.route("/get-specific-order/:id").get(specificorders);
export default orderRouter;