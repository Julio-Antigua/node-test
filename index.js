import express from "express";
import http from "http";
import morgan from "morgan";
import { Server as SocketServer } from "socket.io";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PORT } from "./config.js";
import cors from "cors";

// Initializations
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const server = http.createServer(app);

// Configuración de Socket.IO con CORS habilitado
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5173",  // Permitir solo conexiones desde tu frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,  // Si utilizas cookies o autenticación basada en sesión
  },
});

// Middlewares
app.use(cors());  // Habilitar CORS en Express
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(resolve(__dirname, "../frontend/dist")));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Lista de usuarios conectados
let connectedUsers = [];

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Agregar usuario a la lista
  connectedUsers.push(socket.id);
  // Emitir lista de usuarios conectados
  io.emit("updateUserList", connectedUsers);

  // Manejar mensajes
  socket.on("message", (body) => {
    socket.broadcast.emit("message", {
      body,
      from: socket.id.slice(8),  // Extrae un identificador simple del socket
    });
  });

  // Manejar desconexiones
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Eliminar el usuario de la lista al desconectarse
    connectedUsers = connectedUsers.filter(id => id !== socket.id);
    // Emitir lista de usuarios actualizada
    io.emit("updateUserList", connectedUsers);
  });
});

// Arrancar servidor
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
