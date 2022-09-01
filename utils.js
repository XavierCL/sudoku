export const range = (start, end) => {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  return Array.from(Array(end - start)).map((_, index) => index + start);
};

export const getSquareIndex = (x, y) => {
  return Math.floor(y / 3) * 3 + Math.floor(x / 3);
};

export const shuffle = (array) => {
  array = array.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export const getSquare = (numbers, squareIndex) => {
  return [
    numbers[Math.floor(squareIndex / 3) * 3].slice(
      (squareIndex % 3) * 3,
      (squareIndex % 3) * 3 + 3
    ),
    numbers[Math.floor(squareIndex / 3) * 3 + 1].slice(
      (squareIndex % 3) * 3,
      (squareIndex % 3) * 3 + 3
    ),
    numbers[Math.floor(squareIndex / 3) * 3 + 2].slice(
      (squareIndex % 3) * 3,
      (squareIndex % 3) * 3 + 3
    ),
  ];
};

export const transpose = (numbers) => {
  return range(9).map((rowIndex) =>
    range(9).map((columnIndex) => numbers[columnIndex][rowIndex])
  );
};

export const getNumbersInError = (numbers) => {
  const getNewNumberMap = () =>
    range(1, 10).reduce(
      (acc, current) => Object.assign(acc, { [current]: 0 }),
      {}
    );

  const numbersCopy = { current: numbers };
  const numberMapCount = { current: getNewNumberMap() };
  const errorBoard = {
    current: range(9).map((_) => range(9).map((_) => false)),
  };

  const flagErrorsInRow = () => {
    numbersCopy.current.forEach((row, rowIndex) => {
      numberMapCount.current = getNewNumberMap();

      row.forEach(({ type, value }) => {
        if (type === "userSmall") return;

        numberMapCount.current[value] += 1;
      });

      const numbersInError = new Set(
        Object.entries(numberMapCount.current)
          .map(([number, count]) => ({ number, count }))
          .filter(({ count }) => count > 1)
          .map(({ number }) => Number(number))
      );

      row.forEach(({ type, value }, columnIndex) => {
        if (type === "userSmall" || !numbersInError.has(value)) return;

        errorBoard.current[rowIndex][columnIndex] = true;
      });
    });
  };

  flagErrorsInRow();

  // Same for columns
  numbersCopy.current = transpose(numbersCopy.current);
  errorBoard.current = transpose(errorBoard.current);
  flagErrorsInRow();
  numbersCopy.current = transpose(numbersCopy.current);
  errorBoard.current = transpose(errorBoard.current);

  const flagErrorsInSquare = () => {
    range(9).forEach((squareIndex) => {
      numberMapCount.current = getNewNumberMap();

      const squareNumbers = getSquare(numbersCopy.current, squareIndex);

      squareNumbers.flat().forEach(({ type, value }) => {
        if (type === "userSmall") return;

        numberMapCount.current[value] += 1;
      });

      const numbersInError = new Set(
        Object.entries(numberMapCount.current)
          .map(([number, count]) => ({ number, count }))
          .filter(({ count }) => count > 1)
          .map(({ number }) => Number(number))
      );

      squareNumbers.forEach((threeNumbers, rowInSquare) => {
        threeNumbers.forEach(({ type, value }, columnInSquare) => {
          if (type === "userSmall" || !numbersInError.has(value)) return;

          const rowIndex = Math.floor(squareIndex / 3) * 3 + rowInSquare;
          const columnIndex = (squareIndex % 3) * 3 + columnInSquare;

          errorBoard.current[rowIndex][columnIndex] = true;
        });
      });
    });
  };

  flagErrorsInSquare();

  return errorBoard.current;
};

export const getEmptyCell = () => ({ type: "userSmall", value: new Set() });
