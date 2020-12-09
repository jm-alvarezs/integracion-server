const socketIo = require("socket.io");
const express = require("express");
const http = require("http");
const port = 5000;
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const { Game } = require("./classes");

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5500",
    credentials: true,
  },
});

const palabras = ["integracion", "battleship", "moviles"];

let game = null;

let room = null;

const allowedOrigins = ["http://localhost:5500", "*", null];

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
    if (room === null) {
      const index = Math.ceil(Math.random() * palabras.length);
      room = palabras[index];
      const nsp = io.of(`/${room}`);
      game = new Game(nsp, room);
    }
    res.status(200).send({ room });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

server.listen(port, () => {
  console.log(`Battleship running on port ${port}`);
});
