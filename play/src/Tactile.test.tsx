import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import App from './Tactile';

function getBoardColours() {
    return Array(15).fill(0).map((_, i) => window.getComputedStyle(screen.getByLabelText('Square ' + i)).backgroundColor);
}

function isSolution(squares: Array<string>) {
    // for a solution we should have three columns with the same colour, so all values in the first row must be different
    const topRowDiffers = (squares[0] != squares[1]) && squares[0] != squares[2] && squares[1] != squares[2];
    // ..and all columns must be equal
    const columnsEqual = [0, 1, 2].map((offset) => Array(5).fill(0).map((_, i) => (squares[offset] == squares[offset + 3 * i])).every(Boolean)).every(Boolean);
    return topRowDiffers && columnsEqual;
}

it('does not begin with the solution', () => {
    render(<App />);
    expect(isSolution(getBoardColours())).toBe(false);
});

it('is solved by a rotate right move', async () => {
    render(<App />);
    const before = getBoardColours();
    expect(isSolution(before)).toBe(false);
    const button = screen.getByLabelText('Rotate Right');
    fireEvent.click(button);
    const aSquare = screen.getByLabelText('Square 3');
    fireEvent.animationEnd(aSquare);
    await waitFor(() => expect(getBoardColours()).not.toEqual(before))
    const after = getBoardColours();
    expect(isSolution(after)).toBe(true);
});

it('is not solved by a rotate left move', async () => {
    render(<App />);
    const before = getBoardColours();
    expect(isSolution(before)).toBe(false);
    const button = screen.getByLabelText('Rotate Left');
    fireEvent.click(button);
    const aSquare = screen.getByLabelText('Square 3');
    fireEvent.animationEnd(aSquare);
    await waitFor(() => expect(getBoardColours()).not.toEqual(before))
    const after = getBoardColours();
    expect(isSolution(after)).toBe(false);
});
