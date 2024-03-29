import { delay } from 'redux-saga';
import { call, put, takeLatest, all, take, race } from 'redux-saga/effects';

import { puzzleFetcher } from 'utils/fetcher';
import {
  initializePuzzle,
  getGuessCellNumber,
  getMoveCellNumber,
  getMoveClueNumber,
  getRemoveGuessCellNumber,
  getOtherDirection,
  getClickClueNumber,
  getCheckCells,
  getRevealCells,
  getClearCells,
  isPuzzleSolved
} from 'utils/puzzle';
import { PUZZLE_AND_TIMER } from 'constants/scopes';
import { STATUS_404 } from 'utils/fetcher';


const FETCH_PUZZLE = 'puzzle/FETCH_PUZZLE';
const FETCH_PUZZLE_RECEIVE = 'puzzle/FETCH_PUZZLE_RECEIVE';

const GUESS_CELL = 'puzzle/GUESS_CELL';
const MOVE_ACTIVE_CELL = 'puzzle/MOVE_ACTIVE_CELL';
const MOVE_ACTIVE_CLUE = 'puzzle/MOVE_ACTIVE_CLUE';
const REMOVE_GUESS = 'puzzle/REMOVE_GUESS';
const CELL_CLICK = 'puzzle/CELL_CLICK';
const CLUE_CLICK = 'puzzle/CLUE_CLICK';
const REVEAL_OPTION = 'puzzle/REVEAL_OPTION';
const CHECK_OPTION = 'puzzle/CHECK_OPTION';
const CLEAR_OPTION = 'puzzle/CLEAR_OPTION';
const UPDATE_TIMER = 'puzzle/UPDATE_TIMER';
const START_TIMER = 'puzzle/START_TIMER';
const STOP_TIMER = 'puzzle/STOP_TIMER';


export function startTimer(puzzleId) {
  return {
    type: START_TIMER,
    puzzleId
  }
}

export function stopTimer(puzzleId) {
  return {
    type: STOP_TIMER,
    puzzleId,
  }
}

export function updateTimer(puzzleId) {
  return {
    type: UPDATE_TIMER,
    puzzleId,
  }
}

export function revealOption(puzzleId, option) {
  return {
    type: REVEAL_OPTION,
    puzzleId,
    option,
  }
}

export function checkOption(puzzleId, option) {
  return {
    type: CHECK_OPTION,
    puzzleId,
    option,
  }
}

export function clearOption(puzzleId, option) {
  return {
    type: CLEAR_OPTION,
    puzzleId,
    option,
  }
}

export function clueClick(puzzleId, direction, clueNumber) {
  return {
    type: CLUE_CLICK,
    puzzleId,
    direction,
    clueNumber,
  }
}

export function cellClick(puzzleId, cellNumber) {
  return {
    type: CELL_CLICK,
    puzzleId,
    cellNumber,
  }
}

export function removeGuess(puzzleId) {
  return {
    type: REMOVE_GUESS,
    puzzleId,
  }
}

export function moveActiveClue(puzzleId, move) {
  return {
    type: MOVE_ACTIVE_CLUE,
    puzzleId,
    move
  }
}

export function moveActiveCell(puzzleId, move) {
  return {
    type: MOVE_ACTIVE_CELL,
    puzzleId,
    move
  }
}

export function guessCell(puzzleId, guess) {
  return {
    type: GUESS_CELL,
    puzzleId,
    guess
  }
}

export function fetchPuzzle(puzzleId) {
  return {
    type: FETCH_PUZZLE,
    puzzleId,
  };
}

function fetchPuzzleReceive(puzzleId, response) {
  return {
    type: FETCH_PUZZLE_RECEIVE,
    puzzleId,
    response,
  };
}

function* fetchPuzzleRequest(action) {
  const response = yield call(puzzleFetcher, action.puzzleId);
  yield put(fetchPuzzleReceive(action.puzzleId, response));
}

function* watchPuzzle() {
  yield takeLatest(FETCH_PUZZLE, fetchPuzzleRequest);
}

function* runInterval() {
  let startTimer = yield take(START_TIMER);
  while (startTimer) {
    while (true) {
      const { stopTimer } = yield race({
        stopTimer: take(STOP_TIMER),
        tickTimer: call(delay, 1000),
      });

      if (stopTimer) {
        break;
      }

      yield put(updateTimer(startTimer.puzzleId));
    }
    startTimer = yield take(START_TIMER);
  }
}

export function* rootSaga() {
  yield all([
    watchPuzzle(),
    runInterval(),
  ]);
}

