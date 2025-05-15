# Development Guidelines

## Server Management

### Starting Development Server
1. **ALWAYS** check ports before starting:
   ```bash
   lsof -i :8888,3000 | grep LISTEN
   ```
2. If ports are in use:
   - ASK the user before killing processes
   - Offer alternative ports if killing is not desired
   - NEVER assume it's okay to kill processes

3. **Correct startup sequence**:
   ```bash
   npx netlify dev
   ```
   - Frontend (Next.js) runs on port 3000 (targetPort)
   - Netlify Dev runs on port 8888 (port)
   - Access site via http://localhost:8888
   - DO NOT use port 3000 directly

4. **Port configuration** (netlify.toml):
   - `port`: Must be different from targetPort (default: 8888)
   - `targetPort`: Next.js port (default: 3000)
   - NEVER set them to the same value

### Netlify Functions
- Create a new Netlify function for each distinct API endpoint
- Name functions based on their specific endpoint or functionality (e.g., `zoho-proxy`, `address-lookup`, `contact-search`)
- Avoid combining multiple API endpoints into a single function
- Keep functions focused and single-purpose for better maintainability and debugging

## Troubleshooting
1. If server won't start:
   - Check port conflicts first
   - Verify netlify.toml configuration
   - Look for error messages in console
   - Check process status

2. If Netlify Functions aren't working:
   - Ensure you're accessing via port 8888
   - Check function logs in console
   - Verify function file exists in netlify/functions/
   - Test endpoint with curl or Postman

## Best Practices
1. Always use `npx netlify dev` for development
2. Never run Next.js server directly when working with Netlify Functions
3. Always check console for function execution logs
4. Keep port configuration consistent in netlify.toml

(Add more best practices here as they are established) 