FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports (handled by Coolify proxy, but good for documentation)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
