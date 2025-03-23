import { numbers, svgElement, userselect } from "./store.js";
import { range, getSquareIndex, getNumbersInError } from "./utils.js";

export const WIDTH = 400;
export const HEIGHT = 400;

const boardDrawer = () => {
  const baseline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  const horizontals = range(10).map((index) => {
    const line = baseline.cloneNode();
    line.setAttribute("x1", 3);
    line.setAttribute("x2", WIDTH - 3);
    line.setAttribute("y1", index * ((HEIGHT - 6) / 9) + 3);
    line.setAttribute("y2", index * ((HEIGHT - 6) / 9) + 3);
    line.setAttribute("stroke", "black");
    if (index % 3 === 0) line.setAttribute("stroke-width", 2);
    return line;
  });

  const verticals = range(10).map((index) => {
    const line = baseline.cloneNode();
    line.setAttribute("x1", index * ((WIDTH - 6) / 9) + 3);
    line.setAttribute("x2", index * ((WIDTH - 6) / 9) + 3);
    line.setAttribute("y1", 3);
    line.setAttribute("y2", HEIGHT - 3);
    line.setAttribute("stroke", "black");
    if (index % 3 === 0) line.setAttribute("stroke-width", 2);
    return line;
  });

  return horizontals.concat(verticals);
};

const numberDrawer = (numbers, numbersInError) => {
  const basetext = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  const cellWidth = (WIDTH - 6) / 9;
  const cellHeight = (HEIGHT - 6) / 9;
  const drawings = numbers.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      const { type, value } = cell;

      if (type === "userSmall") {
        return [...value].map((number) => {
          const text = basetext.cloneNode();
          const baseX = (columnIndex + 0.05) * cellWidth + 3;
          const baseY = (rowIndex + 0.3) * cellHeight + 3;
          text.setAttribute(
            "x",
            baseX + ((number - 1) % 3) * (cellWidth / 2 - 8)
          );
          text.setAttribute(
            "y",
            baseY + Math.floor((number - 1) / 3) * (cellHeight / 2 - 8)
          );
          text.innerHTML = number.toString();
          return text;
        });
      }

      const text = basetext.cloneNode();
      text.setAttribute("x", (columnIndex + 0.35) * cellWidth + 3);
      text.setAttribute("y", (rowIndex + 0.7) * cellHeight + 3);
      text.setAttribute("font-size", "25");
      text.innerHTML = value.toString();

      if (type === "fixed") {
        text.setAttribute("fill", "#449");
      }

      if (numbersInError[rowIndex][columnIndex]) {
        text.setAttribute("fill", "red");
      }

      return [text];
    })
  );

  return drawings;
};

const userDrawer = (userselect, numbers) => {
  if (userselect === undefined) {
    return [];
  }

  const baserect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );

  const getRect = (x, y, color) => {
    const rect = baserect.cloneNode();
    rect.setAttribute("x", (x * (WIDTH - 6)) / 9 + 3 + 1);
    rect.setAttribute("y", (y * (HEIGHT - 6)) / 9 + 3 + 1);
    rect.setAttribute("width", (WIDTH - 6) / 9 - 2);
    rect.setAttribute("height", (HEIGHT - 6) / 9 - 2);
    rect.setAttribute("fill", color);
    return rect;
  };

  const drawings = [getRect(userselect[0], userselect[1], "#DDF")];

  const { type: selectedType, value: selectedNumber } =
    numbers[userselect[1]][userselect[0]];

  if (selectedType !== "userSmall") {
    const markedRows = new Set();
    const markedColumns = new Set();
    const markedSquares = new Set();

    numbers.forEach((row, rowIndex) =>
      row.forEach(({ value }, columnIndex) => {
        if (value === selectedNumber) {
          markedRows.add(rowIndex);
          markedColumns.add(columnIndex);
          markedSquares.add(getSquareIndex(columnIndex, rowIndex));

          if (columnIndex !== userselect[0] || rowIndex !== userselect[1]) {
            drawings.push(getRect(columnIndex, rowIndex, "#AAA"));
          }
        }
      })
    );

    range(9).forEach((rowIndex) =>
      range(9).forEach((columnIndex) => {
        if (numbers[rowIndex][columnIndex].value === selectedNumber) return;

        if (
          markedRows.has(rowIndex) ||
          markedColumns.has(columnIndex) ||
          markedSquares.has(getSquareIndex(columnIndex, rowIndex))
        ) {
          drawings.push(getRect(columnIndex, rowIndex, "#DDD"));
        }
      })
    );
  }

  return drawings;
};

const drawer = (svgElement, userselect, numbers) => {
  svgElement.innerHTML = "";
  boardDrawer().forEach((node) => svgElement.append(node));
  userDrawer(userselect, numbers).forEach((node) => svgElement.append(node));

  const numbersInError = getNumbersInError(numbers);
  const numberDrawings = numberDrawer(numbers, numbersInError);
  numberDrawings.forEach((node) => svgElement.append(node));

  const successElement = document.getElementById("victory");
  if (
    numbers.every((row) => row.every(({ type }) => type !== "userSmall")) &&
    numbersInError.every((row) => row.every((inError) => !inError))
  ) {
    successElement.innerHTML = "👑 Victory 👑";
  } else {
    successElement.innerHTML = "";
  }
};

const redraw = () => drawer(svgElement, userselect.current, numbers.current);

export default redraw;
