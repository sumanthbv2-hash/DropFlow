# YourPad - Complete Production Deployment Guide

This guide covers step-by-step instructions for deploying **YourPad** to production using both cloud platform services (Vercel + Railway/Render + Supabase) and single-server VPS setups (DigitalOcean / Hetzner / AWS EC2 with Docker Compose).

---

## Architecture Summary for Production

- **Frontend**: Next.js 14 (App Router) -> Deployed on **Vercel**
- **Backend API & WebSockets**: Python FastAPI -> Deployed on **Railway** / **Render** / **Fly.io**
- **Database**: Managed PostgreSQL -> Hosted on **Supabase** / **Neon**
- **File Storage**: Object Storage -> **AWS S3** or **Cloudflare R2**

---

## Option 1: Managed Cloud Platforms (Recommended & Easiest)

### Step 1: Set Up Managed PostgreSQL Database (Supabase)

1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Go to **Project Settings > Database** and copy your PostgreSQL connection string:
   ```env
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

### Step 2: Set Up File Storage (AWS S3 or Cloudflare R2)

1. **AWS S3**:
   - Create an S3 Bucket (e.g. `yourpad-uploads-prod`).
   - Create an IAM User with `AmazonS3FullAccess` policies and save the `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`.
   - Configure Bucket CORS policy:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["https://yourpad.domain.com", "https://*.vercel.app"],
         "ExposeHeaders": []
       }
     ]
     ```

2. **Cloudflare R2** (Zero Egress Fees Alternative):
   - S3-compatible API credentials can be generated directly from Cloudflare R2 dashboard.

---

### Step 3: Deploy Backend API & WebSockets to Railway or Render

#### Deploying on Railway (Supports WebSockets natively out-of-the-box):
1. Go to [Railway.app](https://railway.app) and create a new project.
2. Select **Deploy from GitHub repo** and point to your repository's `/backend` directory.
3. Add Environment Variables in Railway:
   ```env
   PORT=8000
   HOST=0.0.0.0
   DEBUG=False
   SECRET_KEY=generate-a-strong-random-secret-key-32-chars
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   STORAGE_TYPE=s3
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=yourpad-uploads-prod
   ```
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
6. Copy your deployed Backend domain URL (e.g. `https://yourpad-backend.up.railway.app`).

---

### Step 4: Deploy Frontend Next.js App to Vercel

1. Go to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Configure Environment Variables in Vercel:
   ```env
   NEXT_PUBLIC_API_URL=https://yourpad-backend.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://yourpad-backend.up.railway.app
   ```
   *(Note: Use `wss://` for secure WebSocket connections on production)*
5. Click **Deploy**. Vercel will build and assign your production domain (`https://yourpad.vercel.app`).

---

## Option 2: Docker Compose VPS Deployment (Single-Server Setup)

If you prefer hosting everything on a single $5-$10/month VPS (DigitalOcean, Hetzner, AWS EC2, Linode):

### Step 1: Provision VPS & Clone Repository

1. Spin up an Ubuntu 22.04 LTS server.
2. SSH into your VPS:
   ```bash
   ssh root@your-server-ip
   ```
3. Install Docker & Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt-get install -y docker-compose-plugin
   ```
4. Clone your project code:
   ```bash
   git clone https://github.com/your-username/yourpad.git
   cd yourpad
   ```

---

### Step 2: Configure Environment Variables

Create `.env` file in the project root:

```env
PORT=8000
HOST=0.0.0.0
DEBUG=False
SECRET_KEY=super-secret-production-key-99201948
DATABASE_URL=postgresql://yourpad:yourpadpassword@postgres:5432/yourpad
REDIS_URL=redis://redis:6379/0
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=/storage
MAX_FILE_SIZE_MB=50

NEXT_PUBLIC_API_URL=https://yourpad.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourpad.yourdomain.com
```

---

### Step 3: Launch Containers with Docker Compose

```bash
docker compose up -d --build
```

Verify containers are running:
```bash
docker compose ps
```

---

### Step 4: Configure Nginx & Let's Encrypt SSL Certificate

Install Nginx & Certbot:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create Nginx site configuration (`/etc/nginx/sites-available/yourpad`):

```nginx
server {
    server_name yourpad.yourdomain.com;

    # Frontend Reverse Proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Proxy Support
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site & get free SSL certificate:
```bash
ln -s /etc/nginx/sites-available/yourpad /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d yourpad.yourdomain.com
```

Your production website will now be live with full HTTPS & Secure WebSockets (`wss://`)!

---

## Production Security & Maintenance Checklist

- [x] Change `SECRET_KEY` in production `.env` to a cryptographically secure random string.
- [x] Set `DEBUG=False` in backend production environment.
- [x] Configure CORS headers on backend to only allow your domain.
- [x] Use `wss://` protocol for production WebSockets.
- [x] Enable SSL/TLS encryption for database connection string (`sslmode=require`).
