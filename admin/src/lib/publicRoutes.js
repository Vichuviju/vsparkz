export const publicRoutes = [
    "/login", 
    "/set-password", 
    "/forgot-password", 
    "/reset-password",
  ];
  
  export function isPublicRoute(pathname) {
    // Check exact matches first
    if (publicRoutes.includes(pathname)) {
      return true;
    }
  
    // Check dynamic routes
    for (const route of publicRoutes) {
      if (route.includes('[') && route.includes(']')) {
        // Convert dynamic route pattern to regex
        const pattern = route
          .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [id] with [^/]+
          .replace(/\//g, '\\/'); // Escape forward slashes
        
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(pathname)) {
          return true;
        }
      }
    }
  
    return false;
  }
  
  