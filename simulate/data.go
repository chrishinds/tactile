package main

import (
	"cmp"
	"fmt"
	"hash/maphash"
	"math/rand"
	"slices"
	"time"
)

var maphashSeedValue maphash.Seed

func init() {
	maphashSeedValue = maphash.MakeSeed()
}

type Position int

const (
	p11 Position = iota
	p21
	p31
	p12
	p22
	p32
	p13
	p23
	p33
	p14
	p24
	p34
	p15
	p25
	p35
)
const pFirst = p11
const pLast = p35
const boardWidth = 3
const boardHeight = 5

type Rotation int

const (
	zeroRadian         Rotation = 0
	halfPiRadian                = 1
	PiRadians                   = 2
	threeHalfPiRadians          = 3
	fourHalfPiRadians           = 4
)

type RotationDelta Rotation

type MoveTo struct {
	p Position
	r RotationDelta
}

type Transform map[Position]MoveTo

func invert(t Transform) Transform {
	i := make(Transform)
	for p, move := range t {
		i[move.p] = MoveTo{p: p, r: -move.r}
	}
	return i
}

type Input string

const (
	noInput Input = "noInput"
	up1           = "up1"
	down1         = "down1"
	up2           = "up2"
	down2         = "down2"
	up3           = "up3"
	down3         = "down3"
	left          = "left"
	right         = "right"
)

var inverse = map[Input]Input{
	up1:   down1,
	down1: up1,
	up2:   down2,
	down2: up2,
	up3:   down3,
	down3: up3,
	left:  right,
	right: left,
}

type Interactions map[Input]Transform

type Tile string

const (
	tR Tile = "R"
	tG      = "G"
	tB      = "B"
)

type RotationAbsolute Rotation

type TileState struct {
	t Tile
	r RotationAbsolute
}

// HACK: We are not printing rotation THIS WILL EFFECT HASHING!!
func (ts *TileState) String() string {
	// return fmt.Sprintf("%s%d", ts.t, ts.r)
	return fmt.Sprintf("%s", ts.t)
}

type State map[Position]*TileState

func (state *State) String() (str string) {
	for j := 0; j < boardHeight; j++ {
		s := ""
		for i := 0; i < boardWidth; i++ {
			pos := pFirst + Position(j*boardWidth+i)
			s += (*state)[pos].String()
		}
		str = s + "\n" + str
	}
	return str[:len(str)-1] // ugly
}

type StateHash uint64

func (s *State) makeHash() StateHash {
	h := ""
	for p := pFirst; p <= pLast; p++ {
		h += (*s)[p].String() // these are fixed width unique string representations
	}
	return StateHash(maphash.String(maphashSeedValue, h))
}

func createRotatedTileState(oldTileState *TileState, rotateBy RotationDelta) *TileState {
	newAbsoluteRotation := (oldTileState.r + RotationAbsolute(rotateBy)) % fourHalfPiRadians
	return &TileState{t: oldTileState.t, r: newAbsoluteRotation}
}

type ReachabilityTree struct {
	currentStateHash StateHash
	then             map[Input]*ReachabilityTree
	isLoop           bool
	isSolution       bool
	priorTree        *ReachabilityTree
	priorInput       Input
	inputCount       int
}

func (into *ReachabilityTree) init() *ReachabilityTree {
	if into.then == nil {
		into.then = make(map[Input]*ReachabilityTree)
	}
	return into
}

func (tree *ReachabilityTree) fromInputs() []Input {
	inputs := make([]Input, tree.inputCount)
	iTree := tree
	for i := tree.inputCount - 1; i >= 0; i-- {
		inputs[i] = iTree.priorInput
		iTree = iTree.priorTree
	}
	return inputs
}

type StateRecord struct {
	state     *State
	reachedBy []*ReachabilityTree
	graph     *StateGraph
}

type StateDict map[StateHash]*StateRecord

