#!/bin/bash
set -e  

docker buildx build \
  --platform linux/arm/v7 \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from=type=local,src=.buildx-cache \
  --cache-to=type=local,dest=.buildx-cache-new \
  -t toolsy:latest .

mv .buildx-cache-new .buildx-cache

docker save -o toolsy.tar toolsy:latest