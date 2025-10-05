#!/bin/bash
set -e  

docker buildx build --platform linux/arm/v7 -t toolsy:latest .

docker save -o toolsy.tar toolsy:latest