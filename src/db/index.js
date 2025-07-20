// Bất kỳ khi nào bạn truy cập vào db hãy nhớ 2 điều
// chưa chắc 100% thành công do có thể xảy ra lỗi trong quá trình chạy
//nên sử dụng try catch
import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`)
        console.log(`monggo conected!! DB host :  ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("Monggo lỗi rồi " , error);
        process.exit(1) 
        
    }
}

export default connectDB