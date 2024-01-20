import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"})) //for setting limit on json data when receiving
app.use(express.urlencoded({extended: true, limit: "16kb"})) //for encoding value from url
app.use(express.static("public")) //to store coming images and files in our server

// cookieParser is used to access and set the cookies from the browser of user.
app.use(cookieParser())

export { app }