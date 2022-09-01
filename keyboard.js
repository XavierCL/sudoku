import {
  isSmall,
  numbers,
  redo,
  smallCheckBox,
  undo,
  addWholeToHistory,
  userselect,
  addToHistory,
} from "./store.js";
import { fillPossible, solve } from "./solver.js";
import { getEmptyCell } from "./utils.js";
import { hitNumber } from "./userInteraction.js";

const addKeyboardShortcuts = () => {
  document.addEventListener("keypress", (event) => {
    if (event.target.matches("input")) return;

    if (event.key === "s") {
      isSmall.current = !isSmall.current;
      smallCheckBox.checked = isSmall.current;
      return;
    }

    if (
      event.ctrlKey &&
      (event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey))
    ) {
      redo();
      return;
    }

    if (event.ctrlKey && event.code === "KeyZ" && !event.shiftKey) {
      undo();
      return;
    }

    if (event.key === "f") {
      addWholeToHistory(fillPossible(numbers.current));
    }

    if (event.key === "n") {
      addWholeToHistory(solve(numbers.current, 1).numbers);
    }

    if (event.key === "m") {
      addWholeToHistory(solve(numbers.current, -1).numbers);
    }

    if (userselect.current === undefined) return;

    if (
      numbers.current[userselect.current[1]][userselect.current[0]].type ===
      "fixed"
    )
      return;

    const numberKey = Number(event.key);

    if (Number.isNaN(numberKey) && event.key !== "x") return;

    if (numberKey === 0 || event.key === "x") {
      addToHistory(
        userselect.current[1],
        userselect.current[0],
        getEmptyCell()
      );
    } else {
      hitNumber(numberKey);
    }
  });
};

export default addKeyboardShortcuts;
