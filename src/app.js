import express from "express"
import cors from "cors"

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // lấy từ .env
    credentials: true,               // cho phép gửi cookie, token
  })
);


// ✅ Middleware xử lý dữ liệu gửi lên server

// Cho phép Express phân tích dữ liệu JSON từ body (ví dụ POST với JSON)
// Giới hạn dung lượng tối đa là 16KB để tránh gửi dữ liệu quá lớn
app.use(express.json({ limit: "16kb" }));
// Cho phép Express phân tích dữ liệu từ form HTML (x-www-form-urlencoded)
// extended: true → cho phép object lồng nhau (nested object)
// limit: giới hạn kích thước dữ liệu là 16KB
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Cho phép truy cập các file tĩnh (static) từ thư mục "public"
// Ví dụ: public/logo.png có thể truy cập qua http://localhost:PORT/logo.png
app.use(express.static("public"));





//import routes
import healthCheckRoute from "./routers/healthcheck.routers.js";


//routes
app.use("/api/v1/healthcheck", healthCheckRoute);



export { app } 