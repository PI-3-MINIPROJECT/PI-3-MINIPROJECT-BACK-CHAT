# Render Deployment Guide

This guide explains how to deploy the Chat Server to Render.

## Prerequisites

- GitHub account
- Render account (free tier available)
- Firebase project configured

## Deployment Steps

### Step 1: Prepare Repository

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit: Chat server"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `PI-3-MINIPROJECT-BACK-CHAT`

### Step 3: Configure Service

Render will auto-detect the `render.yaml` file, but you can also configure manually:

**Basic Settings:**
- **Name:** `pi-3-chat-server` (or your preferred name)
- **Region:** Oregon (or closest to your users)
- **Branch:** `main`
- **Root Directory:** Leave empty (or specify if in a subdirectory)

**Build Settings:**
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Plan:**
- Select **"Free"** (or paid plan for production)

### Step 4: Environment Variables

Click on **"Environment"** tab and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `4000` | Optional (Render uses its own port) |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Your Firebase private key | **See note below** |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase client email | Required |
| `FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket | Required |
| `CORS_ORIGIN` | Your frontend URL(s) | **Important for production** |
| `MAX_PARTICIPANTS` | `10` | Optional (default: 10) |
| `MIN_PARTICIPANTS` | `2` | Optional (default: 2) |

#### Important: Firebase Private Key Format

The `FIREBASE_PRIVATE_KEY` must include actual newlines. In Render, paste it as:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(your key here)
...
-----END PRIVATE KEY-----
```

**OR** use this format with `\n`:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

#### CORS_ORIGIN Examples

Single origin:
```
https://your-app.vercel.app
```

Multiple origins (comma-separated):
```
https://your-app.vercel.app,https://app2.vercel.app,http://localhost:5173
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build TypeScript
   - Start the server
3. Wait for deployment to complete (~3-5 minutes)

### Step 6: Verify Deployment

Once deployed, Render will provide a URL like:
```
https://pi-3-chat-server.onrender.com
```

Test the deployment:

1. **Health Check:**
```bash
curl https://pi-3-chat-server.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "chat-server",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

2. **Root Endpoint:**
```bash
curl https://pi-3-chat-server.onrender.com/
```

3. **Stats Endpoint:**
```bash
curl https://pi-3-chat-server.onrender.com/api/chat/stats
```

### Step 7: Update Frontend Configuration

Update your frontend to use the new chat server URL:

```javascript
// Frontend config
const CHAT_SERVER_URL = 'https://pi-3-chat-server.onrender.com';

const socket = io(CHAT_SERVER_URL, {
  withCredentials: true,
});
```

## Automatic Deployments

Render automatically deploys when you push to the connected branch:

```bash
git add .
git commit -m "Update chat features"
git push origin main
```

Render will:
1. Detect the push
2. Rebuild the service
3. Deploy the new version
4. Zero-downtime deployment (on paid plans)

## Monitoring

### View Logs

1. Go to Render Dashboard
2. Select your service
3. Click **"Logs"** tab
4. View real-time logs

### Check Metrics

1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## Troubleshooting

### Build Failures

**Error: `MODULE_NOT_FOUND`**
```bash
# Solution: Clear build cache
# In Render Dashboard → Settings → Clear Build Cache
```

**Error: TypeScript compilation failed**
```bash
# Solution: Check tsconfig.json and fix TypeScript errors locally first
npm run build
```

### Runtime Errors

**Error: Firebase initialization failed**
- Check environment variables
- Verify Firebase private key format
- Ensure Firebase project exists

**Error: CORS policy**
- Update `CORS_ORIGIN` environment variable
- Include your frontend URL
- Restart the service

**Error: Connection timeout**
- Render free tier spins down after 15 minutes of inactivity
- First request may take 30-60 seconds (cold start)
- Consider upgrading to paid plan for always-on service

### Socket.io Connection Issues

**Problem: Socket.io not connecting**

1. Verify WebSocket support is enabled (it is by default on Render)
2. Check CORS configuration
3. Ensure frontend is using correct URL
4. Check browser console for errors

**Problem: "connect_error"**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

Solutions:
- Verify server is running (check health endpoint)
- Check CORS_ORIGIN includes your frontend URL
- Ensure Socket.io versions match (client and server)

## Performance Optimization

### For Production

1. **Enable HTTP/2:**
   - Render automatically enables HTTP/2

2. **Use Connection Pooling:**
   - Already implemented in Firebase Admin SDK

3. **Monitor Performance:**
   ```javascript
   // Add performance monitoring in production
   socket.on('connect', () => {
     const latency = Date.now() - socket.io.engine.pingInterval;
     console.log('Latency:', latency, 'ms');
   });
   ```

4. **Upgrade Plan:**
   - Free tier: 512 MB RAM, spins down
   - Starter: 1 GB RAM, always on
   - Standard: 2 GB RAM, more CPU

## Scaling Considerations

### Horizontal Scaling (Multiple Instances)

For high traffic, you'll need Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

Update `src/config/socket.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

Add to Render:
- Provision Redis instance
- Add `REDIS_URL` environment variable

### Vertical Scaling

Upgrade Render plan for more resources.

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` to Git
   - Use Render's environment variables
   - Rotate Firebase keys regularly

2. **CORS:**
   - Never use `*` in production
   - Specify exact frontend URLs

3. **Rate Limiting:**
   Consider adding in production:
   ```bash
   npm install express-rate-limit
   ```

4. **Firebase Security Rules:**
   ```javascript
   // Firestore rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /meetings/{meetingId}/messages/{messageId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

## Cost Considerations

### Free Tier Limitations

- 750 hours/month (enough for 1 service)
- 512 MB RAM
- Spins down after 15 min inactivity
- 100 GB bandwidth/month

### Paid Plans

- **Starter ($7/month):**
  - Always on
  - 1 GB RAM
  - Better performance

- **Standard ($25/month):**
  - 2 GB RAM
  - More CPU
  - Priority support

## Backup and Recovery

### Database Backup

Firebase Firestore has automatic backups. For additional safety:

1. Enable Firestore exports:
```bash
gcloud firestore export gs://your-bucket
```

2. Schedule regular backups

### Code Backup

- Keep code in GitHub
- Tag releases:
```bash
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

## Support

- **Render Documentation:** https://render.com/docs
- **Socket.io Documentation:** https://socket.io/docs/v4/
- **Firebase Documentation:** https://firebase.google.com/docs

## Checklist

Before going to production:

- [ ] Environment variables configured
- [ ] Firebase credentials correct
- [ ] CORS origins set properly
- [ ] Health check endpoint working
- [ ] Socket.io connections tested
- [ ] Frontend integration tested
- [ ] Error handling verified
- [ ] Logs monitored
- [ ] Performance tested
- [ ] Security reviewed

---

**Ready to deploy!** 🚀

