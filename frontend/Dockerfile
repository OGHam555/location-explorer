FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_ 変数はNext.jsのビルド時にクライアントバンドルへ埋め込まれるため、
# コンテナ起動時の environment ではなく、ビルド時の ARG として渡す必要がある。
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
