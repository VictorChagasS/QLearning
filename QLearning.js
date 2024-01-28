//CLASSE PARA REPRESENTAR O MAPA

class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.map = this.generateMap();
    this.agent = { x: 0, y: this.height - 1 };
    this.updateAgentPosition();
    this.additionalPositions = [];
  }

  //GERA O MAP

  generateMap() {
    const map = [];
    for (let i = 0; i < this.height; i++) {
      map.push(Array(this.width).fill("#"));
    }
    return map;
  }

  //RESETA O MAP
  resetMap() {
    this.agent = { x: 0, y: this.height - 1 }; // Return to the bottom-right corner

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.map[i][j] !== "V" && this.map[i][j] !== "X") {
          this.map[i][j] = "#";
        }
      }
    }

    this.updateAgentPosition();

    return { x: this.agent.x, y: this.agent.y };
  }

  //UTUALIZA O AGENTE NO MAPA, ELE É UM PONTO
  updateAgentPosition() {
    this.map[this.agent.y][this.agent.x] = "•";
  }

  //DISPLAY O MAPA

  displayMap() {
    for (let i = 0; i < this.height; i++) {
      console.log(this.map[i].join(" "));
    }
  }

  //DECIDE O DESTINO DO AGENTE
  setDestination(x, y) {
    if (this.isValidPosition(x, y)) {
      this.map[y][x] = "V";
      this.additionalPositions.push({ obj: "V", position: { x, y } });
    } else {
      console.log("Posição de destino inválida.");
    }
  }

  //ADICIONA ARMADILHAS

  addTrap(x, y) {
    if (this.isValidPosition(x, y)) {
      this.map[y][x] = "X";
      this.additionalPositions.push({ obj: "X", position: { x, y } });
    } else {
      console.log("Posição de armadilha inválida");
    }
  }

  //POSICAO É VALIDA

  isValidPosition(x, y) {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      this.map[y][x] === "#"
    );
  }

  //MOVIMENTA O AGENTE
  moveAgent(direction) {
    if (this.map[this.agent.y][this.agent.x] == "•")
      this.map[this.agent.y][this.agent.x] = "#";

    switch (direction) {
      case 0:
        this.agent.y = Math.max(0, this.agent.y - 1);
        break;
      case 1:
        this.agent.x = Math.min(this.width - 1, this.agent.x + 1);
        break;
      case 2:
        this.agent.y = Math.min(this.height - 1, this.agent.y + 1);
        break;
      case 3:
        this.agent.x = Math.max(0, this.agent.x - 1);
        break;
      default:
        console.log("Direção inválida.");
        break;
    }

    // CHECA RECOMPENSA E SE É FINAL DE GAME
    let reward = 0;
    let end = false;
    const currentPosition = this.map[this.agent.y][this.agent.x];
    if (currentPosition === "X") {
      reward = -100;
    } else if (currentPosition === "V") {
      reward = 100;
      end = true;
    } else {
      this.updateAgentPosition();
    }

    return { newstate: this.agent, reward: reward, end: end };
  }
}

//CLASSE QLEARNING PRINCIPAL
class QLearning {
  constructor(width, height, initValue = 0, epsilon, alpha, gamma) {
    this.width = width;
    this.height = height;
    this.initValue = initValue;
    this.qMatrix = this.initQMatrix();
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.gamma = gamma;
  }

  //INICIALIZA A MATRIZ COM INITVALUE
  initQMatrix() {
    const qMatrix = [];
    for (let i = 0; i < this.height; i++) {
      const row = [];
      for (let j = 0; j < this.width; j++) {
        row.push([
          this.initValue,
          this.initValue,
          this.initValue,
          this.initValue,
        ]);
      }
      qMatrix.push(row);
    }
    return qMatrix;
  }

  //RETORNA UM Q VALUE

  getQValue(x, y, action) {
    return this.qMatrix[y][x][action];
  }

  //RETORNA O MAIOR Q VALUE
  getMaxQValue(x, y) {
    const max = this.qMatrix[y][x].reduce(function (a, b) {
      return Math.max(a, b);
    }, -Infinity);

    return max;
  }

