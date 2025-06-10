/**
 * Main server entry point
 */
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes/api';
import { setupDatabase, retryDatabaseConnection, isDatabaseConnected } from './database/connection';
import { config } from './config';
import fs from 'fs';
import path from 'path';

// Create Express app
const app = express();

// Read server port from external file if available
let PORT: number;
try {
  const serverPortPath = path.join(__dirname, '../../.server-port');
  if (fs.existsSync(serverPortPath)) {
    PORT = parseInt(fs.readFileSync(serverPortPath, 'utf8').trim());
    console.log(`Using port ${PORT} from .server-port file`);
  } else {
    PORT = parseInt(process.env.PORT || config.PORT.toString());
  }
} catch (error) {
  PORT = parseInt(process.env.PORT || config.PORT.toString());
  console.log(`Using default port ${PORT}`);
}

// Apply middleware
app.use(express.json());
app.use(cors()); // CORS for all routes

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '../../frontend');
const frontendStaticPath = path.join(frontendPath, '.next/static');
const frontendPublicPath = path.join(frontendPath, 'public');

// Serve Next.js static files
if (fs.existsSync(frontendStaticPath)) {
  app.use('/_next/static', express.static(frontendStaticPath));
  console.log('Serving Next.js static files from:', frontendStaticPath);
}

// Serve public assets
if (fs.existsSync(frontendPublicPath)) {
  app.use(express.static(frontendPublicPath));
  console.log('Serving public assets from:', frontendPublicPath);
}

// Backend API routes
app.use('/api', apiRouter);

// Health check endpoint - works even without database
app.get('/health', (req, res) => {
  const dbStatus = isDatabaseConnected() ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  const requestPath = req.path;
  let htmlFile = 'index.html';
  
  // Map specific routes to their corresponding HTML files
  if (requestPath === '/jordi') {
    htmlFile = 'jordi.html';
  } else if (requestPath === '/chat') {
    htmlFile = 'chat.html';
  } else if (requestPath === '/404') {
    htmlFile = '404.html';
  } else if (requestPath.startsWith('/jordi/story/')) {
    // Dynamic route for story pages
    htmlFile = 'jordi/story/[storyId].html';
  }
  
  const targetPath = path.join(frontendPath, '.next/server/pages', htmlFile);
  
  if (fs.existsSync(targetPath)) {
    res.sendFile(targetPath);
  } else {
    // Try default index.html
    const indexPath = path.join(frontendPath, '.next/server/pages/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback to a simple response if frontend files aren't available
      const dbStatus = isDatabaseConnected() ? 
        'Database: ✅ Connected' : 
        'Database: ⚠️  Retrying connection...';
        
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>StoryMine - Historical Research Platform</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
              .container { max-width: 600px; margin: 0 auto; text-align: center; }
              .logo { font-size: 2em; margin-bottom: 20px; color: #9d4edd; }
              .status { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .api-link { color: #9d4edd; text-decoration: none; }
              .api-link:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🧬 StoryMine</div>
              <h1>Historical Research Platform</h1>
              <div class="status">
                <h3>✅ Backend API is Running</h3>
                <p>The StoryMine backend is successfully deployed and operational.</p>
                <p>${dbStatus}</p>
                <p>API Health: <a href="/api/health" class="api-link">/api/health</a></p>
                <p>Database Stats: <a href="/api/database/stats" class="api-link">/api/database/stats</a></p>
              </div>
              <p><em>Ready for StoryMap Intelligence data import</em></p>
            </div>
          </body>
        </html>
      `);
    }
  }
});

// Start the server
const startServer = async () => {
  try {
    // Try to setup database connection, but don't fail if it doesn't work
    await setupDatabase();
    
    // Start background retry if database connection failed
    if (!isDatabaseConnected()) {
      console.log('⏰ Starting background database reconnection attempts...');
      setInterval(retryDatabaseConnection, 30000); // Retry every 30 seconds
    }
    
    // Try to start on provided port
    const tryPort = (port: number): Promise<number> => {
      return new Promise((resolve, reject) => {
        const server = app.listen(port)
          .once('listening', () => {
            server.removeAllListeners('error');
            resolve(port);
          })
          .once('error', (err: any) => {
            server.removeAllListeners('listening');
            if (err.code === 'EADDRINUSE') {
              console.log(`⚠️ Port ${port} is in use, trying port ${port + 1} instead...`);
              tryPort(port + 1).then(resolve, reject);
            } else {
              reject(err);
            }
          });
      });
    };
    
    // Try to start server
    const actualPort = await tryPort(PORT);
    console.log(`🚀 StoryMine server running on port ${actualPort}`);
    console.log(`📡 API Health: http://localhost:${actualPort}/api/health`);
    console.log(`📊 Database Stats: http://localhost:${actualPort}/api/database/stats`);
    console.log(`🌐 Frontend: http://localhost:${actualPort}`);
    console.log(`💬 Jordi Chat: http://localhost:${actualPort}/api/chat`);
    
    if (isDatabaseConnected()) {
      console.log(`✅ Ready to serve 2.56+ million StoryMap Intelligence records`);
    } else {
      console.log(`⚠️  Database connection pending - will automatically connect when AWS Security Group allows Railway`);
    }
    
    // Write the port back to the port file if we had to change it
    if (actualPort !== PORT) {
      fs.writeFileSync(path.join(__dirname, '../../.server-port'), actualPort.toString());
      console.log(`Updated .server-port file with port ${actualPort}`);
    }
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

// Launch server
startServer(); 