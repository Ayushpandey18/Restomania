import async_Handler from "../utils/asyncHandler.js"
import {User} from "../models/User.model.js"
import apierror from "../utils/apierror.js"
import { apiresponse } from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
const generateAccessTokenandRefreshToken= async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apierror("error generating tokens",500)
    }
}
const registerUser=async_Handler(async(req,res)=>{
    console.log(req.body);
    const {fullname,email,password,phoneno}=req.body
    console.log("email",email);
    if([fullname,email,password,phoneno].some((field)=>field?.trim()==="")){
        return res.status(402).json(
            new apiresponse(402,"All fields are required")
        )
    }
    const existedUser=await User.findOne({$or:[{email},{phoneno}]})
    if(existedUser){
        return res.status(402).json(
            new apiresponse(402,"User already exists")
        )
    }
    const user= await User.create({
        fullname,
        email,
        password,
        phoneno
    })
   const createduser= await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createduser){
    throw new apierror("user not created",500)
   }
return res.status(201).json(
    new apiresponse(201,"user created successfully",createduser)
)
})
const loginUser=async_Handler(async(req,res)=>{
    const {email,phoneno,password}=req.body
    if(!(email||phoneno)){
        return res.status(402).json(
            new apiresponse(402,"All fields are required")
        )
    }
    const user=await User.findOne({$or:[{email},{phoneno}]})
    if(!user){
        return res.status(500).json(
            new apiresponse(402,"User not found")
        )
    }
    const isPasswordCorrect=await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        return res.status(401).json(
            new apiresponse(401,"password is incorrect")
        )
    }
    const {accessToken,refreshToken}=await generateAccessTokenandRefreshToken(user._id)
    const loggedinuser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options={
        httpOnly: true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options).json(
        new apiresponse(200,"user logged in successfully",{user:loggedinuser,accessToken,refreshToken
        })
    )
})
const logoutuser=async_Handler(async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );   
const options={
    httpOnly: true,
    secure:true
}
return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options).json(
    new apiresponse(200,"user logged out successfully")
)
})
const refreshAccessToken=async_Handler(async(req,res)=>{
    const incomingrefreshToken=req.cookies.refreshToken||req.body.refreshToken
    if(!incomingrefreshToken){
        throw new apierror("refresh token is required",400)
    }
try {
    const decodedtoken=jwt.verify(
        incomingrefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    )
    const user=await User.findById(decodedtoken._id)
    if(!user){
        throw new apierror("user not found",404)
    }
    console.log(user.refreshToken)
    if(incomingrefreshToken!==user.refreshToken){
        throw new apierror("invalid refresh token",403)
    }
    const options={
        httpOnly: true,
        secure:true
    }
    const {accessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(user._id)
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options).json(
        new apiresponse(200,"new access token generated successfully",{accessToken,newrefreshToken})
    )
} catch (error) {
    throw new apierror("invalid refresh token",401)
}
})
const changeCurrentPassword=async_Handler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        return res.status(400).json(
            new apiresponse(400,"wrong old password")
        )
    }
    user.password=newpassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(
        new apiresponse(200,"password changed successfully")
    )
})
const getcurrentuser=async_Handler(async(req,res)=>{
    return res.status(200).json(
        new apiresponse(200,"user fetched successfully",req.user)
    )
})
const getordrerhistory=async_Handler(async(req,res)=>{
    const user=await User.aggregate([
        {$match:{_id:new mongoose.Types.ObjectId(req.user._id)}},
        {
            $lookup:{
                from: "orders",
                localField: "orderHistory",
                foreignField: "_id",
                as: "orderHistory",
            }
        }
    ])
    return res.status(200).json(
        new apiresponse(200,"watch history fetched successfully",user[0].orderHistory)
    )
})
export {
    registerUser,
    loginUser,
    logoutuser,
    getordrerhistory,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentuser
};