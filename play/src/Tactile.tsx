'use client';
import { useState, createContext, useContext } from "react";
import { motion } from "motion/react";
import { Container, Row, Col, Button, ButtonToolbar, ButtonGroup, Dropdown } from "react-bootstrap";

import { SquareState, BoardState, Move, Model } from "./Model";

const SquareContext = createContext({ size: 75, gap: 15, duration: 0.12 });
const PaletteContext = createContext({
  lightPalette: ["rgb(255, 59, 48)", "rgb(52, 199, 89)", "rgb(0, 122, 255)"],
  darkPalette: ["rgb(255, 69, 58)", "rgb(48, 209, 88)", "rgb(10, 132, 255)"],
});
const DarkModeContext = createContext({ darkMode: true, setDarkMode: (value: boolean) => { } });


export function Square({ label, xMoveOffset, yMoveOffset, colour, isUpable = true, isDownable = true, opacity, handler }: {
  label?: string,
  xMoveOffset: number,
  yMoveOffset: number,
  colour: string,
  isUpable?: boolean,
  isDownable?: boolean,
  opacity?: number,
  handler?: () => void
}) {
  const { size, duration } = useContext(SquareContext);
  // remove the y-animation when we're not-upable and we have an upward move, or we are not-downable and we have a downward move 
  const yMoveOffsetValue = (!isUpable && yMoveOffset < 0) || (!isDownable && yMoveOffset > 0) ? 0 : yMoveOffset;
  // opacity is always 1 if we have been provided with no value
  const opacityValue = opacity === undefined ? 1 : opacity;
  const animateValues: any = { x: xMoveOffset, y: yMoveOffsetValue, opacity: opacityValue, backgroundColor: colour };
  const transitionValues: any = { ease: "easeInOut", duration: duration };
  const styleValues: any = { width: size + 'px', height: size + 'px', backgroundColor: colour, opacity: opacityValue };
  return (
    <motion.div
      aria-label={label}
      className="rounded-3"
      style={styleValues}
      animate={animateValues}
      transition={transitionValues}
      onAnimationComplete={handler}
    />
  );
}


