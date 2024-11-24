#!/bin/sh
set -e
trap 'kill -TERM $PID' TERM INT
if [ -z "$PYTHON_BACKEND_URL" ]; then
  PYTHON_BACKEND_URL="$1"
fi
if [ -z "$FRONTEND_PORT" ]; then
  FRONTEND_PORT="$2"
fi
if [ -z "$JAVA_BACKEND_URL" ]; then
  JAVA_BACKEND_URL="$3"
fi
if [ -z "$FRONTEND_PORT" ]; then
  FRONTEND_PORT="5173"
fi
if [ -z "$PYTHON_BACKEND_URL" ]; then
  echo "PYTHON_BACKEND_URL must be set as an environment variable or as first parameter. (e.g. http://localhost:7860)"
  exit 1
fi
if [ -z "$JAVA_BACKEND_URL" ]; then
  echo "JAVA_BACKEND_URL must be set as an environment variable or as first parameter. (e.g. http://localhost:8080)"
  exit 1
fi
echo "PYTHON_BACKEND_URL: $Python_BACKEND_URL"
echo "FRONTEND_PORT: $FRONTEND_PORT"
echo "JAVA_BACKEND_URL: $JAVA_BACKEND_URL"
sed -i "s|__PYTHON_BACKEND_URL__|$PYTHON_BACKEND_URL|g" /etc/nginx/conf.d/default.conf
sed -i "s|__FRONTEND_PORT__|$FRONTEND_PORT|g" /etc/nginx/conf.d/default.conf
sed -i "s|__JAVA_BACKEND_URL__|$JAVA_BACKEND_URL|g" /etc/nginx/conf.d/default.conf
cat /etc/nginx/conf.d/default.conf


# Start nginx
exec nginx
