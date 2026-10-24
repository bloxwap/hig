#!/bin/sh
set -eu
exec "$HIG_WEBKIT_EXECUTABLE" -AppleKeyboardUIMode 3 "$@"
