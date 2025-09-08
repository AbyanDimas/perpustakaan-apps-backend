#!/bin/bash
set -e

# Variabel
MYSQL_ROOT_PASSWORD="password123"
MYSQL_USER="admin"
MYSQL_PASSWORD="password123"
MYSQL_DATABASE="mydb"
MYSQL_CONTAINER_NAME="mysql-server"
MYSQL_IMAGE="mysql:8.0"
MYSQL_PORT="3306"

echo "[1/6] Pull MySQL image..."
podman pull $MYSQL_IMAGE

echo "[2/6] Buat volume untuk data persistence..."
podman volume create mysql_data

echo "[3/6] Hentikan container lama (jika ada)..."
podman rm -f $MYSQL_CONTAINER_NAME || true

echo "[4/6] Jalankan MySQL container..."
podman run -d \
  --name $MYSQL_CONTAINER_NAME \
  -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
  -e MYSQL_USER=$MYSQL_USER \
  -e MYSQL_PASSWORD=$MYSQL_PASSWORD \
  -e MYSQL_DATABASE=$MYSQL_DATABASE \
  -v mysql_data:/var/lib/mysql \
  -p $MYSQL_PORT:3306 \
  $MYSQL_IMAGE \
  --default-authentication-plugin=mysql_native_password \
  --bind-address=0.0.0.0

echo "[5/6] Atur firewall untuk port $MYSQL_PORT..."
sudo firewall-cmd --add-port=${MYSQL_PORT}/tcp --permanent
sudo firewall-cmd --reload

echo "[6/6] Konfigurasi selesai!"
echo "MySQL server sudah jalan di port $MYSQL_PORT"
echo "Root password : $MYSQL_ROOT_PASSWORD"
echo "Database      : $MYSQL_DATABASE"
echo "User          : $MYSQL_USER"
echo "User password : $MYSQL_PASSWORD"
echo "Gunakan: podman logs -f $MYSQL_CONTAINER_NAME untuk melihat log."
