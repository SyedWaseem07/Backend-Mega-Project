import mongoose from "mongoose";

const connectToDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n Mongo DB Connected!! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Connection error", error);
        process.exit(1);
    }
}

export default connectToDb;