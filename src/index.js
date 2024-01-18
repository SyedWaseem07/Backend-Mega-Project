// require("dotenv").config({})
import dotenv from "dotenv";
import connectToDb from './db/index.js'

dotenv.config({
    path: './env',
})

connectToDb();

