import { getDifficulty } from "./solver.js";
import { getEmptyCell, range, shuffle, transpose } from "./utils.js";

const generateStatic = () => {
  const simpleBase = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
  ];

  return simpleBase.map((row) =>
    row.map((value) => ({ type: "fixed", value }))
  );
};

// Transformation ideas
// 3-column & 3-row swaps

const makeRandom = (numbers) => {
  const numberMapOut = shuffle(
    range(1, 10).map((value) => ({ type: "fixed", value }))
  );

  // Swap numbers
  numbers = numbers.map((row) =>
    row.map(({ value }) => numberMapOut[value - 1])
  );

  const rowInSquareSwaps = range(3).map((_) => shuffle(range(3)));

  // Swap row in squares
  numbers = rowInSquareSwaps.flatMap((rowSquareSwapMap, squareRowIndex) =>
    rowSquareSwapMap.map(
      (outSquareRowIndex) => numbers[squareRowIndex * 3 + outSquareRowIndex]
    )
  );

  // Swap column in squares
  const columnInSquareSwaps = range(3).map((_) => shuffle(range(3)));
  numbers = transpose(numbers);

  numbers = transpose(
    columnInSquareSwaps.flatMap((columnSquareSwapMap, squareColumnIndex) =>
      columnSquareSwapMap.map(
        (outSquareColumnIndex) =>
          numbers[squareColumnIndex * 3 + outSquareColumnIndex]
      )
    )
  );

  // Flips and rotations
  const yIncrement = Boolean(Math.round(Math.random()));
  const xIncrement = Boolean(Math.round(Math.random()));
  const yFirst = Boolean(Math.round(Math.random()));

  numbers = yFirst ? numbers : transpose(numbers);
  const yIndices = yIncrement ? range(9) : range(9).reverse();
  const xIndices = xIncrement ? range(9) : range(9).reverse();

  numbers = yIndices.map((yOut) => xIndices.map((xOut) => numbers[yOut][xOut]));

  return numbers;
};

export const generateFull = () => {
  return makeRandom(generateStatic());
};

export const removeInfo = (
  numbers,
  difficulty = 50,
  strategy = "add-remove"
) => {
  if (strategy === "full-random") {
    const keptCounts = new Set(
      shuffle(range(9 * 9)).slice(0, ((9 * 9 - 35) * difficulty) / 100)
    );
    let counter = 0;

    return numbers.map((row) =>
      row.map((value) => (keptCounts.has(counter++) ? getEmptyCell() : value))
    );
  }

  if (strategy === "add-remove" || strategy === "add") {
    let partialEmptyMap = range(9).map((_) =>
      range(9).map((_) => getEmptyCell())
    );

    while (true) {
      const addOrder = shuffle(
        range(9)
          .flatMap((rowIndex) =>
            range(9).map((columnIndex) => [rowIndex, columnIndex])
          )
          .filter(
            ([rowIndex, columnIndex]) =>
              partialEmptyMap[rowIndex][columnIndex].type === "userSmall"
          )
      );

      const possibleAdditions = addOrder
        .map((addAttempt) => {
          const addedMap = partialEmptyMap.map((row, rowIndex) =>
            row.map((cell, columnIndex) =>
              rowIndex === addAttempt[0] && columnIndex === addAttempt[1]
                ? numbers[addAttempt[0]][addAttempt[1]]
                : cell
            )
          );

          return getDifficulty(addedMap);
        })
        .sort(
          (
            { steps: steps1, difficulty: difficulty1 },
            { steps: steps2, difficulty: difficulty2 }
          ) => {
            if ((steps1 === 0) !== (steps2 === 0)) {
              return steps2 - steps1;
            }

            if (steps1 === 0 && steps2 === 0) return 0;

            const difficultyRatio = difficulty1 / steps1 - difficulty2 / steps2;

            if (difficultyRatio !== 0) return difficultyRatio;

            return steps1 - steps2;
          }
        );

      const finishedAddition = possibleAdditions.filter(({ solved }) =>
        solved.every((row) => row.every((cell) => cell.type !== "userSmall"))
      );

      if (finishedAddition.length > 0) {
        numbers = finishedAddition[finishedAddition.length - 1].original;
        document.getElementById("actualDifficulty").innerHTML = `Difficulty: ${
          finishedAddition[finishedAddition.length - 1].difficulty
        }`;
        break;
      }

      partialEmptyMap =
        possibleAdditions[possibleAdditions.length - 1].original;
    }
  }

  if (strategy !== "add-remove" && strategy !== "remove") return numbers;

  const attemptedRemovalCount = { current: 0 };
  const maxAttempts = 20;
  const hardestMap = { difficulty: 0 };

  const stopGeneration = () =>
    attemptedRemovalCount.current > maxAttempts;

  const removeNumber = (original, originalDifficulty) => {
    if (stopGeneration()) return;

    const removeOrder = shuffle(
      range(9)
        .flatMap((rowIndex) =>
          range(9).map((columnIndex) => [rowIndex, columnIndex])
        )
        .filter(
          ([rowIndex, columnIndex]) =>
            original[rowIndex][columnIndex].type === "fixed"
        )
    );

    const possibleRemovals = removeOrder
      .map((removedAttempt) => {
        const removedMap = original.map((row, rowIndex) =>
          row.map((cell, columnIndex) =>
            rowIndex === removedAttempt[0] && columnIndex === removedAttempt[1]
              ? getEmptyCell()
              : cell
          )
        );

        return getDifficulty(removedMap);
      })
      .filter(({ solved }) =>
        solved.every((row) => row.every((cell) => cell.type !== "userSmall"))
      )
      .sort(
        ({ difficulty: difficulty1 }, { difficulty: difficulty2 }) =>
          difficulty1 - difficulty2
      );

    if (possibleRemovals.length === 0) {
      if (hardestMap.difficulty < originalDifficulty) {
        hardestMap.original = original;
        hardestMap.difficulty = originalDifficulty;
        console.log(
          `better map found: ${originalDifficulty}, ${attemptedRemovalCount.current}`
        );
      }

      attemptedRemovalCount.current += 1;

      return;
    }

    const depthChoiceCount = removeOrder.length % 5 == 0 ? 2 : 1;

    for (const removeAttempt of possibleRemovals.reverse().slice(0, depthChoiceCount)) {
      removeNumber(removeAttempt.original, removeAttempt.difficulty);
      if (stopGeneration()) break;
    }
  };

  removeNumber(numbers, 0);

  console.log("generation done. Removal attempt: ", attemptedRemovalCount.current);

  document.getElementById(
    "actualDifficulty"
  ).innerHTML = `Difficulty: ${hardestMap.difficulty}`;

  return hardestMap.original;
};
