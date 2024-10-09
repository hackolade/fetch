#!/bin/bash
set -e

service dbus start >> /dev/null &
dbus-daemon --session --address=$DBUS_SESSION_BUS_ADDRESS --nofork --nopidfile --syslog-only &
exec xvfb-run --auto-servernum --server-args="-screen 0 800x600x24" "$@"
