import redraw, { HEIGHT, WIDTH } from "./drawer.js";
import { generateFull, removeInfo } from "./generate.js";
import { fillPossible, getDifficulty, pruneSmall, solve } from "./solver.js";
import {
  addToHistory,
  addWholeToHistory,
  isSmall,
  numbers,
  resetHistory,
  setImmutableNumber,
  smallCheckBox,
  svgElement,
  userselect,
} from "./store.js";
import { getEmptyCell, range } from "./utils.js";

export const hitNumber = (number) => {
  if (userselect.current === undefined) return;

  if (
    numbers.current[userselect.current[1]][userselect.current[0]].type ===
    "fixed"
  )
    return;

  let oldCell = numbers.current[userselect.current[1]][userselect.current[0]];

  if (isSmall.current) {
    if (oldCell.type === "userFull") {
      oldCell = getEmptyCell();
    } else {
      oldCell = { type: "userSmall", value: new Set([...oldCell.value]) };
    }

    if (oldCell.value.has(number)) {
      oldCell.value.delete(number);
    } else {
      oldCell.value.add(number);
    }

    addToHistory(userselect.current[1], userselect.current[0], oldCell);

    return;
  }

  if (oldCell.type === "userFull" && oldCell.value === number) {
    addToHistory(userselect.current[1], userselect.current[0], getEmptyCell());

    return;
  }

  addWholeToHistory(
    pruneSmall(
      setImmutableNumber(
        userselect.current[1],
        userselect.current[0],
        numbers.current,
        { type: "userFull", value: number }
      )
    )
  );
};

const addSvgClick = () => {
  svgElement.addEventListener("click", (event) => {
    const boundingRect = svgElement.getBoundingClientRect();
    const relativeX = event.clientX - boundingRect.x;
    const relativeY = event.clientY - boundingRect.y;
    const newSelect = [
      Math.max(Math.min(Math.floor((9 * relativeX) / WIDTH), 8), 0),
      Math.max(Math.min(Math.floor((9 * relativeY) / HEIGHT), 8), 0),
    ];

    if (
      userselect.current === undefined ||
      userselect.current[0] !== newSelect[0] ||
      userselect.current[1] !== newSelect[1]
    ) {
      userselect.current = newSelect;
    } else {
      userselect.current = undefined;
    }
    redraw();
  });
};

const addNumberButtonClick = () => {
  range(1, 10).forEach((buttonNumber) => {
    const button = document.getElementById(`b${buttonNumber}`);
    button.addEventListener("click", () => {
      hitNumber(buttonNumber);
    });
  });
};

const addXButtonClick = () => {
  const removeButton = document.getElementById("bX");
  removeButton.addEventListener("click", () => {
    if (userselect.current === undefined) return;

    if (
      numbers.current[userselect.current[1]][userselect.current[0]].type ===
      "fixed"
    )
      return;

    addToHistory(userselect.current[1], userselect.current[0], getEmptyCell());
  });
};

const addFillPossibleClick = () => {
  const fillPossibleButton = document.getElementById("fillPossible");

  fillPossibleButton.addEventListener("click", () => {
    addWholeToHistory(fillPossible(numbers.current));
  });
};

const addSolveNextClick = () => {
  const solveNextButton = document.getElementById("nextSolve");

  solveNextButton.addEventListener("click", () => {
    addWholeToHistory(solve(numbers.current, 1).numbers);
  });
};

const addToFixClick = () => {
  const tofixButton = document.getElementById("tofix");

  tofixButton.addEventListener("click", () => {
    resetHistory(
      numbers.current.map((row) =>
        row.map((cell) => {
          const { type, value } = cell;

          if (type === "userSmall") return cell;

          return { type: "fixed", value };
        })
      )
    );

    document.getElementById("actualDifficulty").innerHTML = `Difficulty: ${
      getDifficulty(numbers.current).difficulty
    }`;
  });
};

const addGenerateClick = () => {
  const generateButton = document.getElementById("generate");

  generateButton.addEventListener("click", () => {
    resetHistory(
      removeInfo(
        generateFull(),
        Number(document.getElementById("difficulty").value),
        "remove"
      )
    );
  });
};

const addSmallCheckbox = () => {
  smallCheckBox.addEventListener("change", () => {
    isSmall.current = !isSmall.current;
  });
};

const addMouseInteractions = () => {
  addSvgClick();
  addNumberButtonClick();
  addXButtonClick();
  addFillPossibleClick();
  addToFixClick();
  addGenerateClick();
  addSmallCheckbox();
  addSolveNextClick();
};

export default addMouseInteractions;