  //Retorna aleatoriamente o índice de um valor máximo na matriz Q para uma posição específica (x, y)
  getMaxQValueIndex(x, y) {
    const maxValue = this.getMaxQValue(x, y);

    const indicesOfMaxValue = this.qMatrix[y][x]
      .map((value, index) => (value === maxValue ? index : null))
      .filter((index) => index !== null);
    const randomlySelectedIndex =
      indicesOfMaxValue[Math.floor(Math.random() * indicesOfMaxValue.length)];

    return randomlySelectedIndex;
  }

  //Pega uma acao aleatoria

  getRandomAction() {
    return Math.floor(Math.random() * 4);
  }

  getAction(x, y) {
    if (Math.random() < this.epsilon) {
      return this.getRandomAction();
    } else {
      return this.getMaxQValueIndex(x, y);
    }
  }

  setQValue(x, y, action, value) {
    this.qMatrix[y][x][action] = value;
  }

  //FUNCAO PRINCIPAL DE ATUALIZACAO DE VALOR DE ESTADO, implementa a atualização do valor na matriz Q para a transição de estado (x, y) para (xNew, yNew) após realizar uma determinada action, com base na recompensa (reward) recebida. A atualização segue a fórmula de atualização Q-learning, considerando uma taxa de aprendizado (alpha) e um fator de desconto (gamma).

  update(x, y, action, xNew, yNew, reward) {
    this.qMatrix[y][x][action] +=
      this.alpha *
      (reward +
        this.gamma * this.getMaxQValue(xNew, yNew) -
        this.qMatrix[y][x][action]);
  }

  //IMPRIME A MATRIZ PURA
  printQMatrix() {
    for (let i = 0; i < this.height; i++) {
      const row = this.qMatrix[i].map((position) => `[${position.join(" ")}]`);
      console.log(row.join(" "));
    }
  }

  //IMPRIME A TABELA COM  COM OS VALORES NA MATRIZ Q PARA CADA ACAO E ESTADO ORGANIZADA
  printQTable() {
    console.log("Pos\t|\tUp\t|\tRight\t|\tDown\t|\tLeft\t|");
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        console.log(
          `${i},${j}\t|\t${this.qMatrix[i][j][0].toFixed(2)}\t|\t${this.qMatrix[
            i
          ][j][1].toFixed(2)}\t|\t${this.qMatrix[i][j][2].toFixed(
            2
          )}\t|\t${this.qMatrix[i][j][3].toFixed(2)}\t|`
        );
      }
    }
  }

  //IMPRIME O MAPA COM A POLÍTICA ADOTADA PELO AGENTE, SPECIFICPOSITION SE REFERE AS POSICOES DE ITENS ESPECIFICOS COMO ARMADILHAS, DESTINOS
  printPolicy(specificPositions) {
    console.log("----".repeat(this.width) + "-");
    for (let i = 0; i < this.height; i++) {
      process.stdout.write("|");
      for (let j = 0; j < this.width; j++) {
        const specificPosition = specificPositions.find(
          (pos) => pos.position.x === j && pos.position.y === i
        );

        if (specificPosition) {
          process.stdout.write(" " + specificPosition.obj + " |");
        } else {
          const best = this.getMaxQValueIndex(j, i);
          process.stdout.write(" " + "↑→↓←"[best] + " |");
        }
      }
      console.log("\n" + "----".repeat(this.width) + "-");
    }
  }
}

//TAMANHO DO MAPA

const W = 9;
const H = 9;
const episodes = 10000;
const map = new Map(W, H);
map.setDestination(2, 0);
map.addTrap(1, 0);
map.addTrap(1, 1);
map.addTrap(2, 2);
map.addTrap(3, 0);
map.displayMap();
const ql = new QLearning(W, H, 0, 0.5, 0.8, 0.4);

//LOOP DE APRENDIZADO COM 1000 EPISODIOS
for (let i = 0; i < episodes; i++) {
  let state = map.resetMap();
  for (let step = 0; step < W * H; step++) {
    const action = ql.getAction(state.x, state.y);
    const { newstate, reward, end } = map.moveAgent(action);

    ql.update(state.x, state.y, action, newstate.x, newstate.y, reward, end);
    state.x = newstate.x;
    state.y = newstate.y;

    if (end) {
      break;
    }
  }
}

ql.printQTable();
ql.printPolicy(map.additionalPositions);
