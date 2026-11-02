#!/usr/bin/env bash
# Needs the SSH key unlocked first: ssh-add --apple-use-keychain ~/.ssh/id_ed25519
set -Eeuo pipefail
H=oldseadogs-production; cd "$(dirname "$0")"
ssh $H 'cd /var/www/oldseadogs/current && npm run backup:create -- --label pre-lake-yard-removal && ls -lt /var/www/Oldseadogsbackups | head -3'
ssh $H 'cp -a /etc/nginx/sites-available/oldseadogs /root/oldseadogs.nginx.bak-$(date +%Y%m%d-%H%M)'
scp unpublish-lake-yard.mjs nginx-lake-yard.conf $H:/tmp/
ssh $H 'OLDSEADOGS_DATA_DIR=/var/www/oldseadogs-data node /tmp/unpublish-lake-yard.mjs && OLDSEADOGS_DATA_DIR=/var/www/oldseadogs-data node /tmp/unpublish-lake-yard.mjs --apply'
ssh $H 'install -m644 /tmp/nginx-lake-yard.conf /etc/nginx/snippets/oldseadogs-lake-yard.conf && grep -q oldseadogs-lake-yard /etc/nginx/sites-available/oldseadogs || sed -i "0,/location \/ {/s//include snippets\/oldseadogs-lake-yard.conf;\n    location \/ {/" /etc/nginx/sites-available/oldseadogs; nginx -t && systemctl reload nginx'
sleep 5
curl -sI https://oldseadogs.com/guides/poole-harbour/lake-yard-marina | grep -iE "^HTTP|^location"
curl -s https://oldseadogs.com/guides/poole-harbour | grep -ci lake-yard || true
curl -s https://oldseadogs.com/sitemap.xml | grep -ci lake-yard || true
curl -s https://oldseadogs.com/llms.txt | grep -ci lake-yard || true
for g in brownsea-island cobbs-quay-marina parkstone-bay-marina poole-quay-boat-haven port-of-poole-marina salterns-marina sandbanks; do printf "%s " $g; curl -so /dev/null -w "%{http_code}\n" https://oldseadogs.com/guides/poole-harbour/$g; done
