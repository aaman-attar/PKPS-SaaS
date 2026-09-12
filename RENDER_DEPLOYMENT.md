# Deployment Guide: Uploading PKPS SaaS to Render.com

This guide provides step-by-step instructions to deploy the **Django Backend** and **React Frontend** as separate, connected services on [Render.com](https://render.com).

---

## Method 1: Automatic Deployment using Render Blueprint (Recommended)

Since we created a [`render.yaml`](file:///d:/VsCode%20Projects/PKPS%20Project/PKPS%20SaaS/render.yaml) file, Render can automatically detect and deploy both services together.

### Step 1: Commit and Push your changes to GitHub
In your PowerShell terminal:
```powershell
git add .
git commit -m "Configure production settings and render.yaml for Render deployment"
git push origin main
```

### Step 2: Create a Blueprint on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click the **New +** button in the top right.
3. Select **Blueprint**.
4. Connect your GitHub account and select your repository: **`aaman-attar/PKPS-SaaS`**.
5. Render will automatically detect `render.yaml` and display 2 services to be created:
   - `pkps-saas-backend` (Web Service)
   - `pkps-saas-frontend` (Static Site)
6. Click **Apply**.
7. Render will build and deploy both services automatically!

---

## Method 2: Manual Deployment on Render

If you prefer to create each service manually on Render:

### Deploying the Backend (Django Web Service)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository `aaman-attar/PKPS-SaaS`.
3. Configure the service:
   - **Name**: `pkps-saas-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
4. Add **Environment Variables**:
   - `SECRET_KEY`: `your-random-secret-key`
   - `DEBUG`: `False`
   - `USE_SQLITE`: `True`
   - `CORS_ALLOWED_ORIGINS`: `https://pkps-saas-frontend.onrender.com` (replace with your frontend URL once created)
5. Click **Create Web Service**. Note down your Backend URL (e.g. `https://pkps-saas-backend.onrender.com`).

---

### Deploying the Frontend (React Static Site)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect your GitHub repository `aaman-attar/PKPS-SaaS`.
3. Configure the service:
   - **Name**: `pkps-saas-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_BASE_URL`: `https://pkps-saas-backend.onrender.com/api/v1` (use your actual backend URL)
5. Add **Rewrite Rule** under Settings -> Redirects/Rewrites:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Create Static Site**.

---

## Verification & URLs
- **Backend API**: `https://<your-backend-name>.onrender.com/api/health/`
- **Frontend App**: `https://<your-frontend-name>.onrender.com/`
