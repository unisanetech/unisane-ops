FROM postgres:16-bookworm

RUN apt-get update \
  && apt-get install --yes --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/unisane-ops
COPY deploy/hosted/postgres-tools/*.sh ./
COPY deploy/hosted/postgres-tools/*.mjs ./
RUN mkdir /backup && chown postgres:postgres /backup

USER postgres
