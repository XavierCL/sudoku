import { range, getSquareIndex, getSquare, transpose } from "./utils.js";

const fillConfirmedSets = (numbers) => {
  const rowConfirmed = range(9).map((_) => new Set());
  const columnConfirmed = range(9).map((_) => new Set());
  const squareConfirmed = range(9).map((_) => new Set());

  // Fill confirmed sets
  numbers.forEach((row, rowIndex) =>
    row.forEach(({ type, value }, columnIndex) => {
      if (type === "userSmall") return;

      rowConfirmed[rowIndex].add(value);
      columnConfirmed[columnIndex].add(value);
      squareConfirmed[getSquareIndex(columnIndex, rowIndex)].add(value);
    })
  );

  return { rowConfirmed, columnConfirmed, squareConfirmed };
};

export const pruneSmall = (numbers) => {
  const { rowConfirmed, columnConfirmed, squareConfirmed } =
    fillConfirmedSets(numbers);

  // Remove small numbers
  return numbers.map((row, rowIndex) =>
    row.map(({ type, value }, columnIndex) => {
      if (type !== "userSmall") return { type, value };

      const newSmall = new Set([...value]);
      const cellConfirmed = [
        ...rowConfirmed[rowIndex],
        ...columnConfirmed[columnIndex],
        ...squareConfirmed[getSquareIndex(columnIndex, rowIndex)],
      ];
      cellConfirmed.forEach((confirmed) => newSmall.delete(confirmed));

      return { type: "userSmall", value: newSmall };
    })
  );
};

export const fillPossible = (numbers) => {
  const possibleNumbers = range(1, 10);

  const { rowConfirmed, columnConfirmed, squareConfirmed } =
    fillConfirmedSets(numbers);

  // Fill small numbers
  return numbers.map((row, rowIndex) =>
    row.map(({ type, value }, columnIndex) => {
      if (type !== "userSmall") return { type, value };

      const newSmall = new Set();
      const cellConfirmed = new Set([
        ...rowConfirmed[rowIndex],
        ...columnConfirmed[columnIndex],
        ...squareConfirmed[getSquareIndex(columnIndex, rowIndex)],
      ]);

      possibleNumbers.forEach((possible) => {
        if (cellConfirmed.has(possible)) return;

        newSmall.add(possible);
      });

      return { type: "userSmall", value: newSmall };
    })
  );
};

