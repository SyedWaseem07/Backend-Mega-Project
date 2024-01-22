import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js" 
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something Went Wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist : username and email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token feild from response
    // check for user creation
    // return res

    const {fullName, username, email, password} = req.body
    console.log(email); 

    if(
        [fullName, email, username, password].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existingUser) throw new ApiError(409, "User with same name or email already exist")

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required")

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!avatar) throw new ApiError(400, "Avatar is required");

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    } 

    return res.status(201).json(new ApiResponse(200, createdUser, "User Registered successfully"))

} )

const loginUser = asyncHandler( async (req, res) => {
    // get data from req body 
    // validate username or email and password
    // find the user in db
    // check password
    // generate access and refresh token
    // send tokens in secure cookies to user
    // send response

    const { email, username, password } = req.body
    if(!username && !email) throw new ApiError(400, "Username or email is required")

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user) throw new ApiError(404, "User does not exist")

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) throw new ApiError(401, "Invalid User Credentials")

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,     // only server can modify
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }, "User Logged In Successfully"));
    ;
} )

const logoutUser = asyncHandler( async (req, res) => {
    // find user
    // reset refreshToken
    // clear cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"))

})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) throw new ApiError((401, "Unauthorized request"))

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) throw new ApiError((401, "Unauthorized request"))
    
        if(incomingRefreshToken !== user?.refreshToken) 
            throw new ApiError((401, "Refresh token is expired or used"))
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(new ApiResponse(200, {
            accessToken, newRefreshToken
        }, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})
export { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken
}