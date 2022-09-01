import redraw from "./drawer.js";
import { getEmptyCell, range } from "./utils.js";

export const svgElement = document.getElementById("board");
export const smallCheckBox = document.getElementById("smallcheck");

export const userselect = { current: undefined };
export const numbers = {
  current: range(9).map((_) => range(9).map((_) => getEmptyCell())),
};
export const isSmall = { current: false };
export const history = { current: [numbers.current], index: 0 };

export const setImmutableNumber = (rowIndex, columnIndex, ns, cell) =>
  ns.map((row, ri) =>
    row.map((oldCell, ci) =>
      ri === rowIndex && ci === columnIndex ? cell : oldCell
    )
  );

export const addToHistory = (rowIndex, columnIndex, cell) => {
  history.current = history.current.slice(0, history.index + 1);
  numbers.current = setImmutableNumber(
    rowIndex,
    columnIndex,
    numbers.current,
    cell
  );
  history.current.push(numbers.current);
  history.index += 1;
  redraw();
};

export const addWholeToHistory = (newNumbers) => {
  history.current = history.current.slice(0, history.index + 1);
  numbers.current = newNumbers;
  history.current.push(numbers.current);
  history.index += 1;
  redraw();
};

export const undo = () => {
  if (history.index === 0) return;

  history.index--;
  numbers.current = history.current[history.index];
  redraw();
};

export const redo = () => {
  if (history.index + 1 === history.current.length) return;

  history.index++;
  numbers.current = history.current[history.index];
  redraw();
};

export const resetHistory = (newNumbers) => {
  history.current = [newNumbers];
  history.index = 0;
  numbers.current = newNumbers;
  redraw();
};
