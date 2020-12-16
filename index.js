const socketIo = require("socket.io");
const express = require("express");
const http = require("http");
const port = 5500;
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const { Game } = require("./classes");

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: true,
  },
});

const palabras = [
  "integracion",
  "battleship",
  "moviles",
  "juanma",
  "orlando",
  "chris",
  "karla",
  "irving",
  "udem",
  "amarillo",
  "troyanos",
];

const rooms = new Map();

let game = null;

let room = null;

const allowedOrigins = [
  "http://localhost:5500",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "*",
  null,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin || origin === null) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin: " +
          origin;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.get("/room", (req, res) => {
  try {
    if (room === null || rooms.get(room) === 2) {
      let index = Math.ceil(Math.random() * palabras.length);
      room = palabras[index];
      while (rooms.has(room)) {
        index = Math.ceil(Math.random() * palabras.length);
        room = palabras[index];
      }
      rooms.set(room, 0);
      const nsp = io.of(`/${room}`);
      game = new Game(nsp, room);
    }
    rooms.set(room, rooms.get(room) + 1);
    res.status(200).send({ room });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

server.listen(port, () => {
  console.log(`Battleship running on port ${port}`);
});