export function TactileBoard({ state, move, nextState, completionHandler }: {
  state: BoardState,
  move?: Move | undefined,
  nextState?: BoardState | undefined,
  completionHandler: (nextState: BoardState) => void
}
) {
  const { size, gap } = useContext(SquareContext);
  const { lightPalette, darkPalette } = useContext(PaletteContext);
  const { darkMode } = useContext(DarkModeContext);
  const palette = darkMode ? darkPalette : lightPalette
  const board = Model.boardFor(palette, state);
  const boardHash = nextState ? Model.hash(state) + '_' + Model.hash(nextState) : Model.hash(state);
  if (darkMode) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }

  let col1Shift = 0;
  let col2Shift = 0;
  let col3Shift = 0;
  let col1TopOpacity = 0;
  let col2TopOpacity = 0;
  let col3TopOpacity = 0;
  let col1BottomOpacity = 0;
  let col2BottomOpacity = 0;
  let col3BottomOpacity = 0;
  let leftXShift = 0;
  let leftYShift = 0;
  let rightXShift = 0;
  let rightYShift = 0;

  if (move) {
    const shift = size + gap;
    switch (move) {
      case "col1Down":
        col1Shift = shift;
        col1TopOpacity = 1;
        break;
      case "col1Up":
        col1Shift = -shift;
        col1BottomOpacity = 1;
        break;
      case "col2Down":
        col2Shift = shift;
        col2TopOpacity = 1;
        break;
      case "col2Up":
        col2Shift = -shift;
        col2BottomOpacity = 1;
        break;
      case "col3Down":
        col3Shift = shift;
        col3TopOpacity = 1;
        break;
      case "col3Up":
        col3Shift = -shift;
        col3BottomOpacity = 1;
        break;
      case "centreLeft":
        leftXShift = shift;
        leftYShift = shift;
        break;
      case "centreRight":
        rightXShift = shift;
        rightYShift = shift;
        break;
    }
  };

  const animationCompleteHandler = () => {
    if (move) {
      completionHandler(Model.nextState(move, state));
    } else if (nextState) {
      completionHandler(nextState);
    }
  }

  return (
    <div key={boardHash} style={{
      display: 'grid', width: 'fit-content', height: 'fit-content',
      gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px'
    }}>
      <Square xMoveOffset={0} yMoveOffset={col1Shift} isUpable={false} colour={board[12]} opacity={col1TopOpacity} handler={animationCompleteHandler} />
      <Square xMoveOffset={0} yMoveOffset={col2Shift} isUpable={false} colour={board[13]} opacity={col2TopOpacity} handler={animationCompleteHandler} />
      <Square xMoveOffset={0} yMoveOffset={col3Shift} isUpable={false} colour={board[14]} opacity={col3TopOpacity} handler={animationCompleteHandler} />

      <Square label="Square 0" xMoveOffset={0} yMoveOffset={col1Shift} colour={board[0]} opacity={1 - col1BottomOpacity} handler={animationCompleteHandler} />
      <Square label="Square 1" xMoveOffset={0} yMoveOffset={col2Shift} colour={board[1]} opacity={1 - col2BottomOpacity} handler={animationCompleteHandler} />
      <Square label="Square 2" xMoveOffset={0} yMoveOffset={col3Shift} colour={board[2]} opacity={1 - col3BottomOpacity} handler={animationCompleteHandler} />

      <Square label="Square 3" xMoveOffset={leftXShift} yMoveOffset={col1Shift + rightYShift} colour={board[3]} handler={animationCompleteHandler} />
      <Square label="Square 4" xMoveOffset={leftXShift - rightXShift} yMoveOffset={col2Shift} colour={board[4]} handler={animationCompleteHandler} />
      <Square label="Square 5" xMoveOffset={-rightXShift} yMoveOffset={col3Shift + leftYShift} colour={board[5]} handler={animationCompleteHandler} />

      <Square label="Square 6" xMoveOffset={0} yMoveOffset={col1Shift - leftYShift + rightYShift} colour={board[6]} handler={animationCompleteHandler} />
      <Square label="Square 7" xMoveOffset={0} yMoveOffset={col2Shift} colour={board[7]} handler={animationCompleteHandler} />
      <Square label="Square 8" xMoveOffset={0} yMoveOffset={col3Shift + leftYShift - rightYShift} colour={board[8]} handler={animationCompleteHandler} />

      <Square label="Square 9" xMoveOffset={rightXShift} yMoveOffset={col1Shift - leftYShift} colour={board[9]} handler={animationCompleteHandler} />
      <Square label="Square 10" xMoveOffset={-leftXShift + rightXShift} yMoveOffset={col2Shift} colour={board[10]} handler={animationCompleteHandler} />
      <Square label="Square 11" xMoveOffset={-leftXShift} yMoveOffset={col3Shift - rightYShift} colour={board[11]} handler={animationCompleteHandler} />

      <Square label="Square 12" xMoveOffset={0} yMoveOffset={col1Shift} colour={board[12]} opacity={1 - col1TopOpacity} handler={animationCompleteHandler} />
      <Square label="Square 13" xMoveOffset={0} yMoveOffset={col2Shift} colour={board[13]} opacity={1 - col2TopOpacity} handler={animationCompleteHandler} />
      <Square label="Square 14" xMoveOffset={0} yMoveOffset={col3Shift} colour={board[14]} opacity={1 - col3TopOpacity} handler={animationCompleteHandler} />

      <Square xMoveOffset={0} yMoveOffset={col1Shift} isDownable={false} colour={board[0]} opacity={col1BottomOpacity} handler={animationCompleteHandler} />
      <Square xMoveOffset={0} yMoveOffset={col2Shift} isDownable={false} colour={board[1]} opacity={col2BottomOpacity} handler={animationCompleteHandler} />
      <Square xMoveOffset={0} yMoveOffset={col3Shift} isDownable={false} colour={board[2]} opacity={col3BottomOpacity} handler={animationCompleteHandler} />
    </div>
  );
}


function TactileButtonBar({ makeMove, disabled = false }: { makeMove: (arg0: Move) => void, disabled?: boolean }) {
  return (
    <ButtonToolbar className="justify-content-center">
      <ButtonGroup className="me-1 mb-1">
        <Button aria-label="Rotate Right" variant="secondary" onClick={() => makeMove('centreRight')} disabled={disabled}><i className='bi-arrow-counterclockwise' /></Button>
      </ButtonGroup>
      <ButtonGroup className="me-1 mb-1" vertical>
        <Button aria-label="Shift Column 1 Up" variant="secondary" onClick={() => makeMove('col1Up')} disabled={disabled}><i className='bi-arrow-up' /></Button>
        <Button aria-label="Shift Column 1 Down" variant="secondary" onClick={() => makeMove('col1Down')} disabled={disabled}><i className='bi-arrow-down' /></Button>
      </ButtonGroup>
      <ButtonGroup className="me-1 mb-1" vertical>
        <Button aria-label="Shift Column 2 Up" variant="secondary" onClick={() => makeMove('col2Up')} disabled={disabled}><i className='bi-arrow-up' /></Button>
        <Button aria-label="Shift Column 2 Down" variant="secondary" onClick={() => makeMove('col2Down')} disabled={disabled}><i className='bi-arrow-down' /></Button>
      </ButtonGroup>
      <ButtonGroup className="me-1 mb-1" vertical>
        <Button aria-label="Shift Column 3 Up" variant="secondary" onClick={() => makeMove('col3Up')} disabled={disabled}><i className='bi-arrow-up' /></Button>
        <Button aria-label="Shift Column 3 Down" variant="secondary" onClick={() => makeMove('col3Down')} disabled={disabled}><i className='bi-arrow-down' /></Button>
      </ButtonGroup>
      <ButtonGroup className="me-1 mb-1">
        <Button aria-label="Rotate Left" variant="secondary" onClick={() => makeMove('centreLeft')} disabled={disabled}><i className='bi-arrow-clockwise' /></Button>
      </ButtonGroup>
    </ButtonToolbar>
  );
}


