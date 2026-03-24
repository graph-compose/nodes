// Helper function to clean up route paths
export const cleanPath = (path: string): string => {
  // Remove regex patterns and clean up the path
  return path
    .replace(/\?(?=\/|$)/g, "") // Remove optional path markers
    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":param") // Replace param patterns
    .replace(/\(\?=\/\|\$\)/g, "") // Remove lookaheads
    .replace(/\\\//g, "/") // Replace escaped slashes
    .replace(/\/\?\$/g, "") // Remove trailing optional slash
    .replace(/^\^/, "") // Remove start anchor
    .replace(/\$\/?/g, "") // Remove end anchor
    .replace(/\/+/g, "/") // Replace multiple slashes with a single one
    .replace(/\/$/g, ""); // Remove trailing slash
};

// Helper function to get all routes from a router
export const getRoutes = (router: any, basePath = ""): any[] => {
  if (!router.stack) return [];

  return router.stack.reduce((routes: any[], layer: any) => {
    if (layer.route) {
      // It's a route
      const path =
        basePath + (layer.route.path === "/" ? "" : layer.route.path);
      const methods = Object.keys(layer.route.methods).map((method) =>
        method.toUpperCase(),
      );
      routes.push({ path, methods });
    } else if (layer.name === "router" && layer.handle.stack) {
      // It's a sub-router
      let path = basePath;

      // Extract the path from the regexp
      if (layer.regexp) {
        const regexStr = layer.regexp.toString();
        let pathFragment = "";

        // Try to extract the path from the regex
        if (regexStr.includes("/^")) {
          pathFragment = regexStr.split("/^")[1].split("\\/?")[0];
          pathFragment = cleanPath(pathFragment);

          if (pathFragment && !pathFragment.startsWith("/")) {
            pathFragment = "/" + pathFragment;
          }
        }

        path += pathFragment;
      }

      routes = routes.concat(getRoutes(layer.handle, path));
    } else if (layer.name === "bound dispatch" && layer.handle.router) {
      // It's a mounted router (app.use)
      let path = basePath;

      // Extract the path from the regexp
      if (layer.regexp) {
        const regexStr = layer.regexp.toString();
        let pathFragment = "";

        // Try to extract the path from the regex
        if (regexStr.includes("/^")) {
          pathFragment = regexStr.split("/^")[1].split("\\/?")[0];
          pathFragment = cleanPath(pathFragment);

          if (pathFragment && !pathFragment.startsWith("/")) {
            pathFragment = "/" + pathFragment;
          }
        }

        path += pathFragment;
      }

      routes = routes.concat(getRoutes(layer.handle.router, path));
    }
    return routes;
  }, []);
};
