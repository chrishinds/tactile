/* These ones should be moved from data into a proper main module

import (
	"log"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
)

type Game struct {
	last string
}

func (g *Game) Update() error {

	if ebiten.IsKeyPressed(ebiten.KeyLeft) {
		g.last = "Left"
		log.Print("hello")
	} else if ebiten.IsKeyPressed(ebiten.KeyRight) {
		g.last = "Right"
	} else {
		g.last = ""
	}

	return nil
}

func (g *Game) Draw(screen *ebiten.Image) {
	if g.last != "" {
		ebitenutil.DebugPrint(screen, g.last)
	}
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (screenWidth, screenHeight int) {
	return 320, 240
}

func main() {
	ebiten.SetWindowSize(640, 480)
	ebiten.SetWindowTitle("Hello, World!")
	if err := ebiten.RunGame(&Game{}); err != nil {
		log.Fatal(err)
	}
}
*/

package main

//
// ------------------------------ Listify ------------------------------
//

// IMPORT:
// "strings"
// "github.com/jedib0t/go-pretty/v6/list"

// func (board *Board) listify() string {
// 	ls := list.NewWriter()
// 	board.stateReachability.listify(board.stateIndex, ls, 10000)
// 	ls.UnIndentAll()
// 	ls.AppendItem(fmt.Sprintf("Number of board States: %d\n", len(simple3x5.stateIndex)))
// 	ls.SetStyle(list.StyleConnectedRounded)
// 	return ls.Render()
// }

// func (tree *StateTree) listify(allStates StateDict, ls list.Writer, lengthLimit int) {
// 	if ls.Length() > lengthLimit || lengthLimit < 0 {
// 		return
// 	}
// 	for _, line := range strings.Split(allStates[tree.currentStateHash].state.String(), "\n") {
// 		ls.AppendItem(line)
// 	}
// 	if tree.isLoop {
// 		return
// 	} else {
// 		ls.Indent()
// 		for input, nextTree := range tree.then {
// 			ls.AppendItem(input)
// 			ls.Indent()
// 			nextTree.listify(allStates, ls, lengthLimit)
// 			ls.UnIndent()
// 		}
// 		ls.UnIndent()
// 	}
// }

// exampleInputs := exampleTree.fromInputs()
// fmt.Printf("%v  Calculating unique sequences from %v...\n", now(), exampleInputs)
// for depth := 1; depth <= 8; depth++ {
// 	solutionSeq, loopSeq, unfinishedSeq := simple3x5.uniqueInputSequencesFrom(exampleTree.currentStateHash, depth)
// 	fmt.Printf("At input sequence length %v: %v solutions, %v loops, %v unfinished sequences\n", depth, len(solutionSeq), len(loopSeq), len(unfinishedSeq))
// }
