#!/bin/bash
set -e  

export DOCKER_BUILDKIT=1

docker buildx build \
  --platform linux/arm/v7 \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from=type=local,src=.buildx-cache \
  --cache-to=type=local,dest=.buildx-cache-new,mode=max \
  -t toolsy:latest .

# Replace cache safely
rm -rf .buildx-cache
mv .buildx-cache-new .buildx-cache

docker save -o toolsy.tar toolsy:latest