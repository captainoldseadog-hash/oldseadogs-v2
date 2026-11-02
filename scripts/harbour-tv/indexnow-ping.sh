#!/bin/sh
# Pings IndexNow with Harbour TV URLs. Only runs when INDEXNOW_KEY is set AND HTV_LIVE=1 (go-live). Staging never pings.
[ "$HTV_LIVE" = "1" ] && [ -n "$INDEXNOW_KEY" ] || { echo "indexnow: skipped (staging)"; exit 0; }
URLS=$(sed 's/.*/"&"/' "$1" | paste -sd, -)
curl -s -o /dev/null -w "indexnow %{http_code}\n" -H 'Content-Type: application/json' https://api.indexnow.org/indexnow \
 -d "{\"host\":\"oldseadogs.com\",\"key\":\"$INDEXNOW_KEY\",\"keyLocation\":\"https://oldseadogs.com/$INDEXNOW_KEY.txt\",\"urlList\":[$URLS]}"