// Assumes fill possible has been called
export const solve = (numbers, count = 1, oldActualSolved) => {
  let actualSolved = {
    current: oldActualSolved?.current ?? 0,
    difficulty: oldActualSolved?.difficulty ?? 0,
  };

  let lastPrune = actualSolved.current;
  const solveMore = () => count === -1 || actualSolved.current < count;

  // Checking cells
  let solvedNumbers = numbers.map((row) =>
    row.map((cell) => {
      const { type, value } = cell;

      if (type !== "userSmall" || !solveMore()) return cell;

      if (value.size === 1) {
        actualSolved.current += 1;
        actualSolved.difficulty += 1;
        return { type: "userFull", value: [...value][0] };
      }

      return { type, value: new Set([...value]) };
    })
  );

  const getFinal = () => ({
    numbers: solvedNumbers,
    steps: actualSolved.current,
    difficulty: actualSolved.difficulty,
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  const getNumberMap = () =>
    Object.fromEntries(range(1, 10).map((n) => [n, 0]));

  // Checking rows
  solvedNumbers = solvedNumbers.map((row) => {
    const numberMap = getNumberMap();

    row.forEach(({ type, value }) => {
      if (type !== "userSmall") return;

      for (const smallValue of value) {
        numberMap[smallValue] += 1;
      }
    });

    const singleNumbers = new Set(
      Object.entries(numberMap)
        .filter(([_, count]) => count === 1)
        .map(([number]) => Number(number))
    );

    return row.map((cell) => {
      const { type, value } = cell;
      if (type !== "userSmall" || !solveMore()) return cell;

      for (const smallValue of value) {
        if (singleNumbers.has(smallValue)) {
          actualSolved.current += 1;
          actualSolved.difficulty += 1;
          return { type: "userFull", value: smallValue };
        }
      }

      return { type, value: new Set([...value]) };
    });
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Checking columns
  solvedNumbers = transpose(
    transpose(solvedNumbers).map((row) => {
      const numberMap = getNumberMap();

      row.forEach(({ type, value }) => {
        if (type !== "userSmall") return;

        for (const smallValue of value) {
          numberMap[smallValue] += 1;
        }
      });

      const singleNumbers = new Set(
        Object.entries(numberMap)
          .filter(([_, count]) => count === 1)
          .map(([number]) => Number(number))
      );

      return row.map((cell) => {
        const { type, value } = cell;
        if (type !== "userSmall" || !solveMore()) return cell;

        for (const smallValue of value) {
          if (singleNumbers.has(smallValue)) {
            actualSolved.current += 1;
            actualSolved.difficulty += 1;
            return { type: "userFull", value: smallValue };
          }
        }

        return { type, value: new Set([...value]) };
      });
    })
  );

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Checking squares
  // Assumes that solved numbers is mutable, which it is since it's mapped thrice by this point.
  range(9).forEach((squareIndex) => {
    const square = getSquare(solvedNumbers, squareIndex);

    const numberMap = getNumberMap();

    for (const { type, value } of square.flat()) {
      if (type !== "userSmall") continue;

      for (const smallValue of value) {
        numberMap[smallValue] += 1;
      }
    }

    const singleNumbers = new Set(
      Object.entries(numberMap)
        .filter(([_, count]) => count === 1)
        .map(([number]) => Number(number))
    );

    square.forEach((squareRow, rowIndex) =>
      squareRow.forEach(({ type, value }, columnIndex) => {
        if (type !== "userSmall" || !solveMore()) return;

        for (const smallValue of value) {
          if (singleNumbers.has(smallValue)) {
            actualSolved.current += 1;
            actualSolved.difficulty += 1;
            solvedNumbers[Math.floor(squareIndex / 3) * 3 + rowIndex][
              (squareIndex % 3) * 3 + columnIndex
            ] = { type: "userFull", value: smallValue };

            break;
          }
        }
      })
    );
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  const getSquareMap = () =>
    Object.fromEntries(range(1, 10).map((n) => [n, new Set()]));

  // Checking rows impacting squares
  // A row with all in the same square will remove small else where in the same square
  solvedNumbers.forEach((row, rowIndex) => {
    const squareMap = getSquareMap();

    row.forEach(({ type, value }, columnIndex) => {
      if (type !== "userSmall") return;

      for (const smallValue of value) {
        squareMap[smallValue].add(Math.floor(columnIndex / 3));
      }
    });

    Object.entries(squareMap)
      .filter(([_, squares]) => squares.size === 1)
      .map(([number, squares]) => [Number(number), squares])
      .forEach(([number, squares]) => {
        if (!solveMore()) return;

        const squareIndex = Math.floor(rowIndex / 3) * 3 + [...squares][0];
        const square = getSquare(solvedNumbers, squareIndex);
        const squareRowToIgnore = rowIndex % 3;
        let removedSmall = { current: false };

        square.forEach((row, squareRow) => {
          if (squareRow === squareRowToIgnore) return;

          row.forEach(({ type, value }, squareColumn) => {
            if (type !== "userSmall") return;

            if (value.has(number)) {
              removedSmall.current = true;
              const newSmalls = new Set([...value]);
              newSmalls.delete(number);
              solvedNumbers[Math.floor(rowIndex / 3) * 3 + squareRow][
                (squareIndex % 3) * 3 + squareColumn
              ] = { type: "userSmall", value: newSmalls };
            }
          });

          if (removedSmall.current) {
            actualSolved.current += 1;
            actualSolved.difficulty += 2;
          }
        });
      });
  });

  lastPrune = actualSolved.current;

  if (!solveMore()) return getFinal();

  // Checking columns impacting squares
  // A column with all in the same square will remove small else where in the same square
  solvedNumbers = transpose(solvedNumbers);
  solvedNumbers.forEach((row, rowIndex) => {
    const squareMap = getSquareMap();

    row.forEach(({ type, value }, columnIndex) => {
      if (type !== "userSmall") return;

      for (const smallValue of value) {
        squareMap[smallValue].add(Math.floor(columnIndex / 3));
      }
    });

    Object.entries(squareMap)
      .filter(([_, squares]) => squares.size === 1)
      .map(([number, squares]) => [Number(number), squares])
      .forEach(([number, squares]) => {
        if (!solveMore()) return;

        const squareIndex = Math.floor(rowIndex / 3) * 3 + [...squares][0];
        const square = getSquare(solvedNumbers, squareIndex);
        const squareRowToIgnore = rowIndex % 3;
        let removedSmall = { current: false };

        square.forEach((row, squareRow) => {
          if (squareRow === squareRowToIgnore) return;

          row.forEach(({ type, value }, squareColumn) => {
            if (type !== "userSmall") return;

            if (value.has(number)) {
              removedSmall.current = true;
              const newSmalls = new Set([...value]);
              newSmalls.delete(number);
              solvedNumbers[Math.floor(rowIndex / 3) * 3 + squareRow][
                (squareIndex % 3) * 3 + squareColumn
              ] = { type: "userSmall", value: newSmalls };
            }
          });

          if (removedSmall.current) {
            actualSolved.current += 1;
            actualSolved.difficulty += 2;
          }
        });
      });
  });
  solvedNumbers = transpose(solvedNumbers);

  lastPrune = actualSolved.current;

  if (!solveMore()) return getFinal();

  const getSmallSquareMap = () =>
    Object.fromEntries(range(1, 10).map((n) => [n, new Set()]));

  // Checking square impacting rows
  // A square with numbers all in the same row will remove the number elsewhere in the row
  range(9).forEach((squareIndex) => {
    const square = getSquare(solvedNumbers, squareIndex);

    const smallSquareMap = getSmallSquareMap();

    square.forEach((row, rowIndex) => {
      for (const { type, value } of row) {
        if (type !== "userSmall") continue;

        for (const smallValue of value) {
          smallSquareMap[smallValue].add(rowIndex);
        }
      }
    });

    Object.entries(smallSquareMap)
      .filter(([_, rows]) => rows.size === 1)
      .map(([number, rows]) => [Number(number), [...rows][0]])
      .forEach(([number, smallRowIndex]) => {
        if (!solveMore()) return;

        const removingRowIndex =
          Math.floor(squareIndex / 3) * 3 + smallRowIndex;

        let solvedAtLeastOne = { current: false };

        solvedNumbers[removingRowIndex].forEach(
          ({ type, value }, columnIndex) => {
            if (type !== "userSmall") return;

            const removingSquareIndex = getSquareIndex(
              columnIndex,
              removingRowIndex
            );

            if (removingSquareIndex === squareIndex) return;

            if (!value.has(number)) return;

            solvedAtLeastOne.current = true;
            const newValue = new Set([...value]);
            newValue.delete(number);

            solvedNumbers[removingRowIndex][columnIndex] = {
              type,
              value: newValue,
            };
          }
        );

        if (solvedAtLeastOne.current) {
          actualSolved.current += 1;
          actualSolved.difficulty += 2;
        }
      });
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Checking square impacting columns
  // A square with numbers all in the same column will remove the number elsewhere in the column
  solvedNumbers = transpose(solvedNumbers);
  range(9).forEach((squareIndex) => {
    const square = getSquare(solvedNumbers, squareIndex);

    const smallSquareMap = getSmallSquareMap();

    square.forEach((row, rowIndex) => {
      for (const { type, value } of row) {
        if (type !== "userSmall") continue;

        for (const smallValue of value) {
          smallSquareMap[smallValue].add(rowIndex);
        }
      }
    });

    Object.entries(smallSquareMap)
      .filter(([_, rows]) => rows.size === 1)
      .map(([number, rows]) => [Number(number), [...rows][0]])
      .forEach(([number, smallRowIndex]) => {
        if (!solveMore()) return;

        const removingRowIndex =
          Math.floor(squareIndex / 3) * 3 + smallRowIndex;

        let solvedAtLeastOne = { current: false };

        solvedNumbers[removingRowIndex].forEach(
          ({ type, value }, columnIndex) => {
            if (type !== "userSmall") return;

            const removingSquareIndex = getSquareIndex(
              columnIndex,
              removingRowIndex
            );

            if (removingSquareIndex === squareIndex) return;

            if (!value.has(number)) return;

            solvedAtLeastOne.current = true;
            const newValue = new Set([...value]);
            newValue.delete(number);

            solvedNumbers[removingRowIndex][columnIndex] = {
              type,
              value: newValue,
            };
          }
        );

        if (solvedAtLeastOne.current) {
          actualSolved.current += 1;
          actualSolved.difficulty += 2;
        }
      });
  });
  solvedNumbers = transpose(solvedNumbers);

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Checking outward closed groups
  // If as many numbers are possible as there are cells, then remove those numbers outside of the cells
  const checkOutwardClosedGroups = (cellGroup) => {
    const recursiveCheckOutward = (cellsNumbers) => {
      if (!solveMore()) return;

      const lastCellNumbers = cellsNumbers[cellsNumbers.length - 1];

      // Closed group would be as large as cell group, short circuit
      if (lastCellNumbers.values.size >= cellGroup.length) return;

      if (lastCellNumbers.values.size <= cellsNumbers.length) {
        // Potential outward closed group found, validate it by removing at least one small value
        const cellsToIgnore = new Set(
          cellsNumbers.map(({ cellIndex }) => cellIndex)
        );

        const smallValuesToRemove = lastCellNumbers.values;

        let removedAtLeastOneSmall = { current: false };
        cellGroup.forEach(({ value, x, y }, cellIndex) => {
          if (cellsToIgnore.has(cellIndex)) return;

          for (const smallValue of value) {
            if (smallValuesToRemove.has(smallValue)) {
              removedAtLeastOneSmall.current = true;
              solvedNumbers[y][x].value.delete(smallValue);
            }
          }
        });

        if (removedAtLeastOneSmall.current) {
          actualSolved.current += 1;
          actualSolved.difficulty += 3;
        }

        return;
      }

      for (const cellIndexToAddToGroup of range(
        lastCellNumbers.cellIndex + 1,
        cellGroup.length
      )) {
        recursiveCheckOutward(
          cellsNumbers.concat([
            {
              cellIndex: cellIndexToAddToGroup,
              values: new Set([
                ...lastCellNumbers.values,
                ...cellGroup[cellIndexToAddToGroup].value,
              ]),
            },
          ])
        );
      }
    };

    for (const firstCellIndex of range(cellGroup.length)) {
      recursiveCheckOutward([
        {
          cellIndex: firstCellIndex,
          values: new Set([...cellGroup[firstCellIndex].value]),
        },
      ]);
    }
  };

  // Outward square closed groups
  range(9).forEach((squareIndex) => {
    if (!solveMore()) return;

    const square = getSquare(solvedNumbers, squareIndex);

    checkOutwardClosedGroups(
      square.flatMap((smallRow, smallRowIndex) =>
        smallRow
          .map(({ type, value }, columnIndex) => ({
            type,
            value,
            x: (squareIndex % 3) * 3 + columnIndex,
            y: Math.floor(squareIndex / 3) * 3 + smallRowIndex,
          }))
          .filter(({ type }) => type === "userSmall")
      )
    );
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Outward row closed groups
  solvedNumbers.forEach((row, rowIndex) => {
    checkOutwardClosedGroups(
      row
        .map(({ type, value }, columnIndex) => ({
          type,
          value,
          x: columnIndex,
          y: rowIndex,
        }))
        .filter(({ type }) => type === "userSmall")
    );
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (!solveMore()) return getFinal();

  // Outward column closed groups
  transpose(solvedNumbers).forEach((column, columnIndex) => {
    checkOutwardClosedGroups(
      column
        .map(({ type, value }, rowIndex) => ({
          type,
          value,
          x: columnIndex,
          y: rowIndex,
        }))
        .filter(({ type }) => type === "userSmall")
    );
  });

  if (actualSolved.current > lastPrune) {
    solvedNumbers = pruneSmall(solvedNumbers);
    lastPrune = actualSolved.current;
  }

  if (
    !solveMore() ||
    actualSolved.current === (oldActualSolved?.current ?? 0)
  ) {
    return getFinal();
  }

  return solve(solvedNumbers, count, actualSolved);
};

export const getDifficulty = (numbers) => {
  const partialSolved = {
    numbers: fillPossible(numbers),
    lastSteps: 1,
    totalSteps: 0,
    difficulty: 0,
  };

  while (partialSolved.lastSteps > 0) {
    const latestSolved = solve(partialSolved.numbers, 1);
    partialSolved.numbers = latestSolved.numbers;
    partialSolved.lastSteps = latestSolved.steps;
    partialSolved.totalSteps += latestSolved.steps;
    partialSolved.difficulty += latestSolved.difficulty;
  }

  return {
    original: numbers,
    solved: partialSolved.numbers,
    difficulty: partialSolved.difficulty,
    steps: partialSolved.totalSteps,
  };
};
