FROM ubuntu:latest
LABEL authors="kouax"

ENTRYPOINT ["top", "-b"]