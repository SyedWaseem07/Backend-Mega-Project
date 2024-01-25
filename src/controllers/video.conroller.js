import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadCloudinary} from "../utils/cloudinary.js"

const publishAVideo = asyncHandler( async (req, res) => {
    const {title, description} = req.body

    if(!title || !description) throw new ApiError(400, "Title and description required")

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath || !thumbnailLocalPath) throw new ApiError(400, "Video and thumbnail required");

    const videoFile = await uploadCloudinary(videoLocalPath)
    const thumbnail = await uploadCloudinary(thumbnailLocalPath)

    if(!videoFile || !thumbnail) throw new ApiError(400, "Video and thumbnail required");

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user
    })

    return res.status(200).json(new ApiResponse(200, video, "Video published successfully"))
    
} )

const getVideoById = asyncHandler( async (req, res) => {
    const { videoId } = req.params;

    if(!videoId) throw new ApiError(400, "Invalid video id")
    const id = new mongoose.Types.ObjectId(videoId);
    const video = await Video.findById(id);
    if(!video) throw new ApiError(400, "Video not found");
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
} )

const updateVideoDetails = asyncHandler( async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if(!videoId) throw new ApiError(400, "Invalid video id")

    const thumbnailLocalPath = req.file?.path;
    
    if(!title && !description && !thumbnailLocalPath) throw new ApiError(400, "Updation details required");

    const thumbnail = await uploadCloudinary(thumbnailLocalPath);

    const id = new mongoose.Types.ObjectId(videoId);

    const video = await Video.findById(id);

    if(title) video.title = title;
    if(description) video.description = description;
    if(thumbnail) video.thumbnail = thumbnail.url;

    video.save({validateBeforeSave: false})

    const updatedVideo = await Video.findById(id);
    if(!video) throw new ApiError(400, "Video not found");


    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
    
} )

const deleteVideo = asyncHandler( async (req, res) => {
    const {videoId} = req.params;

    if(!videoId) throw new ApiError(400, "Invalid video id")

    const id = new mongoose.Types.ObjectId(videoId);

    await Video.deleteOne({_id: id})

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));

} )

const togglePublishStatus = asyncHandler( async(req, res) => {
    const {videoId} = req.params;
    if(!videoId) throw new ApiError(400, "Invalid video id")
    const id = new mongoose.Types.ObjectId(videoId);    

    const video = await Video.findById(id)
    if(!video) throw new ApiError(400, "Video not found");
    video.isPublished = !video.isPublished;
    video.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200, video, "Publish status toggled successfully"));

} )
export {
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    deleteVideo,
    togglePublishStatus
}