export function reducer(state = {}, action) {
  switch (action.type) {
    case FETCH_PUZZLE_RECEIVE: {
      if (action.response === STATUS_404) {
        return {
          ...state,
          [action.puzzleId]: STATUS_404,
        }
      }

      const puzzleObject = action.response;
      return {
        ...state,
        [action.puzzleId]: {
          ...initializePuzzle(puzzleObject),
        },
      };
    }

    case GUESS_CELL: {
      const { cells, activeCellNumber, activeDirection, clues, width, filledCells, availableCells } = state[action.puzzleId];
      const activeCell = cells[activeCellNumber];
      const nextCellNumber = getGuessCellNumber(activeCellNumber, activeDirection, cells, clues, width);

      let newCells = cells;
      let newFilledCells = filledCells;
      if (!activeCell.solved) {
        newCells = [
          ...cells.slice(0, activeCellNumber),
          {
            ...activeCell,
            guess: action.guess.toUpperCase(),
          },
          ...cells.slice(activeCellNumber + 1)
        ];
      }

      if (!activeCell.guess) {
        newFilledCells = filledCells + 1;
      }

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          cells: newCells,
          activeCellNumber: nextCellNumber,
          filledCells: newFilledCells,
          solved: newFilledCells === availableCells && isPuzzleSolved(cells),
        }
      }
    }

    case MOVE_ACTIVE_CELL: {
      const { activeDirection, activeCellNumber, cells, width } = state[action.puzzleId];
      const { newDirection, newCellNumber } = getMoveCellNumber(activeCellNumber, activeDirection,
        cells, width, action.move);

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          activeDirection: newDirection,
          activeCellNumber: newCellNumber,
        }
      }
    }

    case MOVE_ACTIVE_CLUE: {
      const { activeDirection, activeCellNumber, cells, width, clues, defaultClues } = state[action.puzzleId];
      const { newDirection, newCellNumber } = getMoveClueNumber(activeCellNumber, activeDirection,
        cells, clues, width, defaultClues, action.move);

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          activeDirection: newDirection,
          activeCellNumber: newCellNumber,
        }
      }
    }

    case REMOVE_GUESS: {
      const { cells, activeCellNumber, activeDirection, clues, width, filledCells } = state[action.puzzleId];
      const nextCellNumber = getRemoveGuessCellNumber(activeCellNumber, activeDirection, cells, clues, width);
      const cellToRemove = cells[nextCellNumber];

      let newCells = cells;
      if (!cellToRemove.solved) {
        newCells = [
          ...cells.slice(0, nextCellNumber),
          {
            ...cellToRemove,
            guess: undefined,
          },
          ...cells.slice(nextCellNumber + 1)
        ];
      }

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          cells: newCells,
          activeCellNumber: nextCellNumber,
          filledCells: cellToRemove.solved ? filledCells : filledCells - 1,
        }
      }
    }

    case CELL_CLICK: {
      const { activeCellNumber, activeDirection } = state[action.puzzleId];
      const newDirection = action.cellNumber === activeCellNumber ? getOtherDirection(activeDirection) : activeDirection;
      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          activeCellNumber: action.cellNumber,
          activeDirection: newDirection,
        }
      }
    }

    case CLUE_CLICK: {
      const { cells, clues, width } = state[action.puzzleId];
      const nextCellNumber = getClickClueNumber(cells, clues, width, action.direction, action.clueNumber);

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          activeDirection: action.direction,
          activeCellNumber: nextCellNumber,
        }
      }
    }

    case CHECK_OPTION: {
      const { cells, clues, activeCellNumber, activeDirection, width } = state[action.puzzleId];
      const newCells = getCheckCells(cells, clues, width, activeCellNumber, activeDirection, action.option);

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          cells: newCells,
        }
      }
    }

    case REVEAL_OPTION: {
      const { cells, clues, activeCellNumber, activeDirection, width, availableCells } = state[action.puzzleId];
      const newCells = getRevealCells(cells, clues, width, activeCellNumber, activeDirection, action.option);
      const newFilledCells = newCells.filter(cell => cell.guess).length;

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          cells: newCells,
          filledCells: newFilledCells,
          solved: newFilledCells === availableCells && isPuzzleSolved(cells),
        }
      }
    }

    case CLEAR_OPTION: {
      if (action.option === PUZZLE_AND_TIMER) {
        return {
          ...state,
          [action.puzzleId]: {
            ...initializePuzzle(state[action.puzzleId].raw),
          }
        }
      }

      const { cells, clues, activeCellNumber, activeDirection, width } = state[action.puzzleId];
      const newCells = getClearCells(cells, clues, width, activeCellNumber, activeDirection, action.option);

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          cells: newCells,
          filledCells: newCells.filter(cell => cell.guess).length,
        }
      }
    }

    case UPDATE_TIMER: {
      const { timer } = state[action.puzzleId];

      return {
        ...state,
        [action.puzzleId]: {
          ...state[action.puzzleId],
          timer: timer + 1,
        }
      }
    }

    default: {
      return state;
    }
  }
}
