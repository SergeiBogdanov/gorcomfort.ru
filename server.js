const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { loadEnvFile } = require("./server/env");
const { handleLeadRequest } = require("./server/lead-handler");

loadEnvFile(path.join(__dirname, ".env"));

const rootDir = __dirname;
const publicFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/services.html", "services.html"],
  ["/shop.html", "shop.html"],
  ["/useful", "useful.html"],
  ["/useful.html", "useful.html"],
  ["/articles.html", "useful.html"],
  ["/404.html", "404.html"],
]);

const publicDirectories = ["/assets/", "/css/", "/js/", "/pages/"];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function isSafePath(filePath) {
  return filePath.startsWith(rootDir);
}

function resolveStaticPath(urlPathname) {
  if (publicFiles.has(urlPathname)) {
    return path.join(rootDir, publicFiles.get(urlPathname));
  }

  if (publicDirectories.some((directory) => urlPathname.startsWith(directory))) {
    return path.join(rootDir, urlPathname.slice(1));
  }

  return null;
}

function serveStaticFile(filePath, response, statusCode = 200) {
  if (!filePath || !isSafePath(filePath)) {
    sendJson(response, 404, { ok: false, error: "Not found" });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 404, { ok: false, error: "Not found" });
        return;
      }

      sendJson(response, 500, { ok: false, error: "Failed to read file" });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(statusCode, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });
    response.end(data);
  });
}

function serveNotFoundPage(response) {
  const filePath = path.join(rootDir, "404.html");

  fs.readFile(filePath, "utf8", (error, data) => {
    if (error) {
      sendJson(response, 404, { ok: false, error: "Not found" });
      return;
    }

    response.writeHead(404, {
      "Content-Type": mimeTypes[".html"],
    });
    response.end(data.replace("<head>", '<head>\n  <base href="/" />'));
  });
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function handleArticlesRequest(response) {
  const articlesDir = path.join(rootDir, "assets", "data", "articles");

  try {
    const entries = await fs.promises.readdir(articlesDir, { withFileTypes: true });
    const articleFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json") && entry.name !== "index.json")
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "ru"));

    const articles = await Promise.all(
      articleFiles.map(async (fileName) => {
        const raw = await fs.promises.readFile(path.join(articlesDir, fileName), "utf8");
        return JSON.parse(raw);
      })
    );

    sendJson(response, 200, { ok: true, articles });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: "Failed to load articles" });
  }
}

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response);

  if (!request.url || !request.method) {
    sendJson(response, 400, { ok: false, error: "Bad request" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, "http://localhost");

  if (request.method === "POST" && url.pathname === "/api/leads") {
    await handleLeadRequest(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/articles") {
    await handleArticlesRequest(response);
    return;
  }

  if (request.method === "GET") {
    const filePath = resolveStaticPath(url.pathname);
    if (filePath) {
      serveStaticFile(filePath, response);
      return;
    }

    serveNotFoundPage(response);
    return;
  }

  sendJson(response, 405, { ok: false, error: "Method not allowed" });
});

const port = Number(process.env.PORT) || 3000;

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
