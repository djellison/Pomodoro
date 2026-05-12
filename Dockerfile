# Use the lightweight nginx alpine image
FROM nginx:alpine

# Upgrade curl/libcurl to 8.19.0+ to patch CVE-2026-3805
# (use-after-free in SMB connection reuse, fixed in curl 8.19.0)
# The stable Alpine repo still ships 8.17.0, so we pull curl from edge.
RUN echo "@edge https://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories \
    && apk add --no-cache curl@edge libcurl@edge

# Upgrade nghttp2-libs to 1.68.1+ to patch CVE-2026-27135
# (DoS via assertion failure on malformed HTTP/2 frames, fixed in 1.68.1)
RUN apk update && apk upgrade --no-cache nghttp2-libs

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the app into the nginx web root
COPY pomodoro.html /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# nginx runs in the foreground by default in this image
CMD ["nginx", "-g", "daemon off;"]
