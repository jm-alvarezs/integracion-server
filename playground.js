function generarMatriz() {
  const barcos = {
    portaaviones: 5,
    acorazado: 4,
    destructor: 3,
    submarino: 3,
    patrullero: 2,
  };
  const tableroLocal = new Array(10).fill(new Array(10).fill("-"));
  const tableroInicialServer = {};
  Object.keys(barcos).forEach((barco) => {
    tableroInicialServer[barco] = {};
    const orientation = Math.random() < 0.5; //0 horizontal, 1 vertical
    const limit = 10 - barcos[barco];
    let disponible = false;
    let start = 0;
    let end = 0;
    if (orientation) {
      //vertical
      while (!disponible) {
        start = Math.floor(Math.random() * 10) + 0;
        end = Math.floor(Math.random() * limit) + 0;
        //console.log(start, end);
        for (let i = 0; i < barcos[barco]; i++) {
          if (tableroLocal[start][end + i] === "-") {
            disponible = true;
          } else {
            disponible = false;
            break;
          }
        }
      }
      for (let i = 0; i < barcos[barco]; i++) {
        tableroLocal[start][end + i] = `${start}-${end + i}-${barcos[barco]}-0`;
      }
      tableroInicialServer[barco].xi = start;
      tableroInicialServer[barco].yi = end;
      tableroInicialServer[barco].xf = start;
      tableroInicialServer[barco].yf = end + barcos[barco] - 1;
      console.log(tableroInicialServer);
    } else {
      //horizontal
      while (!disponible) {
        start = Math.floor(Math.random() * limit) + 0; //y axis
        end = Math.floor(Math.random() * 10) + 0;
        for (let i = 0; i < barcos[barco]; i++) {
          if (tableroLocal[start + i][end] === "-") {
            disponible = true;
          } else {
            disponible = false;
            break;
          }
        }
      }
      for (let i = 0; i < barcos[barco]; i++) {
        tableroLocal[start + i][end] = `${start + i}-${end}-${barcos[barco]}-0`;
      }
      tableroInicialServer[barco].xi = start;
      tableroInicialServer[barco].yi = end;
      tableroInicialServer[barco].xf = start + barcos[barco] - 1;
      tableroInicialServer[barco].yf = end;
    }
  });
  return [tableroLocal, tableroInicialServer];
}

console.log(generarMatriz());
