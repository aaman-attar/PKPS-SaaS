# Connecting Aiven Cloud Database to PKPS SaaS on Render

This guide explains how to connect your **Aiven Managed Cloud Database** (PostgreSQL or MySQL) to your **Django Backend** running on Render.com.

---

## Step 1: Copy Service URI from Aiven Console

1. Go to your [Aiven Console](https://console.aiven.io).
2. Select your database service (PostgreSQL or MySQL) under project `aamanattar01-63af`.
3. Under the **Overview** tab, locate the **Service URI** field.
4. Click **Copy** to copy the full connection URI. It will look like one of the following:

   - **PostgreSQL**:
     `postgres://avnadmin:your_password@your-aiven-db.aivencloud.com:12345/defaultdb?sslmode=require`
   
   - **MySQL**:
     `mysql://avnadmin:your_password@your-aiven-db.aivencloud.com:12345/defaultdb?sslmode=REQUIRED`

---

## Step 2: Add DATABASE_URL on Render

### Option A: During Blueprint Creation / Sync
When Render syncs your [`render.yaml`](file:///d:/VsCode%20Projects/PKPS%20Project/PKPS%20SaaS/render.yaml), it will prompt you for `DATABASE_URL`. Paste your copied Aiven Service URI into the input box and click **Apply**.

### Option B: On Existing Render Web Service
If your `pkps-saas-backend` service is already created:
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click your **`pkps-saas-backend`** Web Service.
3. Click **Environment** in the left sidebar.
4. Add or update the environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgres://avnadmin:your_password@your-aiven-db.aivencloud.com:12345/defaultdb?sslmode=require`
   - **Key**: `USE_SQLITE`
   - **Value**: `False`
5. Click **Save Changes**.

---

## Step 3: Verify Deployment
Once saved, Render will automatically trigger a new deployment.
In the build logs, you will see:
```text
==> Running build command 'cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate'...
Operations to perform:
  Apply all migrations: accounts, audit, governance, loans, members, shares, tenants, etc.
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying accounts.0001_initial... OK
  ...
```

Your database schema and all tables are now live on your **Aiven Cloud Database**!