type Board struct {
	solutionState       State
	interactions        Interactions
	inputs              []Input
	reachableStateIndex StateDict
	stateReachability   ReachabilityTree
}

func (board *Board) init(solution State) *Board {
	board.reachableStateIndex = StateDict{}
	board.solutionState = solution
	solutionHash := solution.makeHash()
	board.stateReachability = *(&ReachabilityTree{currentStateHash: solutionHash, isSolution: true}).init()
	board.reachableStateIndex[solutionHash] = &StateRecord{state: &solution, reachedBy: []*ReachabilityTree{&board.stateReachability}}
	return board
}

func (board *Board) isSolution(stateHash StateHash) bool {
	return board.stateReachability.currentStateHash == stateHash
}

func (board *Board) interact(input Input, oldState *State) State {
	transform := board.interactions[input]
	newState := make(State)
	for oldPosition, oldTileState := range *oldState {
		newState[oldPosition] = oldTileState
	}
	for oldPosition, moveTo := range transform {
		newState[moveTo.p] = createRotatedTileState((*oldState)[oldPosition], moveTo.r)
	}
	return newState
}

func (board *Board) showPlay(fromStateMap map[Position]Tile, inputs []Input) {
	state := make(State)
	for position, tile := range fromStateMap {
		state[position] = &TileState{t: tile, r: 0}
	}
	fmt.Println(&state)
	for _, input := range inputs {
		fmt.Printf("-> %v\n", input)
		state = board.interact(input, &state)
		fmt.Println(&state)
	}
}

//
// ------------------------------ STATE REACHABILITY ------------------------------
//

func (board *Board) reachabilityStep(fromNode *ReachabilityTree) []*ReachabilityTree {
	if len(fromNode.then) != 0 {
		panic("elaboration cannot take place at a tree level which already has child StateTrees")
	}
	currently, currentStateIsKnown := board.reachableStateIndex[fromNode.currentStateHash]
	if !currentStateIsKnown {
		panic("state found in state tree, missing from board.states")
	}
	var childTrees []*ReachabilityTree
	for _, input := range board.inputs {
		if input == inverse[fromNode.priorInput] {
			continue // because following an input with its inverse will result in the same state
		}
		nextState := board.interact(input, currently.state)
		nextStateHash := nextState.makeHash()
		if fromNode.currentStateHash == nextStateHash {
			continue // if we haven't changed the board from the last state, then we're not interested
		}
		nextStateRecord, nextStateIsKnown := board.reachableStateIndex[nextStateHash]
		nextTree := (&ReachabilityTree{
			currentStateHash: nextStateHash,
			isLoop:           nextStateIsKnown,
			isSolution:       board.isSolution(nextStateHash),
			priorTree:        fromNode,
			priorInput:       input,
			inputCount:       fromNode.inputCount + 1,
		}).init()
		fromNode.then[input] = nextTree
		if nextStateIsKnown {
			//then we have previously reached it with a sequence of <= length to this one, so record, but don't further explore
			//only append if nextTree has equal length to the minimum tree, which will be all of them
			nextStateRecord.reachedBy = append(nextStateRecord.reachedBy, nextTree)
		} else {
			board.reachableStateIndex[nextStateHash] = &StateRecord{state: &nextState, reachedBy: []*ReachabilityTree{nextTree}}
			childTrees = append(childTrees, nextTree)
		}
	}
	return childTrees
}

func (board *Board) calculateReachability(toDepth int) (counter int) {
	var trees, childTrees []*ReachabilityTree
	trees = append(trees, &board.stateReachability)
	for depth := toDepth; depth > 0 || depth < 0; depth-- {
		counter++
		for _, tree := range trees {
			childTrees = append(childTrees, board.reachabilityStep(tree)...)
		}
		if len(childTrees) == 0 {
			return counter
		}
		trees, childTrees = childTrees, nil
	}
	return counter
}

