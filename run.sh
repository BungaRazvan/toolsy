#!/bin/bash
set -e

cd /home/pi/projects/toolsy

echo "Stopping containers..."
docker compose down || true

echo "Loading image..."
docker load -i toolsy.tar

echo "Starting services..."
docker compose up -d --force-recreate

echo "Cleaning unused images..."
docker image prune -a -f

echo "Done."%