###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22.9-bullseye As build

RUN apt-get update && apt-get install -y openssl certbot
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Create certs directory
RUN mkdir -p /app/certs

# Generate a self-signed certificate for HTTPS. You can replace this with a real certificate in production
RUN mkdir -p /app/certs
RUN openssl genrsa -des3 -passout pass:x -out /app/certs/server.pass.key 2048 && \
    openssl rsa -passin pass:x -in /app/certs/server.pass.key -out /app/certs/server.key && \
    rm /app/certs/server.pass.key && \
    openssl req -new -key /app/certs/server.key -out /app/certs/server.csr \
        -subj "/C=US/ST=CA/L=SF/O=Trench/OU=IT Department/CN=trench.dev" && \
    openssl x509 -req -days 3650 -in /app/certs/server.csr -signkey /app/certs/server.key -out /app/certs/server.crt && \
    chown -R node:node /app/certs

COPY --chown=node:node ./package.json ./

RUN pnpm install

# Bundle app source
COPY --chown=node:node . .
RUN chown -R node:node /app/certs
RUN mkdir -p /app/dist
RUN chown -R node:node /app/dist

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:22.9-bullseye As production-build

RUN apt-get update && apt-get install -y openssl certbot
RUN npm install -g pnpm

WORKDIR /app

# Create certs directory
RUN mkdir -p /app/certs

COPY --chown=node:node ./package*.json /app/

# In order to run `pnpm run build` we need access to the Nest CLI which is a dev dependency.
# In the previous development stage we ran `pnpm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/certs /app/certs
COPY --chown=node:node ./ ./

RUN pnpm build

# Set NODE_ENV environment variable

ENV NODE_ENV production



###################
# PRODUCTION RUN
###################

FROM node:22.9-bullseye As production

# RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=production-build /app/node_modules /app/node_modules
COPY --chown=node:node --from=production-build /app/dist /app/dist
COPY --chown=node:node --from=production-build /app/certs /app/certs

USER node

