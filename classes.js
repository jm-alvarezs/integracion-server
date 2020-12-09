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
              setTimeout(() => {
                atacante.emit("turno");
              }, 1000);
            }
          } else {
            atacante.emit("fracaso", data);
            atacado.emit("salvado", data);
            setTimeout(() => {
              atacado.emit("turno");
            }, 1000);
            this.setAtacado(atacante);
            this.setAtacante(atacado);
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
    return x < 10 && x > 0 && y < 10 && y > 0;
  }

  disparar(x, y, atacado) {
    const tablero = atacado.getTablero();
    let scored = false;
    Object.keys(tablero).forEach((nombre) => {
      const nave = tablero[nombre];
      if (x >= nave.xi && x <= nave.xf) {
        if (y >= nave.yi && y <= nave.yf) {
          scored = true;
          atacado.hitShip(x, y);
        }
      }
    });
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

  setTablero(tablero) {
    this.tablero = tablero;
    this.matriz = this.generarMatriz(tablero);
  }

  emit(evento, data) {
    const socket = this.getSocket();
    socket.emit(evento, data);
  }

  generarMatriz(tablero) {
    Object.keys(tablero).forEach((barco) => {
      const orientation = Math.random() < 0.5; //0 horizontal, 1 vertical
      const limit = 10 - barco.tam;
      let disponible = false;
      let start = 0;
      let end = 0;
      if (orientation) {
        //vertical
        while (!disponible) {
          start = Math.floor(Math.random() * 10) + 0;
          end = Math.floor(Math.random() * limit) + 0;
          for (let i = 0; i < barco.tam; i++) {
            if (tableroLocal[start][end + i].includes("nn")) {
              disponible = true;
            } else {
              disponible = false;
              break;
            }
          }
        }
        for (let i = 0; i < barco.tam; i++) {
          tableroLocal[start][end + i] = `${start}-${end + i}-${barco.barco}-0`;
        }
        tableroInicialServer[serverShip].xi = start;
        tableroInicialServer[serverShip].yi = end;
        tableroInicialServer[serverShip].xf = start;
        tableroInicialServer[serverShip].yf = end + barco.tam - 1;
      } else {
        //horizontal
        while (!disponible) {
          start = Math.floor(Math.random() * limit) + 0; //y axis
          end = Math.floor(Math.random() * 10) + 0;
          for (let i = 0; i < barco.tam; i++) {
            if (tableroLocal[start + i][end].includes("nn")) disponible = true;
            else {
              disponible = false;
              break;
            }
          }
        }
        for (let i = 0; i < barco.tam; i++) {
          tableroLocal[start + i][end] = `${start + i}-${end}-${barco.barco}-0`;
        }
        tableroInicialServer[serverShip].xi = start;
        tableroInicialServer[serverShip].yi = end;
        tableroInicialServer[serverShip].xf = start + barco.tam - 1;
        tableroInicialServer[serverShip].yf = end;
      }
    });
    return [tableroLocal, tableroInicialServer];
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
    return Object.keys(this.getTablero()).length === 0;
  }

  destroyShip(nombre) {
    delete this.tablero[nombre];
  }
}

module.exports = { Game, Jugador };
