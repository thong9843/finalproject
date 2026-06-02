# Hướng Dẫn Đóng Gói Docker & Triển Khai Lên Google Cloud VM (Compute Engine)

Tài liệu này hướng dẫn chi tiết các bước để đóng gói ứng dụng **VLU Enterprise Link** thành Docker image `tabbyneko/vlu-enterprise-link-dev` và chạy trực tiếp trên VM của Google Cloud Platform (GCP) qua cổng `8080` (không cần cài thêm Nginx ngoài).

---

## 📋 Mục Lục
1. [Bước 1: Build và Push Docker Image](#bước-1-build-và-push-docker-image)
2. [Bước 2: Tạo VM Instance trên Google Cloud Compute Engine](#bước-2-tạo-vm-instance-trên-google-cloud-compute-engine)
3. [Bước 3: Mở cổng 8080 trên Google Cloud Firewall](#bước-3-mở-cổng-8080-trên-google-cloud-firewall)
4. [Bước 4: Cài đặt Docker trên VM](#bước-4-cài-đặt-docker-trên-vm)
5. [Bước 5: Khởi chạy Container trên VM](#bước-5-khởi-chạy-container-trên-vm)
6. [Bước 6: Kiểm tra và Quản lý dữ liệu](#bước-6-kiểm-tra-và-quản-lý-dữ-liệu)

---

## 🛠️ Bước 1: Build và Push Docker Image

Thực hiện các lệnh sau trên máy tính cá nhân của bạn (nơi đang chứa mã nguồn dự án):

### 1. Build Docker image
Chạy lệnh sau để build image từ root `Dockerfile` của dự án:
```bash
docker build -t tabbyneko/vlu-enterprise-link-dev .
```

### 2. Kiểm tra image vừa build
Đảm bảo image đã được tạo thành công:
```bash
docker images | grep vlu-enterprise-link-dev
```

### 3. Đăng nhập Docker Hub
Đăng nhập tài khoản Docker Hub của bạn (nếu chưa đăng nhập):
```bash
docker login
```

### 4. Push Image lên Docker Hub
Đẩy image vừa build lên kho lưu trữ Docker Hub của bạn:
```bash
docker push tabbyneko/vlu-enterprise-link-dev
```

---

## 🖥️ Bước 2: Tạo VM Instance trên Google Cloud Compute Engine

1. Truy cập vào trang quản lý [Google Cloud Console](https://console.cloud.google.com/).
2. Điều hướng tới **Compute Engine** -> **VM Instances** và bấm **Create Instance**.
3. Cấu hình VM theo gợi ý sau:
   - **Machine type**: `e2-medium` (2 vCPUs, 4GB RAM - Khuyên dùng để đảm bảo hiệu năng chạy cả DB, Backend và Frontend Dev Server).
   - **Boot disk**: Chọn **Ubuntu 22.04 LTS** hoặc **Debian 12** (kích thước tối thiểu 20GB).
   - **Firewall**: Tích chọn **Allow HTTP traffic** và **Allow HTTPS traffic**.
4. Bấm **Create** để khởi tạo VM.
5. Sau khi tạo xong, lưu ý lại địa chỉ **External IP** của VM (ví dụ: `35.240.x.x`).

---

## 🛡️ Bước 3: Mở cổng 8080 trên Google Cloud Firewall

Theo mặc định, GCP sẽ khóa toàn bộ các cổng ngoại trừ 22, 80 và 443. Bạn cần tạo luật firewall để mở cổng `8080`:

1. Điều hướng tới **VPC Network** -> **Firewall** trên GCP Console.
2. Bấm **Create Firewall Rule**.
3. Điền thông tin cấu hình:
   - **Name**: `allow-vlu-app-8080`
   - **Targets**: Chọn **All instances in the network** (hoặc gán theo target tags nếu muốn bảo mật hơn).
   - **Source IPv4 ranges**: Nhập `0.0.0.0/0` (cho phép tất cả IP truy cập, hoặc nhập dải IP của riêng bạn để bảo mật).
   - **Protocols and ports**: Chọn **Specified protocols and ports**, tích chọn **TCP** và nhập `8080`.
4. Bấm **Create**.

---

## 📦 Bước 4: Cài đặt Docker trên VM

1. Từ danh sách VM Instances, bấm vào nút **SSH** bên cạnh VM của bạn để mở cửa sổ terminal kết nối trực tiếp.
2. Cập nhật hệ thống và cài đặt Docker bằng các lệnh sau:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io
   ```
3. Khởi động và cấu hình Docker tự động chạy khi khởi động VM:
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
4. (Tùy chọn) Thêm user hiện tại vào group `docker` để chạy lệnh không cần `sudo`:
   ```bash
   sudo usermod -aG docker $USER
   ```
   *Lưu ý: Bạn cần tắt cửa sổ SSH và mở lại để thay đổi này có hiệu lực.*

---

## 🚀 Bước 5: Khởi chạy Container trên VM

Chạy các lệnh sau trong cửa sổ SSH của VM:

### 1. Tạo Docker Volume để lưu trữ Database lâu dài
Nếu không ánh xạ dữ liệu ra ngoài, mỗi khi container bị tắt hoặc tạo mới, toàn bộ dữ liệu MySQL sẽ bị mất. Chúng ta cần tạo một volume riêng:
```bash
docker volume create vlu_db_data
```

### 2. Kéo (Pull) Image mới nhất từ Docker Hub về VM
```bash
sudo docker pull tabbyneko/vlu-enterprise-link-dev
```

### 3. Khởi chạy Container
Chạy container với các cấu hình:
- Chạy ẩn dưới nền (`-d`).
- Đặt tên container là `vlu-app` (`--name vlu-app`).
- Ánh xạ cổng `8080` của VM vào cổng `8080` của container (`-p 8080:8080`).
- Gán Docker Volume vừa tạo vào đường dẫn dữ liệu MySQL trong container (`-v vlu_db_data:/var/lib/mysql`).
- Tự động khởi động lại nếu container bị crash hoặc VM khởi động lại (`--restart unless-stopped`).

```bash
sudo docker run -d \
  --name vlu-app \
  -p 8080:8080 \
  -v vlu_db_data:/var/lib/mysql \
  --restart unless-stopped \
  tabbyneko/vlu-enterprise-link-dev
```

---

## 🔍 Bước 6: Kiểm tra và Quản lý dữ liệu

### 1. Kiểm tra ứng dụng hoạt động
Mở trình duyệt web của bạn và truy cập vào đường dẫn:
```text
http://<EXTERNAL_IP_CUA_VM>:8080
```
Bạn sẽ thấy giao diện của trang Web Frontend tải thành công và có thể đăng nhập thử bằng tài khoản mặc định:
- **Email**: `admin@vlu.edu.vn`
- **Mật khẩu**: `admin123`

### 2. Xác thực việc bảo toàn dữ liệu (Persistence)
Nhờ vào cơ chế kiểm tra dữ liệu thông minh trong file `entrypoint.sh` đã chỉnh sửa:
- **Lần chạy đầu tiên**: Container sẽ tự tạo Database, chạy Migration SQL và import dữ liệu từ các file CSV mẫu vào MySQL.
- **Các lần chạy sau**: Khi khởi động lại hoặc recreate container bằng volume `vlu_db_data`, hệ thống sẽ tự động phát hiện Database đã tồn tại và bỏ qua bước Migration để **không làm mất dữ liệu** bạn đã thao tác trên giao diện Web.

Bạn có thể test bằng cách dừng và khởi động lại container:
```bash
sudo docker stop vlu-app
sudo docker start vlu-app
```
Dữ liệu bạn thêm mới hoặc sửa đổi sẽ vẫn được giữ nguyên.

### 3. Xem nhật ký log chạy ứng dụng
Nếu muốn debug hoặc xem log từ Backend/Frontend, dùng lệnh:
```bash
sudo docker logs -f vlu-app
```
