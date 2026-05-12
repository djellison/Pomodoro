# Use the lightweight nginx alpine image
FROM nginx:alpine

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the app into the nginx web root
COPY pomodoro.html /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# nginx runs in the foreground by default in this image
CMD ["nginx", "-g", "daemon off;"]
