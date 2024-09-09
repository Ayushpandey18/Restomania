import { Order } from '../models/Order.model.js';
import async_Handler  from '../utils/asyncHandler.js'; 
import { Food } from '../models/Food.model.js';
import {User} from '../models/User.model.js'
import { apiresponse } from '../utils/apiresponse.js';
const createorder=async_Handler(async (req,res)=>{
    const { items, deliveryAddress } = req.body;
    const userId = req.user._id;
    const foodItems = await Food.find({ '_id': { $in: items.map(item => item.item)}});
    const foodMap = foodItems.reduce((map, food) => {
        map[food._id.toString()] = food;
        return map;
    }, {});
    const totalAmount = items.reduce((acc, item) => {
        const food = foodMap[item.item.toString()];
        if (food) {
            return acc + (food.price * item.quantity);
        }
        return acc;
    }, 0);
    const order = new Order({
        orderedby: userId,
        items,
        totalAmount,
        deliveryAddress,
    });
    await order.save();
    const user = await User.findById(userId);
    user.orderHistory.push(order._id);
    await user.save();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(201).json(
        new apiresponse(200,"Order created successfully",order)
    )
})
const updateorderstatus=async_Handler(async (req,res)=>{
    const { id } = req.params;
        const { status } = req.body; 
        if (!['Pending', 'Shipped', 'Delivered', 'Canceled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
        if (!order) return res.status(404).json({ message: 'Order not found' });

        return res.status(201).json(
            new apiresponse(200,"Order updated successfully",order)
        )
})
const getpendingorders = async_Handler(async (req, res) => {
    const orders = await Order.find({ status: 'Pending' })
        .populate({
            path: 'items.item',
            model: 'Food', 
        });

    if (!orders || orders.length === 0) {
        return res.status(404).json(
            new apiresponse(404, "No pending orders found")
        );
    }

    return res.status(200).json(
        new apiresponse(200, "Pending orders fetched successfully", orders)
    );
});
const specificorders=async_Handler(async (req,res)=>{
    const { id } = req.params
    const orders = await Order.findById(id).populate({
        path: 'items.item',
        model: 'Food', 
    });
    if(!orders){
        return res.status(404).json(
            new apiresponse(404,"order not found")
        )}
        return res.status(201).json(
            new apiresponse(200,"order fetched success",orders)
        )
})
export{
   createorder,
   updateorderstatus,
   getpendingorders,
   specificorders
}
