FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.mjs ./

ENV CMTE_HOST=0.0.0.0
ENV CMTE_PORT=8741

EXPOSE 8741

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8741/health || exit 1

CMD ["node", "server.mjs"]
