#!/bin/bash

echo "================================================="
echo "    KỊCH BẢN TRIỂN KHAI PRODUCTION LÊN DEBIAN    "
echo "================================================="

# Yêu cầu phải cài nodejs, npm và pm2 trước
# sudo npm install -g pm2

echo "1. Cập nhật các gói thư viện (NPM Install)..."
cd backend && npm install
cd ../frontend && npm install
cd ..

echo "2. Build Frontend (React Vite)..."
cd frontend
npm run build
cd ..

echo "3. Cấu hình PM2 để chạy nền cả hai dịch vụ..."
# Dừng các phiên bản cũ trước đó (nếu có)
pm2 delete vlu-backend vlu-frontend 2>/dev/null || true

# Chạy theo cấu hình hệ sinh thái
pm2 start ecosystem.config.js

echo "4. Lưu lại cấu hình PM2 để khởi động cùng hệ thống..."
pm2 save
# (Tuỳ chọn: Nếu chưa setup startup, hãy chạy lệnh 'pm2 startup' và làm theo hướng dẫn trên terminal DBian).

echo "================================================="
echo " Triển khai thành công! Hệ thống đang chạy nền.  "
echo " - Backend API: http://localhost:5000            "
echo " - Frontend Web: http://localhost:3000           "
echo " Lệnh quản lý PM2 cơ bản:                        "
echo "   pm2 status     # Xem trạng thái              "
echo "   pm2 logs       # Xem log lỗi/thực thi        "
echo "   pm2 restart all # Khởi động lại toàn bộ       "
echo "================================================="
