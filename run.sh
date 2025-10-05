#!/bin/bash
set -e

docker rm toolsy -f

docker load -i toolsy.tar

docker run -d \
    --name toolsy
    --env-file /home/pi/projects/toolsy.env \
    -v /home/pi/projects/toolsy/database.sqlite:/app/database.sqlite

docker exec -it toolsy npm dev