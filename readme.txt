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