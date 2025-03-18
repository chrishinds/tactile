
export type SquareState = 0 | 1 | 2;
export type BoardIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type SquareColour = string;
export type Move = "col1Up" | "col1Down" | "col2Up" | "col2Down" | "col3Up" | "col3Down" | "centreLeft" | "centreRight";

export interface BoardState {
    indexState: Array<BoardIndex>;
    squareState: Array<SquareState>;
}

export class Model {
    static columns = 3;

    static solution = [
        0, 1, 2,
        0, 1, 2,
        0, 1, 2,
        0, 1, 2,
        0, 1, 2,
    ] as SquareState[];

    static oneMove = [
        0, 1, 2,
        0, 0, 1,
        0, 1, 2,
        1, 2, 2,
        0, 1, 2,
    ] as SquareState[];

    static twoMove = [
        0, 1, 2,
        1, 1, 2,
        0, 2, 2,
        0, 1, 1,
        0, 0, 2,
    ] as SquareState[];

    static threeMove = [
        0, 0, 2,
        0, 0, 1,
        1, 2, 1,
        1, 2, 2,
        0, 1, 2,
    ] as SquareState[];

    static fourMove = [
        0, 1, 2,
        2, 0, 2,
        0, 1, 2,
        0, 2, 1,
        0, 1, 2,
    ] as SquareState[];

    static initialStateFor(squareState: Array<SquareState>): BoardState {
        return {
            indexState: squareState.map((_, i) => i) as Array<BoardIndex>,
            squareState: squareState
        };
    }

    static transformStateArray<T>(withMove: Move, fromState: Array<T>): Array<T> {
        let indexes: Array<Array<number>> = [];
        const col1DownIndexes = [[0, 3], [3, 6], [6, 9], [9, 12], [12, 0]] as Array<Array<number>>;
        const col1UpIndexes = col1DownIndexes.map(pair => [...pair].reverse());
        const centreLeftIndexes = [[3, 4], [4, 5], [5, 8], [8, 11], [11, 10], [10, 9], [9, 6], [6, 3]] as Array<Array<number>>;
        switch (withMove) {
            case "col1Down": indexes = col1DownIndexes; break;
            case "col1Up": indexes = col1UpIndexes; break;
            case "col2Down": indexes = col1DownIndexes.map(pair => pair.map(index => index + 1)); break;
            case "col2Up": indexes = col1UpIndexes.map(pair => pair.map(index => index + 1)); break;
            case "col3Down": indexes = col1DownIndexes.map(pair => pair.map(index => index + 2)); break;
            case "col3Up": indexes = col1UpIndexes.map(pair => pair.map(index => index + 2)); break;
            case "centreLeft": indexes = centreLeftIndexes; break;
            case "centreRight": indexes = centreLeftIndexes.map(pair => pair.reverse()); break;
        }
        const toState = Array.from(fromState);
        for (let [fromIndex, toIndex] of indexes) {
            toState[toIndex] = fromState[fromIndex];
        }
        return toState;
    }

    static nextState(withMove: Move, fromBoardState: BoardState): BoardState {
        return {
            indexState: Model.transformStateArray(withMove, fromBoardState.indexState),
            squareState: Model.transformStateArray(withMove, fromBoardState.squareState)
        };
    }

    static boardFor(palette: Array<SquareColour>, boardState: BoardState): Array<SquareColour> {
        return boardState.squareState.map(state => palette[state]);
    }

    static hash(boardState: BoardState): string {
        const squareHash = boardState.squareState.map((state, i) => state * (3 ** i)).reduce((acc, val) => acc + val, 0);
        const indexHash = boardState.indexState.map((index, i) => index * (15 ** i)).reduce((acc, val) => acc + val, 0);
        return squareHash + "-" + indexHash;
    }

    static oppositeMoveFor(move: Move): Move {
        console.log(move);
        switch (move) {
            case "col1Down": return "col1Up";
            case "col1Up": return "col1Down";
            case "col2Down": return "col2Up";
            case "col2Up": return "col2Down";
            case "col3Down": return "col3Up";
            case "col3Up": return "col3Down";
            case "centreLeft": return "centreRight";
            case "centreRight": return "centreLeft";
        };
    }
}
