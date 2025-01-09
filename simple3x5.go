package main

var simple3x5 Board

func init() {
	// Setup a board, start by creating some interactions
	var interactions = Interactions{
		up1: Transform{
			p11: MoveTo{p: p12},
			p12: MoveTo{p: p13},
			p13: MoveTo{p: p14},
			p14: MoveTo{p: p15},
			p15: MoveTo{p: p11},
		},
		up2: Transform{
			p21: MoveTo{p: p22},
			p22: MoveTo{p: p23},
			p23: MoveTo{p: p24},
			p24: MoveTo{p: p25},
			p25: MoveTo{p: p21},
		},
		up3: Transform{
			p31: MoveTo{p: p32},
			p32: MoveTo{p: p33},
			p33: MoveTo{p: p34},
			p34: MoveTo{p: p35},
			p35: MoveTo{p: p31},
		},
		left: Transform{
			p12: MoveTo{p: p14},
			p22: MoveTo{p: p13},
			p32: MoveTo{p: p12},
			p13: MoveTo{p: p24},
			p14: MoveTo{p: p34},
			p24: MoveTo{p: p33},
			p34: MoveTo{p: p32},
			p33: MoveTo{p: p22},
		},
	}
	interactions[down1] = invert(interactions[up1])
	interactions[down2] = invert(interactions[up2])
	interactions[down3] = invert(interactions[up3])
	interactions[right] = invert(interactions[left])

	// create an initial board state by assigning tiles to positions (all with 0 rotation)
	var initialState = make(State)
	var setupInitialState = map[Tile][]Position{
		tR: {p11, p12, p13, p14, p15},
		tG: {p21, p22, p23, p24, p25},
		tB: {p31, p32, p33, p34, p35},
	}
	for tile, inPositions := range setupInitialState {
		for _, position := range inPositions {
			initialState[Position(position)] = &TileState{t: tile, r: 0}
		}
	}

	// create the board and assign to global
	simple3x5 = *(&Board{
		interactions: interactions,
		inputs:       []Input{up1, down1, up2, down2, up3, down3, left, right},
	}).init(initialState)
}
