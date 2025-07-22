Các bước tiến hành :

B1 : npm init -y
    type : modul
B2 : npm i --save-dev nodemon prettier
B3 : Tạo .prettierrc
        .prettierignore

B4 : Tạo src
    mkdir controllers db middlewares models routers utils
    touch app.js index.js constants.js .env .env.sample
 B4 : Tạo models 
    touch comment.models.js like.models.js playlist.models.js sub.models.js tweeter.models.js user.models.js video.models.js
B5 : npm i express mongoose 

B6 : Khởi tạo express bên app.js cho qua index.js

    Tạo biến bảo mật .evn , thêm cors 
    sau đó thêm use.cors , use.express

B7 : tạo const trong constants.js 
    kết nối ts db bằng index.js trong db
    tạo env của url mongoose
    cấu hình mongoose : {
        Networrk 
        DB access : tạo tài khoản mật khẩu mới 
        connect : vô connect -> comparre lấy : mongodb+srv://phanlandt:<db_password>@cluster0.pg1cmjc.mongodb.net/ bỏ / sau cùng
    }

B8 : Viết hàm nâng cao trong utils

B9 : Tạo heathcheck 
    tạo controllers.heathcheck
    tạo heathcheck.routers
    tạo use.api trong app.js

B10 : Tạo models qua https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj
    Tạo theo schema export ra dữ liệu
    Sử dụng thêm mongoose aggregate paginate v2
    npm install mongoose-aggregate-paginate-v2
    thêm vào các models

B11 : Thêm thư viện bcrypt mã hoá , sử dụng methods của Schema , cài thêm thư viện của json web token để access với refresh token.

B12 : cài $ npm install cookie-parser
    cài thêm multer npm install multer
    npm install cloudinary
    tạo middlewares - multer.js upload ảnh


B13 Tạo dữ liệu xử lý user trong controllers
    Sau đó chuyển đường đi routers
    Rồi cho vào app.js để api

    Xử lý ở controller cách lấy user upload ảnh 
    thêm delete cho cloudinary

B14 Thêm generateAccessAndRefreshToken , loginUser tron user để đăng nhập 

B15 thêm refreshAccessToken và logoutUser trong user để logout xoá đi cái phần refreshToken

B16 : Cả hai đoạn đều cố gắng làm middleware xác thực JWT, nghĩa là:
        Lấy access token từ cookie hoặc header Authorization.
        Giải mã token bằng jwt.verify(...).
        Tìm user trong database bằng _id từ token.
        Nếu hợp lệ: gán req.user = user để các route sau dùng.
        Nếu không: báo lỗi 401 - Unauthorized.

B17 : quay lại controller logoutUser tiếp tục middleware của auth
    Giải thích trong phần Qua_trinh_Auth và cau hỏi về API