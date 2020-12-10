class Game {
  nsp;
  room;
  first;
  second;
  atacado;
  atacante;

  constructor(nsp, room) {
    this.nsp = nsp;
    this.room = room;
    this.first = null;
    this.second = null;
    this.atacado = null;
    this.atacante = null;

    nsp.on("connection", (socket) => {
      const first = this.getFirst();
      const second = this.getSecond();
      const jugador = new Jugador(socket);
      if (first === null) {
        this.setFirst(jugador);
      } else if (second === null) {
        this.setSecond(jugador);
      }

      jugador.socket.on("start", (tablero) => {
        const primero = this.getFirst();
        const segundo = this.getSecond();
        if (socket.id === primero.socket.id) {
          primero.setTablero(tablero);
        } else if (segundo !== null) {
          segundo.setTablero(tablero);
          this.startGame();
        }
      });

      jugador.socket.emit("start");

      jugador.socket.on("disparo", (data) => {
        const { x, y } = data;
        const atacado = this.getAtacado();
        const atacante = this.getAtacante();
        const valid = this.validarDisparo(x, y);
        if (valid) {
          const scored = this.disparar(x, y, atacado);
          if (scored) {
            atacado.emit("impacto", data);
            atacante.emit("exito", data);
            const finished = this.juegoTerminado();
            if (finished) {
              atacante.emit("ganador", { razon: "fin" });
              atacado.emit("perdedor", { razon: "fin" });
            } else {
              atacante.emit("turno");
            }
          } else {
            atacante.emit("fracaso", data);
            atacado.emit("salvado", data);
            this.setAtacado(atacante);
            this.setAtacante(atacado);
            atacado.emit("turno");
          }
        } else {
          atacante.emit("perdedor", { razon: "tiro invalido" });
          atacado.emit("ganador", { razon: "tiro invalido" });
        }
      });
    });
  }

  getFirst() {
    return this.first;
  }

  getSecond() {
    return this.second;
  }

  getAtacado() {
    return this.atacado;
  }

  getAtacante() {
    return this.atacante;
  }

  setFirst(socket) {
    this.first = socket;
  }

  setSecond(socket) {
    this.second = socket;
  }

  setAtacado(jugador) {
    this.atacado = jugador;
  }

  setAtacante(jugador) {
    this.atacante = jugador;
  }

  startGame() {
    setTimeout(() => {
      const { atacante, atacado } = this.generarTurno();
      this.setAtacado(atacado);
      this.setAtacante(atacante);
      atacante.socket.emit("turno");
    }, 1000);
  }

  generarTurno() {
    const index = Math.floor(Math.random() * 2);
    let atacante;
    let atacado;
    if (index === 1) {
      atacante = this.getFirst();
      atacado = this.getSecond();
    } else {
      atacante = this.getSecond();
      atacado = this.getFirst();
    }
    return { atacante, atacado };
  }

  validarDisparo(x, y) {
    return x < 10 && x > -1 && y < 10 && y > -1;
  }

  disparar(x, y, atacado) {
    const matriz = atacado.getMatriz();
    let scored = false;
    if (matriz[y][x] === "+") {
      scored = true;
      atacado.hitShip(y, x);
    }
    return scored;
  }

  juegoTerminado() {
    const atacado = this.getAtacado();
    if (atacado.defeated()) {
      return true;
    }
    return false;
  }
}

class Jugador {
  socket;
  tablero;
  matriz;

  constructor(socket) {
    this.socket = socket;
  }

  getSocket() {
    return this.socket;
  }

  getTablero() {
    return this.tablero;
  }

  getMatriz() {
    return this.matriz;
  }

  setTablero(tablero) {
    this.tablero = tablero;
    this.matriz = this.generarMatriz(tablero);
  }

  emit(evento, data) {
    const socket = this.getSocket();
    socket.emit(evento, data);
  }

  generarMatriz(tablero) {
    const matriz = [];
    for (let i = 0; i < 10; i++) {
      matriz.push([]);
      for (let j = 0; j < 10; j++) {
        matriz[i][j] = "-";
      }
    }
    Object.keys(tablero).forEach((barco) => {
      const { yi, yf, xi, xf } = tablero[barco];
      for (let i = yi; i <= yf; i++) {
        for (let j = xi; j <= xf; j++) {
          matriz[i][j] = "+";
        }
      }
    });
    return matriz;
  }

  hitShip(x, y) {
    this.matriz[x][y] = "-";
  }

  hasShip(x, y, tablero) {
    let placeShip = false;
    Object.keys(tablero).forEach((nave) => {
      if (x >= nave.xi && x <= nave.xf) {
        if (y >= nave.yi && y <= nave.yf) {
          placeShip = true;
        }
      }
    });
    return placeShip;
  }

  defeated() {
    let naves = 0;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (this.matriz[i][j] === "+") {
          naves++;
        }
      }
    }
    return naves === 0;
  }
}

module.exports = { Game, Jugador };
