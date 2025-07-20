import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
}) //cấu hình cho nó biết ở đâu

const port = process.env.PORT || 8001



connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`server is running localhost:${port}`);
        })
    })
    .catch((err) => {
        console.log("lỗi", err);

    })