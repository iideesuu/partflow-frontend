FROM partflow-frontend-build:qa
USER root
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN apk add --no-cache chromium font-noto-cjk \
 && npm install --prefix /tmp/browserqa playwright@1.58.2 --registry=$NPM_REGISTRY
COPY qa/bom-browser.mjs /qa/bom-browser.mjs
CMD ["sh", "-ec", "./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 >/tmp/vite.log 2>&1 & server_pid=$!; trap 'kill $server_pid' EXIT; sleep 1; node /qa/bom-browser.mjs"]