func (board *Board) statesReaching(tree *ReachabilityTree) []*State {
	states := make([]*State, tree.inputCount+1)
	iTree := tree
	for i := tree.inputCount; i >= 0; i-- {
		states[i] = board.reachableStateIndex[iTree.currentStateHash].state
		iTree = iTree.priorTree
	}
	return states
}

func (stateDict *StateDict) reachabilityTreesByInputLen() (map[int][]*ReachabilityTree, map[int]int) {
	minimalSequences := make(map[int][]*ReachabilityTree)
	stateCountAtReachabilityDepth := make(map[int]int)
	for _, stateRecord := range *stateDict {
		minInputCount := slices.MinFunc(stateRecord.reachedBy, func(a, b *ReachabilityTree) int {
			return cmp.Compare(a.inputCount, b.inputCount)
		}).inputCount
		// minInputCount := stateRecord.reachedBy[0].inputCount
		for _, stateTree := range stateRecord.reachedBy {
			if stateTree.inputCount == minInputCount {
				// if stateTree.inputCount != minInputCount {
				// 	panic("all reachable trees should have the same input count")
				// }
				minimalSequences[stateTree.inputCount] = append(minimalSequences[stateTree.inputCount], stateTree)
			}
		}
		stateCountAtReachabilityDepth[minInputCount] += 1
	}
	return minimalSequences, stateCountAtReachabilityDepth
}

func (board *Board) printStatesForTree(tree *ReachabilityTree) {
	inputs := tree.fromInputs()
	for i, s := range board.statesReaching(tree) {
		fmt.Println(s)
		if i < len(inputs) {
			fmt.Printf("-> %v\n", inputs[i])
		}
	}
}

//
// ------------------------------ UNIQUE INPUT SEQUENCES ------------------------------
//

type InputSequence []Input

type InputSequenceHash uint64

type StateGraph struct {
	stateHash StateHash
	link      map[Input]*StateGraph
}

func (graph *StateGraph) init(forBoard *Board) *StateGraph {
	graph.link = make(map[Input]*StateGraph, len(forBoard.inputs))
	return graph
}

func (board *Board) buildGraph() {
	for stateHash, record := range board.reachableStateIndex {
		if record.graph == nil {
			record.graph = (&StateGraph{stateHash: stateHash}).init(board)
		}
		for _, input := range board.inputs {
			if _, inputKnown := record.graph.link[input]; !inputKnown {
				nextState := board.interact(input, record.state)
				nextStateHash := nextState.makeHash()
				if board.reachableStateIndex[nextStateHash].graph == nil {
					board.reachableStateIndex[nextStateHash].graph = (&StateGraph{stateHash: nextStateHash}).init(board)
				}
				record.graph.link[input] = board.reachableStateIndex[nextStateHash].graph
				board.reachableStateIndex[nextStateHash].graph.link[inverse[input]] = record.graph
			}
		}
	}
}

func (board *Board) uniqueInputSequencesFrom(startingStateHash StateHash, toInputLength int) (
	solutionSeq []InputSequence, loopSeq []InputSequence, unfinishedSeq []InputSequence) {
	workingSeq, waitingSequences := []InputSequence{make(InputSequence, 0, toInputLength)}, []InputSequence{}
	startingGraphLink := board.reachableStateIndex[startingStateHash].graph
	for len(workingSeq) > 0 {
		for _, inputSeq := range workingSeq {
			if len(inputSeq) == toInputLength {
				unfinishedSeq = append(unfinishedSeq, inputSeq)
				continue
			}
		NextInput:
			for _, nextInput := range board.inputs {
				priorLink := startingGraphLink
				for _, priorInput := range inputSeq {
					priorLink = priorLink.link[priorInput]
				}
				nextLink := priorLink.link[nextInput]
				if nextLink.stateHash == priorLink.stateHash {
					continue NextInput // identical adjacent states isn't useful, skip this sequence
				}
				nextInputSeq := append(inputSeq, nextInput)
				if board.isSolution(nextLink.stateHash) {
					solutionSeq = append(solutionSeq, nextInputSeq)
					continue NextInput
				}
				priorLink = startingGraphLink
				for _, priorInput := range inputSeq {
					if priorLink.stateHash == nextLink.stateHash {
						loopSeq = append(loopSeq, nextInputSeq)
						continue NextInput
					}
					priorLink = priorLink.link[priorInput]
				}
				waitingSequences = append(waitingSequences, nextInputSeq)

			}
		}
		workingSeq, waitingSequences = waitingSequences, []InputSequence{}
	}
	return solutionSeq, loopSeq, unfinishedSeq
}

