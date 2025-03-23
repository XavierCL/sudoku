import redraw from "./drawer.js";
import addMouseInteractions from "./userInteraction.js";
import addKeyboardShortcuts from "./keyboard.js";

addMouseInteractions();
addKeyboardShortcuts();

redraw();

// todo better solver
// - square interactions: remove smalls using square line interaction
// - closed group analysis
// todo better remove information, e.g. swap two empty columns is legal for low removal
