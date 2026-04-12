#!/bin/bash

echo "======================================"
echo "Khởi động Hệ thống VLU Enterprise Link"
echo "======================================"

# Khởi chạy Backend ở background (chế độ nền)
echo "[1/2] Đang khởi động Backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Khởi chạy Frontend ở background
echo "[2/2] Đang khởi động Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "--------------------------------------"
echo "Hệ thống đang chạy thành công (Debian/Linux)."
echo "Nhấn Ctrl + C để dừng cả Backend và Frontend."
echo "--------------------------------------"

# Trap để bắt sự kiện người dùng nhấn Ctrl+C, sẽ tự động kill cả 2 tiến trình
trap "echo -e '\nĐang tắt hệ thống...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Lệnh wait giúp script vẫn treo (không thoát ra) để lắng nghe tiến trình
wait $BACKEND_PID $FRONTEND_PID
