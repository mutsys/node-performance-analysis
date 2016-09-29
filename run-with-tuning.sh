#!/bin/sh

ps -aef | grep grunt | grep -v grep | tr -s " " | cut -d " " -f 3 | while read pid
do
  kill $pid
done

ps -aef | grep collect-node-process-data | grep -v grep | tr -s " " | cut -d " " -f 3 | while read pid
do
  kill $pid
done

rm *csv

nohup ./collect-node-process-data.sh &

node --nouse_idle_notification --gc_global --max_old_space_size=4096 --initial_old_space_size=2048 --min_semi_space_size=64 --max_semi_space_size=256 app.js
