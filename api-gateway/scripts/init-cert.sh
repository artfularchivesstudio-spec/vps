#!/bin/bash
docker run --rm -it   -v api-gateway-complete-actions_certbot-etc:/etc/letsencrypt   -v api-gateway-complete-actions_certbot-var:/var/lib/letsencrypt   certbot/certbot certonly --standalone   -d api-router.cloud -d www.api-router.cloud   --non-interactive --agree-tos -m you@example.com
