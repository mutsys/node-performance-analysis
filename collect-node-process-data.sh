#!/bin/sh

measure () {

  timestamp=$(date "+%s")
  node_stats=$(ps -o "comm pcpu rss" | grep node | grep -v grep | tr -s ' ' | cut -d ' ' -f 2,3)
  pcpu=$(echo "$node_stats" | cut -d ' ' -f 1)
  mem=$(echo "$node_stats" | cut -d ' ' -f 2)
  memm=$(( mem / 1024 ))

  if [[ ! -z $pcpu ]]
  then
    echo "$timestamp,$pcpu,$memm" >> "node-process-stats.csv"
  fi

}

while (( 1 ))
do
  measure
  sleep 2
done
