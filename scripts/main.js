(() => {
  setTimeout(() => {
    main();
  }, 2000);
})();

ws = new WebSocket("wss://chess-api.com/v1");
ws.onmessage = (event) => {
  const chessApiMessage = JSON.parse(event.data);
  console.log(chessApiMessage);

  const board = document.querySelector(".board-layout-bottom");
  const div = document.createElement("div");

  div.classList.add("chess-cheat");
  document
    .querySelectorAll(".chess-cheat")
    .forEach((element) => element.remove());

  if (!board) return;

  if (chessApiMessage.type === "bestmove") {
    const p = document.createElement("p");

    p.innerText = chessApiMessage.text;
    p.innerText += "\nWinning chance: " + chessApiMessage.winChance;
    div.appendChild(p);

    div.style.color = "#fff";

    p.style.fontSize = "20px";
    p.style.padding = "10px";
    p.style.fontFamily = "Roboto";
    p.style.letterSpacing = "1px";

    board.after(div);
  }
};

const main = () => {
  console.log(`------------------START------------------`);
  const FEN = parseToFEN();

  ws.send(
    JSON.stringify({
      fen: FEN,
      variants: 3,
    })
  );

  observeChanges();
};

const observeChanges = () => {
  const chessBoard = document.querySelector(".board");

  const mutationCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes") {
        const FEN = parseToFEN();

        ws.send(
          JSON.stringify({
            fen: FEN,
            variants: 3,
          })
        );
      }
    }
  };

  const config = {
    attributes: true,
    childList: false,
    subtree: false,
  };

  const observer = new MutationObserver(mutationCallback);
  observer.observe(chessBoard, config);
};

// ! - - - - - - - - - - - PARSER - - - - - - - - - - -
/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} PieceObject
 * @property {String} color
 * @property {String} type
 * @property {Position} position
 */

function getPieces() {
  let array = [];

  const board = document.querySelector(".board");
  const children = board.children;
  const childrenArray = Array.from(children);

  for (const child of childrenArray) {
    if (child.classList.contains("piece")) {
      array.push(child);
    }
  }

  return parsePieces(array);
}

/**
 * @param {Array<Element>} pieces
 */
function parsePieces(pieces) {
  /**
   * @type {Object.<number, Array<PieceObject>>}
   */
  const boardPositions = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
  };

  pieces.forEach((piece) => {
    /**
     * @type {PieceObject}
     */
    const obj = {
      color: "",
      type: "",
      position: {},
    };

    const types = piece.className.match(/[bw][a-z]/g)[0];
    obj.color = types[0];
    obj.type = obj.color === "w" ? types[1].toUpperCase() : types[1];

    const position = piece.className.match(/\d{2}/i)[0];

    obj.position = {
      x: parseInt(position[0]),
      y: parseInt(position[1]),
    };

    boardPositions[obj.position.y].push(obj);
  });

  for (let i in boardPositions) {
    boardPositions[i].sort((a, b) => a.position.x - b.position.x);
  }

  return boardPositions;
}

/**
 * @param {Array<PieceObject>} pieces
 */
function getMoveColor(pieces) {
  const lastMoves = Array.from(document.querySelectorAll(".highlight"));
  let color;
  lastMoves.forEach((el) => {
    let lastMove = el.className.match(/\d{2}/)[0];

    let x = parseInt(lastMove[0]);
    let y = parseInt(lastMove[1]);

    for (let obj of pieces[y]) {
      if (obj.position.x === x) {
        color = obj.color;
      }
    }
  });

  return color === "b" ? " w" : " b";
}

/**
 *
 * @param {Array<PieceObject>} array
 * @param {PieceObject} obj
 *
 * @returns {String} FEN
 */

function parseToFEN() {
  const pieces = getPieces();
  let FEN = "";

  for (let i = 8; i > 0; i--) {
    let subFEN = "";
    let prev = 1;

    for (let piece of pieces[i]) {
      let diff = piece.position.x - prev;
      prev = piece.position.x + 1;

      subFEN += diff <= 0 ? "" : diff;
      subFEN += piece.type;

      if (pieces[i].indexOf(piece) === pieces[i].length - 1) {
        let lastDiff = 8 - piece.position.x;
        subFEN += lastDiff === 0 ? "" : lastDiff;
      }
    }

    if (subFEN === "") {
      subFEN = "8";
    }

    FEN += subFEN;
    FEN += i === 1 ? "" : "/";
  }

  return FEN + getMoveColor(pieces) + " - - 0 1";
}
