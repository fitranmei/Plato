# PLATO Docker Deployment Guide

## Prerequisites
- Docker installed di VPS
- Docker Compose installed
- Git installed

## Step-by-Step Deployment ke VPS

### 1. Clone Repository ke VPS
```bash
git clone https://github.com/fitranmei/Plato.git
cd Plato
```

### 2. Setup Environment Variables
```bash
cp .env.docker .env
# Edit .env sesuai kebutuhan
nano .env
```

### 3. Build dan Run dengan Docker Compose

#### Opsi A: Menggunakan MongoDB Atlas (Recommended)
Jika menggunakan MongoDB Atlas, hapus service `mongo` dari docker-compose.yml:
```bash
# Edit docker-compose.yml dan hapus/comment service mongo
docker-compose up -d backend frontend nginx
```

#### Opsi B: Menggunakan MongoDB Lokal
```bash
# Run semua services termasuk MongoDB
docker-compose up -d
```

### 4. Cek Status Container
```bash
docker-compose ps
docker-compose logs -f
```

### 5. Access Application
- Frontend: http://your-vps-ip
- Backend API: http://your-vps-ip/api

## Useful Commands

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Code Changes
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Clean Up
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove unused images
docker system prune -a
```

## Production Deployment (dengan SSL)

### 1. Install Certbot di VPS
```bash
sudo apt update
sudo apt install certbot
```

### 2. Generate SSL Certificate
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

### 3. Update nginx.conf untuk SSL
Edit `nginx/nginx.conf` dan tambahkan:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... rest of config
}
```

### 4. Copy SSL certificates
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

### 5. Restart nginx
```bash
docker-compose restart nginx
```

## Troubleshooting

### Backend tidak connect ke MongoDB
- Cek MONGO_URI di .env
- Cek network connectivity: `docker-compose exec backend ping mongo`

### Frontend tidak bisa access backend
- Cek nginx config
- Cek backend health: `curl http://localhost:8080/api/health`

### Port sudah dipakai
```bash
# Cek port yang digunakan
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Stop service yang menggunakan port
sudo systemctl stop apache2  # jika ada apache
sudo systemctl stop nginx    # jika ada nginx system
```

## Monitoring

### Check Resource Usage
```bash
docker stats
```

### Check Disk Space
```bash
docker system df
```

## Security Notes
1. Ubah JWT_SECRET di .env
2. Gunakan HTTPS di production
3. Set firewall rules di VPS
4. Jangan expose port MongoDB (27017) ke public
5. Regular backup database