//
// ------------------------------ SIMULATION ------------------------------
//

func (board *Board) simulateInputs(startingStateHash StateHash, inputLength int, iterations int) (
	solutionCount, loopCount, unfinishedCount int) {
NextIteration:
	for iter := iterations; iter > 0; iter-- {
		inputSeq := []Input{}
		encounteredStates := map[StateHash]bool{}
		currentLink := board.reachableStateIndex[startingStateHash].graph
	NextInput:
		for i := 0; i < inputLength; i++ {
			randomOffset := rand.Intn(len(board.inputs))
		TryInputs:
			for indexedOffset := 0; indexedOffset < len(board.inputs); indexedOffset++ {
				// find a random tryInput, but work modulo list length
				tryInput := board.inputs[(indexedOffset+randomOffset)%len(board.inputs)]
				if nextLink, isLinked := currentLink.link[tryInput]; isLinked {
					if board.isSolution(nextLink.stateHash) {
						solutionCount++
						inputSeq = append(inputSeq, tryInput)
						fmt.Println(inputSeq)
						continue NextIteration
					} else if nextLink.stateHash == currentLink.stateHash {
						continue TryInputs
					} else if encounteredStates[nextLink.stateHash] {
						loopCount++
						continue NextIteration
					} else {
						encounteredStates[nextLink.stateHash] = true
						currentLink = nextLink
						inputSeq = append(inputSeq, tryInput)
						continue NextInput
					}
				}
			}
		}
		unfinishedCount++
	}
	return solutionCount, loopCount, unfinishedCount
}

//
// ------------------------------ MAIN ------------------------------
//

func now() string {
	return time.Now().Format(time.RFC3339)
}

func main() {
	fmt.Printf("%v  Calculating state reachability...\n", now())
	treeDepth := simple3x5.calculateReachability(-1)

	fmt.Printf("%v  Number of board States: %d\n", now(), len(simple3x5.reachableStateIndex))
	maxInputs := treeDepth - 1
	reachabilityTreesByLen, stateCountAtReachabilityDepth := simple3x5.reachableStateIndex.reachabilityTreesByInputLen()
	for i := 0; i <= maxInputs; i++ {
		fmt.Printf("At reachability depth %v there are %v unique states with at least %v minimal trees\n", i, stateCountAtReachabilityDepth[i], len(reachabilityTreesByLen[i]))
	}

	exampleTree := reachabilityTreesByLen[8][0]
	fmt.Printf("%v  Print board states for an example input sequence\n", now())
	simple3x5.printStatesForTree(exampleTree)

	fmt.Printf("%v  Building graph...\n", now())
	simple3x5.buildGraph()

	simulationIterations := 10000000
	fmt.Printf("%v  Simulating with %d iterations...\n", now(), simulationIterations)
	for length := 3; length <= 12; length++ {
		solutionCount, loopCount, unfinishedCount := simple3x5.simulateInputs(exampleTree.currentStateHash, length, simulationIterations)
		fmt.Printf("%v At input sequence length %v: %v solutions, %v looped sequences, %v unfinished sequences\n", now(), length, solutionCount, loopCount, unfinishedCount)
	}

	fmt.Printf("%v  Done\n", now())
}
