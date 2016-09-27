#!/bin/sh

nohup ./collect-node-process-data.sh &

node --nouse_idle_notification --max_old_space_size=4096 --initial_old_space_size=2048 --min_semi_space_size=128 --max_semi_space_size=512 app.js
