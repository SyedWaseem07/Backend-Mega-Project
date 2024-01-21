import dotenv from "dotenv";
import { app } from "./app.js";
import connectToDb from "./db/index.js"

dotenv.config({
    path: "./env",
})

connectToDb()
.then(() => {
    app.on("Error" , (err) => {
        console.log(err);
        throw err;
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server Running at port ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("Mongo Db Connection failed", err);
})
