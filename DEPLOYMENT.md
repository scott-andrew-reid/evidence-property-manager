# Deployment Guide - Evidence Property Manager

## Overview

This application can be deployed in three ways:

1. **Cloud (Development/Testing):** Vercel + Neon Postgres
2. **Self-Hosted Docker:** Full stack containerized
3. **Hybrid:** Self-hosted app + cloud database

---

## Option 1: Cloud Deployment (Vercel + Neon)

**Current setup for development.**

### Prerequisites
- Vercel account
- Neon account (free tier)

### Steps
1. Create Neon database at https://console.neon.tech
2. Copy connection string
3. Set environment variables in Vercel:
   - `DATABASE_URL` = Neon connection string
   - `JWT_SECRET` = random secure string
4. Deploy: `vercel --prod`

### Status
✅ Currently deployed at: https://evidence-property-manager.vercel.app

---

## Option 2: Self-Hosted Docker (Full Stack)

**Production-ready containerized deployment.**

### Prerequisites
- Docker & Docker Compose installed
- Server/VPS with Docker support

### Quick Start

1. **Clone repository:**
```bash
git clone https://github.com/scott-andrew-reid/evidence-property-manager.git
cd evidence-property-manager
```

2. **Configure environment:**
```bash
cp .env.docker .env
# Edit .env and set secure passwords
```

3. **Generate secure secrets:**
```bash
# Generate DB password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

4. **Update .env file:**
```env
DB_PASSWORD=<your_generated_password>
JWT_SECRET=<your_generated_secret>
```

5. **Deploy:**
```bash
docker-compose up -d
```

6. **Check status:**
```bash
docker-compose ps
docker-compose logs -f app
```

7. **Access:**
- Application: http://localhost:3000
- Default login: admin/admin123

### Production Deployment

For production on a VPS:

1. **Set up reverse proxy (Nginx/Caddy):**
```nginx
# Nginx example
server {
    listen 80;
    server_name evidence.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Enable SSL with Let's Encrypt:**
```bash
certbot --nginx -d evidence.yourdomain.com
```

3. **Configure firewall:**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# Database backup
docker exec evidence-db pg_dump -U evidence_user evidencedb > backup.sql

# Database restore
docker exec -i evidence-db psql -U evidence_user evidencedb < backup.sql
```

---

## Option 3: Hybrid Deployment

**Self-host app, use cloud database.**

### Use Cases
- Leverage managed database (backups, scaling)
- Full control over application
- Cost optimization

### Steps

1. **Use Neon/Supabase for database**
2. **Modify docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: evidence-app
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}  # Your cloud DB URL
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
```

3. **Set .env:**
```env
DATABASE_URL=postgresql://user:pass@cloud-provider.com/dbname?sslmode=require
JWT_SECRET=your_secure_secret
```

4. **Deploy:**
```bash
docker-compose up -d
```

---

## VPS Recommendations

### Budget Options ($5-10/month)
- **Hetzner Cloud:** Best value (Germany/Finland)
- **DigitalOcean:** Easy to use
- **Linode:** Reliable
- **Vultr:** Global locations

### Minimum Requirements
- **CPU:** 1 vCPU
- **RAM:** 1 GB (2 GB recommended)
- **Storage:** 20 GB SSD
- **OS:** Ubuntu 22.04 LTS

---

## Security Checklist

### Pre-Deployment
- [ ] Change default admin password
- [ ] Set strong DB_PASSWORD
- [ ] Set random JWT_SECRET
- [ ] Review user permissions
- [ ] Configure firewall

### Post-Deployment
- [ ] Enable HTTPS/SSL
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Update regularly
- [ ] Review audit logs

---

## Monitoring

### Health Checks
Both services include health checks:
- **Database:** `pg_isready` every 10s
- **App:** HTTP endpoint check every 30s

### Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

---

## Troubleshooting

### App won't start
```bash
# Check logs
docker-compose logs app

# Verify database is ready
docker-compose ps
docker exec evidence-db pg_isready -U evidence_user

# Restart
docker-compose restart app
```

### Database connection errors
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:port/dbname

# Test connection
docker exec evidence-db psql -U evidence_user -d evidencedb -c "SELECT 1"
```

### Port conflicts
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Or change port in docker-compose.yml:
ports:
  - "8080:3000"  # Access via port 8080
```

---

## Backup Strategy

### Automated Daily Backups

Create `/opt/evidence-backups/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/evidence-backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec evidence-db pg_dump -U evidence_user evidencedb | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
# Keep last 30 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/evidence-backups/backup.sh
```

---

## Scaling

### Horizontal Scaling
- Use Nginx/HAProxy for load balancing
- Scale app containers: `docker-compose up -d --scale app=3`
- Use external PostgreSQL (RDS/Neon/Supabase)

### Performance Tuning
- Increase PostgreSQL `max_connections`
- Add Redis for session storage
- Enable Next.js output caching
- Use CDN for static assets

---

## Migration Path

### From Vercel/Neon to Self-Hosted

1. **Export data from Neon:**
```bash
pg_dump <neon_connection_string> > production_backup.sql
```

2. **Deploy Docker stack**

3. **Import data:**
```bash
docker exec -i evidence-db psql -U evidence_user evidencedb < production_backup.sql
```

4. **Update DNS** to point to your server

5. **Test thoroughly**

6. **Decommission cloud deployment**

---

## Support

- Repository: https://github.com/scott-andrew-reid/evidence-property-manager
- Issues: https://github.com/scott-andrew-reid/evidence-property-manager/issues

---

**Built for forensic analysts. Deployable anywhere.** ⚖️
