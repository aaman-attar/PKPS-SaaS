import os
from pathlib import Path
from datetime import timedelta
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
dotenv.load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-pkps-saas-key-2026')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

ALLOWED_HOSTS = [host.strip() for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com').split(',') if host.strip()]
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # PKPS SaaS System Apps
    'apps.tenants',
    'apps.accounts',
    'apps.members',
    'apps.shares',
    'apps.loans',
    'apps.deposits',
    'apps.accounting',
    'apps.reports',
    'apps.audit',
    'apps.governance',
    'apps.documents',
    'apps.notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Tenant Isolation Middleware
    'apps.tenants.middleware.TenantIsolationMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
USE_MYSQL = os.getenv('USE_MYSQL', 'False').lower() in ('true', '1', 't')

if DATABASE_URL:
    try:
        import dj_database_url
        is_aiven = 'aiven' in DATABASE_URL.lower()
        ssl_require = is_aiven or os.getenv('DB_SSL_REQUIRE', 'False').lower() in ('true', '1', 't')

        # Clean URL if it contains 'ssl-mode' or 'sslmode' which mysqlclient doesn't accept as keyword arg
        cleaned_url = DATABASE_URL
        for param in ['?ssl-mode=REQUIRED', '&ssl-mode=REQUIRED', '?sslmode=require', '&sslmode=require', '?ssl-mode=REQUIRED', '&ssl-mode=REQUIRED']:
            cleaned_url = cleaned_url.replace(param, '')

        db_config = dj_database_url.config(
            default=cleaned_url,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=ssl_require,
        )

        # Sanitize OPTIONS dictionary for mysqlclient / MySQLdb compatibility
        options = db_config.get('OPTIONS', {})
        options.pop('ssl-mode', None)
        options.pop('sslmode', None)

        if 'mysql' in db_config.get('ENGINE', ''):
            if is_aiven or ssl_require:
                options['ssl'] = {'ssl_mode': 'REQUIRED'}
            options['charset'] = 'utf8mb4'

        db_config['OPTIONS'] = options
        DATABASES = {'default': db_config}
    except Exception as e:
        DATABASE_URL = None


if not DATABASE_URL:
    if USE_MYSQL and os.getenv('DB_HOST'):
        db_name = os.getenv('DB_NAME', 'pkps_db')
        db_user = os.getenv('DB_USER', 'root')
        db_pass = os.getenv('DB_PASSWORD', '')
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = int(os.getenv('DB_PORT', '3306'))

        # Auto-create MySQL database if it doesn't exist
        try:
            import MySQLdb
            _conn = MySQLdb.connect(host=db_host, user=db_user, passwd=db_pass, port=db_port)
            _cursor = _conn.cursor()
            _cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            _cursor.close()
            _conn.close()
        except Exception:
            pass

        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': db_name,
                'USER': db_user,
                'PASSWORD': db_pass,
                'HOST': db_host,
                'PORT': str(db_port),
                'OPTIONS': {
                    'charset': 'utf8mb4',
                    'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                },
            }
        }
    else:
        # Default safe fallback: SQLite (prevents build failure on Render if DATABASE_URL is missing)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }


AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.getenv('JWT_SECRET', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1', 't')
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Fast2SMS Configuration (India Instant SMS Gateway)
FAST2SMS_API_KEY = os.getenv('FAST2SMS_API_KEY', '').strip()
_fast2sms_enabled_env = os.getenv('FAST2SMS_ENABLED', 'False').lower() in ('true', '1', 't')
_invalid_keys = {'YOUR_FAST2SMS_API_KEY_HERE', 'your_actual_fast2sms_api_key_here', 'YOUR_API_KEY', ''}
FAST2SMS_ENABLED = _fast2sms_enabled_env and (FAST2SMS_API_KEY not in _invalid_keys)