function TactileTopBar({ problemList, activeProblemIndex, problemSelectedHandler, undoDisabled, undoHandler }: {
  problemList: Array<[string, SquareState[]]>,
  activeProblemIndex: number,
  problemSelectedHandler: (eventKey: any, event: object) => any,
  undoDisabled: boolean,
  undoHandler: () => void
}) {
  const { darkMode, setDarkMode } = useContext(DarkModeContext)
  return (
    <ButtonToolbar className="justify-content-center">
      <ButtonGroup className="me-2">
        <Dropdown onSelect={problemSelectedHandler}>
          <Dropdown.Toggle variant="secondary">Problems</Dropdown.Toggle>
          <Dropdown.Menu>
            {problemList.map(([problemName, _], index) => (
              <Dropdown.Item eventKey={index} key={index} active={index == activeProblemIndex}>{problemName}</Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </ButtonGroup>
      <ButtonGroup className="me-2">
        <Button variant="secondary" disabled={undoDisabled} onClick={undoHandler}>Undo</Button>
      </ButtonGroup>
      <ButtonGroup className="me-2">
        <Button aria-label="Toggle Dark Mode" variant="secondary" onClick={e => setDarkMode(!darkMode)}><i className={darkMode ? 'bi-brightness-high-fill' : 'bi-moon-stars-fill'} /></Button>
      </ButtonGroup>
    </ButtonToolbar>
  )
}


export function TactileWithButtons({ problemList, initialProblemIndex }: { problemList: Array<[string, Array<SquareState>]>, initialProblemIndex: number }) {
  const { darkMode } = useContext(DarkModeContext);
  const [darkModeState, setDarkModeState] = useState(darkMode);
  const [moves, setMoves] = useState<Array<Move>>([]);
  const [currentMove, setCurrentMove] = useState<Move | undefined>(undefined);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [activeProblemIndex, setActiveProblemIndex] = useState<number>(initialProblemIndex);
  const [boardState, setBoardState] = useState<BoardState>(Model.initialStateFor(problemList[initialProblemIndex][1]));
  const [nextBoardState, setNextBoardState] = useState<BoardState | undefined>(undefined);

  const completionHandler = (boardState: BoardState) => {
    setBoardState(boardState);
    setNextBoardState(undefined);
    if (currentMoveIndex + 1 < moves.length) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      setCurrentMove(moves[currentMoveIndex + 1]);
    } else {
      setCurrentMove(undefined);
    }
  }

  const makeMove = (additionalMove: Move) => {
    if (currentMove === undefined) {
      setNextBoardState(undefined);
      let updatedMoves = [...moves, additionalMove];
      setMoves([...moves, additionalMove]);
      setCurrentMoveIndex(currentMoveIndex + 1);
      setCurrentMove(updatedMoves[currentMoveIndex + 1]);
    }
  }

  const problemSelectedHandler = (eventKey: any, event: object): any => {
    setActiveProblemIndex(eventKey as number);
    setMoves([]);
    setCurrentMove(undefined);
    setCurrentMoveIndex(-1);
    setNextBoardState(Model.initialStateFor(problemList[eventKey as number][1]))
  }

  const undoDisabled = currentMoveIndex < 0;

  const undoHandler = () => {
    if (currentMoveIndex >= 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      setCurrentMove(Model.oppositeMoveFor(moves[currentMoveIndex]));
      setMoves(moves.slice(0, -1));
    }
  };

  return (
    <DarkModeContext.Provider value={{ darkMode: darkModeState, setDarkMode: setDarkModeState }}>
      <Container>
        <Row className="justify-content-center mt-3">
          <Col xs='auto'>
            <TactileTopBar problemList={problemList} activeProblemIndex={activeProblemIndex} problemSelectedHandler={problemSelectedHandler} undoDisabled={undoDisabled} undoHandler={undoHandler} />
            <TactileBoard move={currentMove} state={boardState} nextState={nextBoardState} completionHandler={completionHandler} />
            <TactileButtonBar makeMove={makeMove} />
          </Col>
        </Row>
      </Container>
    </DarkModeContext.Provider>
  );
}

export default function TactileDemo() {
  const problemList: Array<[string, SquareState[]]> = [
    ['1 - move', Model.oneMove],
    ['2 - moves', Model.twoMove],
    ['3 - moves', Model.threeMove],
    ['4 - moves', Model.fourMove]
  ];

  return (
    <TactileWithButtons problemList={problemList} initialProblemIndex={0} />
  );
}
