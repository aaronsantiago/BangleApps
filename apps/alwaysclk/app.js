var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
const storage = require('Storage');
const locale = require("locale");
const SETTINGS_FILE = "alwaysclk.json";
const LOCATION_FILE = "mylocation.json";
const h = g.getHeight();
const w = g.getWidth();
let settings;
let location;
const CenterX = this.x + 12, CenterY = this.y + 12, Radius = 11;
var southernHemisphere = false; // when in southern hemisphere, use the "My Location" App

const simulate = false; // simulate one month in one minute
const updateR = 100; // update every x ms in simulation
const simulateDay = "Monday";
const simulateMonth = "June";

let pal1; // palette for 0-40%
let pal2; // palette for 50-100%
const infoLine = (3*h/4) + 0;

function assignPalettes() {
  if (true || g.theme.dark) {
    // palette for 0-40%
    pal1 = new Uint16Array([g.theme.bg, g.toColor(settings.gy), g.toColor(settings.fg), g.toColor("#00f")]);
    // palette for 50-100%
    pal2 = new Uint16Array([g.theme.bg, g.toColor(settings.fg), g.toColor(settings.gy), g.toColor("#00f")]);
  } else {
    // palette for 0-40%
    pal1 = new Uint16Array([g.theme.bg, g.theme.fg, g.toColor(settings.fg), g.toColor("#00f")]);
    // palette for 50-100%
    pal2 = new Uint16Array([g.theme.bg, g.toColor(settings.fg), g.theme.fg, g.toColor("#00f")]);
  }
}

function moonPhase() {
  const d = Date();
  var month = d.getMonth(), year = d.getFullYear(), day = d.getDate();
  if (simulate) day = d.getSeconds() / 2 +1;
  if (month < 3) {year--; month += 12;}
  mproz = ((365.25 * year + 30.6 * ++month + day - 694039.09) /  29.5305882);
  mproz = mproz - (mproz | 0);  // strip integral digits, result is between 0 and <1
  return (mproz);
}

// code source: github.com/rozek/banglejs-2-activities/blob/main/README.md#drawmoonphase
function drawMoonPhase (CenterX,CenterY, Radius, leftFactor,rightFactor) {
  
  g.setColor('#808080');
  g.fillCircle(CenterX, CenterY, Radius - 1);
  g.setColor('#00FF00');
  let x = Radius, y = 0, Error = Radius;
  g.drawLine(CenterX-leftFactor*x,CenterY, CenterX+rightFactor*x,CenterY);
  let dx,dy;
  while (y <= x) {
    dy = 1 + 2*y; y++; Error -= dy;
    if (Error < 0) {
      dx = 1 - 2*x; x--; Error -= dx;
    }
    g.drawLine(CenterX-leftFactor*x,CenterY-y, CenterX+rightFactor*x,CenterY-y);
    g.drawLine(CenterX-leftFactor*x,CenterY+y, CenterX+rightFactor*x,CenterY+y);
    g.drawLine(CenterX-leftFactor*y,CenterY-x, CenterX+rightFactor*y,CenterY-x);
    g.drawLine(CenterX-leftFactor*y,CenterY+x, CenterX+rightFactor*y,CenterY+x);
  }
}

Graphics.prototype.setSmallFont = function(scale) {
  // Actual height 28 (27 - 0)
  this.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//84D//zgP/+GAAAAAAAAAAAAAAAAAAAD4AAAPgAAA+AAAAAAAAAAAAA+AAAD4AAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAg4AAHDgAAcOCABw54AHD/gAf/8AD/8AB//gAP8OAA9w4YCHD/gAcf+AB//gAf/gAP/uAA/w4ADnDgAAcOAABw4AAHAAAAcAAAAAAAAAAAAAAAIAA+A4AH8HwA/4PgHjgOAcHAcBwcBw/BwH78DgfvwOB8HA4HAOBw8A+HngB4P8ADgfgAAAYAAAAAAAAAAB4AAAf4AQB/gDgOHAeA4cDwDhweAOHDwA88eAB/nwAD88AAAHgAAA8AAAHn4AA8/wAHnvgA8cOAHhg4A8GDgHgcOA8B74BgD/AAAH4AAAAAAAAAAAAAAAAAMAAAH8AD8/4Af/3wB/8HgODwOA4HA4DgODgOAcOA4A44DwDzgHAH8AMAPwAQP+AAA/8AAAB4AAADAAAAAA+AAAD4AAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/8AD//+A/+/+H4AD98AAB3gAADIAAAAAAAAAAAAAIAAABwAAAXwAAHPwAB8P8D/gP//4AH/8AAAAAAAAAAAAAAAAAAAAAAAAGAAAA4gAAB/AAAH8AAD/AAAP8AAAH4AAAfwAADiAAAOAAAAAAAAAAAAAAGAAAAYAAABgAAAGAAAAYAAABgAAD/+AAP/4AABgAAAGAAAAYAAABgAAAGAAAAYAAAAAAAAAAAAAADkAAAPwAAA/AAAAAAAAAAAAAAAAAAAAAAAAABgAAAGAAAAYAAABgAAAGAAAAYAAABgAAAGAAAAYAAAAAAAAAAAAAAAAAAAAAAADgAAAOAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAA4AAA/gAA/+AA//AA//AAP/AAA/AAADAAAAAAAAAAAAAAAAAAA//gAP//gB///AHgA8A8AB4DgADgOAAOA4AA4DgADgPAAeAeADwB///AD//4AD/+AAAAAAAAAAAAAAAA4AAAHgAAAcAAADwAAAP//+A///4D///gAAAAAAAAAAAAAAAAAAAAAAYAeADgD4AeAfAD4DwAfgOAD+A4Ae4DgDzgOAeOA4Dw4DweDgH/wOAP+A4AfwDgAAAAAAAAAAAAIAOAA4A4ADwDggHAOHgOA48A4DnwDgO/AOA7uA4D84HgPh/8A8H/gDgH8AAACAAAAAAAAAAAAAHgAAB+AAA/4AAP7gAD+OAA/g4AP4DgA+AOADAA4AAB/+AAH/4AAf/gAADgAAAOAAAAAAAAAAAAAAAAD4cAP/h4A/+HwDw4HgOHAOA4cA4DhwDgOHAOA4cA4Dh4HAOD58A4H/gAAP8AAAGAAAAAAAAAAAAAAAAD/+AAf/8AD//4AePDwDw4HgOHAOA4cA4DhwDgOHAOA4cB4Bw8PAHD/8AIH/gAAH4AAAAAAAAAADgAAAOAAAA4AAYDgAHgOAD+A4B/wDgf4AOP+AA7/AAD/gAAP4AAA8AAAAAAAAAAAAAAAAAAeH8AD+/4Af//wDz8HgOHgOA4OA4Dg4DgODgOA4eA4Dz8HgH//8AP7/gAeH8AAAAAAAAAAAAAAAA+AAAH+AgB/8HAHh4cA8Dg4DgODgOAcOA4Bw4DgODgPA4eAeHDwB///AD//4AD/+AAAAAAAAAAAAAAAAAAAAAAAAAAODgAA4OAADg4AAAAAAAAAAAAAAAAAAAAAAAAAAAAABwA5AHAD8AcAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAB8AAAP4AAB5wAAPDgAB4HAAHAOAAIAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGMAAAYwAABjAAAGMAAAYwAABjAAAGMAAAYwAABjAAAGMAAAYwAABjAAAGMAAAYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAEAAcA4AB4HAADw4AADnAAAH4AAAPAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAB8AAAHgAAA4AAADgDzgOA/OA4D84DgeAAPHwAAf+AAA/wAAB8AAAAAAAAAAAAAAAAAAD+AAB/+AAP/8AB4B4AOABwBwADgHB8OA4P4cDhxxwMGDDAwYMMDBgwwOHHHA4f4cDh/xwHAHCAcAMAA8AwAB8PAAD/4AAD/AAAAAAAAAAAAAACAAAB4AAB/gAA/8AAf+AAP/wAH/nAA/gcADwBwAPwHAA/4cAA/9wAAf/AAAP/AAAD/gAAB+AAAA4AAAAAAAAAAAAAAD///gP//+A///4DgcDgOBwOA4HA4DgcDgOBwOA4HA4Dg8DgPHwOAf/h4A///AB8f4AAAfAAAAAAAP+AAD/+AAf/8AD4D4AeADwBwAHAOAAOA4AA4DgADgOAAOA4AA4DgADgOAAOAcABwB4APAD4D4AHgPAAOA4AAAAAAAAAAAAAAAP//+A///4D///gOAAOA4AA4DgADgOAAOA4AA4DgADgOAAOA8AB4BwAHAHwB8AP//gAP/4AAP+AAAAAAAAAAAAAAAA///4D///gP//+A4HA4DgcDgOBwOA4HA4DgcDgOBwOA4HA4DgcDgOBgOA4AA4AAAAAAAAAAAAAAD///gP//+A///4DgcAAOBwAA4HAADgcAAOBwAA4HAADgcAAOAwAA4AAAAAAAAAf+AAD/+AA//+ADwB4AeADwDwAHgOAAOA4AA4DgADgOAAOA4AA4DgMDgPAweAcDBwB8MfADw/4AHD/AAAPwAAAAAAAAAAAAAAAP//+A///4D///gABwAAAHAAAAcAAABwAAAHAAAAcAAABwAAAHAAAAcAAABwAA///4D///gP//+AAAAAAAAAAAAAAAAAAAD///gP//+A///4AAAAAAAAAAAADgAAAPAAAA+AAAA4AAADgAAAOAAAA4AAAHgP//8A///wD//8AAAAAAAAAAAAAAAAAAAA///4D///gP//+AAHAAAA+AAAP8AAB54AAPDwAB4HgAPAPAB4AfAPAA+A4AA4DAABgAAACAAAAAAAAAAP//+A///4D///gAAAOAAAA4AAADgAAAOAAAA4AAADgAAAOAAAA4AAADgAAAAAAAAAAAAAAP//+A///4D///gD+AAAD+AAAB+AAAB/AAAB/AAAB/AAAB+AAAH4AAB+AAA/gAAP4AAD+AAA/AAAfwAAD///gP//+A///4AAAAAAAAAAAAAAAAAAAP//+A///4D///gHwAAAPwAAAPgAAAfgAAAfAAAAfAAAA/AAAA+AAAB+AAAB8A///4D///gP//+AAAAAAAAAAAP+AAD/+AAf/8AD4D4AeADwBwAHAOAAOA4AA4DgADgOAAOA4AA4DgADgOAAOAcABwB4APAD4D4AH//AAP/4AAP+AAAAAAAAAAAP//+A///4D///gOAcAA4BwADgHAAOAcAA4BwADgHAAOAcAA4DgAD4eAAH/wAAP+AAAPgAAAAAAAA/4AAP/4AB//wAPgPgB4APAHAAcA4AA4DgADgOAAOA4AA4DgADgOAAOA4AO4BwA/AHgB8APgPwAf//gA//uAA/4QAAAAAAAAAA///4D///gP//+A4BwADgHAAOAcAA4BwADgHAAOAcAA4B8ADgP8APh/8Af/H4A/4HgA+AGAAAAAAAAAAAABgAHwHAA/g+AH/A8A8cBwDg4DgODgOA4OA4DgcDgOBwOA4HA4DwODgHg4cAPh/wAcH+AAwPwAAAAADgAAAOAAAA4AAADgAAAOAAAA4AAAD///gP//+A///4DgAAAOAAAA4AAADgAAAOAAAA4AAADgAAAAAAAAAAAAAAAAAP//AA///AD//+AAAB8AAABwAAADgAAAOAAAA4AAADgAAAOAAAA4AAAHgAAA8A///gD//8AP//gAAAAAAAAAAIAAAA8AAAD+AAAH/AAAD/wAAB/4AAA/8AAAf4AAAPgAAB+AAA/4AAf+AAP/AAH/gAD/wAAP4AAA4AAAAAAAAPAAAA/gAAD/4AAA/+AAAf/AAAH/gAAB+AAAf4AAf/AAf/AAP/gAD/gAAPwAAA/4AAA/+AAAf/AAAH/wAAB/gAAB+AAB/4AA/+AA/+AA/+AAD/AAAPAAAAgAAAAAAAAMAAGA4AA4D4APgHwB8APwfAAPn4AAf+AAAfwAAB/AAAf+AAD4+AA/B8AHwB8A+AD4DgADgMAAGAwAAADwAAAPwAAAPwAAAfgAAAfgAAAf/4AAf/gAH/+AB+AAAPwAAD8AAA/AAADwAAAMAAAAgAAAAAAAAMAACA4AA4DgAPgOAD+A4Af4DgH7gOB+OA4Pw4Dj8DgO/AOA/4A4D+ADgPgAOA4AA4DAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////gAAAOAAAA4AAADAAAAAAAAAAAAAAAAAAAAAAA4AAAD+AAAP/gAAH/4AAB/+AAAf+AAAH4AAABgAAAAAAAAADAAAAOAAAA4AAADgAAAP////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAADgAAAcAAADgAAAcAAADgAAAcAAAB4AAADwAAADgAAAHAAAAOAAAAYAAAAAAAAAAAAAAAAAAAAMAAAAwAAADAAAAMAAAAwAAADAAAAMAAAAwAAADAAAAMAAAAwAAADAAAAMAAAAwAAADAAAAMAAAAwAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAHH8AA8/4AHzjgAcMOABxwYAHHBgAccOABxwwAHGHAAP/4AA//4AA//gAAAAAAAAAAAAAAAAAAA///4D///gP//+AA4BwAHADgAcAOABwA4AHADgAcAOAB4B4ADwPAAP/8AAf/AAAf4AAAAAAAAAAAAPwAAD/wAAf/gADwPAAeAeABwA4AHADgAcAOABwA4AHADgAeAeAA8DwABwOAADAwAAAAAAAAAAAA/AAAP/AAD//AAPA8AB4B4AHADgAcAOABwA4AHADgAcAOAA4BwD///gP//+A///4AAAAAAAAAAAAAAAAPwAAD/wAAf/gAD2PAAeYeABxg4AHGDgAcYOABxg4AHGDgAeYeAA/jwAB+OAAD4wAABgAAAAAAAAAAABgAAAGAAAB//+Af//4D///gPcAAA5gAADGAAAMYAAAAAAAAAPwAAD/wMA//w4DwPHgeAePBwA4cHADhwcAOHBwA4cHADhwOAcPB///4H///Af//wAAAAAAAAAAAAAAAAAAD///gP//+AA//4ADgAAAcAAABwAAAHAAAAcAAABwAAAHgAAAP/+AAf/4AA//gAAAAAAAAAAAAAAMf/+A5//4Dn//gAAAAAAAAAAAAAAAAAAHAAAAfn///+f//+5///wAAAAAAAAAAAAAAAAAAP//+A///4D///gAAcAAAD8AAAf4AADzwAAeHgAHwPAAeAeABgA4AEABgAAAAAAAAAD///gP//+A///4AAAAAAAAAAAAAAAAAAAAf/+AB//4AH//gAOAAABwAAAHAAAAcAAABwAAAHgAAAP/+AA//4AB//gAOAAABwAAAHAAAAcAAABwAAAHgAAAf/+AA//4AA//gAAAAAAAAAAAAAAAf/+AB//4AD//gAOAAABwAAAHAAAAcAAABwAAAHAAAAeAAAA//4AB//gAD/+AAAAAAAAAAAAAAAAD8AAA/8AAH/4AA8DwAHgHgAcAOABwA4AHADgAcAOABwA4AHgHgAPh8AAf/gAA/8AAA/AAAAAAAAAAAAAAAAB///8H///wf///A4BwAHADgAcAOABwA4AHADgAcAOAB4B4ADwPAAP/8AAf/AAAf4AAAAAAAAAAAAPwAAD/wAA//wADwPAAeAeABwA4AHADgAcAOABwA4AHADgAOAcAB///8H///wf///AAAAAAAAAAAAAAAAAAAH//gAf/+AB//4ADwAAAcAAABwAAAHAAAAcAAAAAAAAAAMAAHw4AA/jwAH+HgAcYOABxw4AHHDgAcMOABw44AHjjgAPH+AA8fwAAw+AAAAAABgAAAGAAAAcAAAf//wB///AH//+ABgA4AGADgAYAOABgA4AAAAAAAAAAAAAAAH/AAAf/wAB//wAAB/AAAAeAAAA4AAADgAAAOAAAA4AAADgAAAcAB//4AH//gAf/+AAAAAAAAAAAAAAABwAAAH4AAAf8AAAP8AAAH+AAAD+AAAD4AAA/gAAf8AAP+AAH/AAAfgAABwAAAAAAAAAAAABwAAAH8AAAf+AAAP/gAAD/gAAB+AAAf4AAP8AAP+AAB/AAAH4AAAf8AAAP+AAAD/gAAB+AAAf4AAf/AAP/AAB/gAAHgAAAQAAABAAIAHADgAeAeAA8HwAB8+AAD/gAAD8AAAPwAAD/gAAfPgADwfAAeAeABwA4AEAAgAAAAABAAAAHgAAAfwAAA/wAAAf4BwAP4/AAP/8AAP+AAD/AAB/wAA/4AAP8AAB+AAAHAAAAQAAAAAAIAHADgAcAeABwD4AHA/gAcHuABx84AHPDgAf4OAB/A4AHwDgAeAOABgA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAH4Af//////n//AAAA4AAADgAAAAAAAAAAAAAAAAAP//+A///4D///gAAAAAAAAAAAAAAAAAAA4AAADgAAAOAAAA//5/9////wAH4AAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAeAAAD4AAAOAAAA4AAADgAAAHAAAAcAAAA4AAADgAAAOAAAD4AAAPAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"), 32, atob("BgkMGhEZEgYMDAwQCAwICxILEBAREBEOEREJCREVEQ8ZEhEUExAOFBQHDREPGBMUERQSEhEUERsREBIMCwwTEg4QERAREQoREQcHDgcYEREREQoPDBEPFg8PDwwIDBMc"), 28+(scale<<8)+(1<<16));
  return this;
};

Graphics.prototype.setFontKdamThmor = function(scale) {
  // Actual height 72 (71 - 0)
  g.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAH+AAAAAAAAAAAAAP/AAAAAAAAAAAAAf/gAAAAAAAAAAAA//gAAAAAAAAAAAA//wAAAAAAAAAAAA//wAAAAAAAAAAAA//wAAAAAAAAAAAA//wAAAAAAAAAAAA//gAAAAAAAAAAAAf/gAAAAAAAAAAAAf/AAAAAAAAAAAAAP+AAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAB/AAAAAAAAAAAAAP/AAAAAAAAAAAAA//AAAAAAAAAAAAH/+AAAAAAAAAAAAf/+AAAAAAAAAAAD//+AAAAAAAAAAAf//8AAAAAAAAAAB///4AAAAAAAAAAP///wAAAAAAAAAA////AAAAAAAAAAH///4AAAAAAAAAAf///gAAAAAAAAAD///8AAAAAAAAAAf///wAAAAAAAAAB///+AAAAAAAAAAP///4AAAAAAAAAA////AAAAAAAAAAH///4AAAAAAAAAAf///gAAAAAAAAAD///8AAAAAAAAAAP///wAAAAAAAAAB///+AAAAAAAAAAP///4AAAAAAAAAA////AAAAAAAAAAD///4AAAAAAAAAAP///gAAAAAAAAAAf//8AAAAAAAAAAA///wAAAAAAAAAAA//+AAAAAAAAAAAA//4AAAAAAAAAAAA//AAAAAAAAAAAAA/4AAAAAAAAAAAAA/gAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//AAAAAAAAAAAP///+AAAAAAAAAD/////wAAAAAAAAP/////+AAAAAAAA///////gAAAAAAD///////4AAAAAAH///////8AAAAAAf///////+AAAAAA/////////gAAAAB/////////wAAAAB/////////wAAAAD/////////4AAAAH///AAA///8AAAAH//wAAAB//8AAAAP/+AAAAAP/+AAAAP/4AAAAAD/+AAAAf/gAAAAAA//AAAAf/AAAAAAAf/AAAAf+AAAAAAAP/AAAA/+AAAAAAAP/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/8AAAAAAAH/gAAA/+AAAAAAAP/gAAAf+AAAAAAAP/AAAAf/AAAAAAAf/AAAAf/gAAAAAA//AAAAP/4AAAAAD/+AAAAP/+AAAAAP/+AAAAH//gAAAA//8AAAAH///AAAf//8AAAAD/////////4AAAAD/////////wAAAAB/////////wAAAAA/////////gAAAAAf////////AAAAAAH///////8AAAAAAD///////4AAAAAAA///////gAAAAAAAP/////+AAAAAAAAD/////4AAAAAAAAAf////AAAAAAAAAAA///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAADwAAAAAAAAAAAAAD4AAAAAAAAAAAAAH8AAAAAAAAAAAAAP+AAAAAAAAAAAAAf/AAAAAH/AAAAAA//AAAAAH/AAAAAB//AAAAAH/AAAAAB//AAAAAH/AAAAAD/+AAAAAH/AAAAAH/8AAAAAH/AAAAAP/4AAAAAH/AAAAAf/wAAAAAH/AAAAA//gAAAAAH/AAAAB//gAAAAAH/AAAAB//AAAAAAH/AAAAD/+AAAAAAH/AAAAH/8AAAAAAH/AAAAP//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAHgAAAAAD/AAAAAA/wAAAAAH/AAAAAD/wAAAAAP/AAAAAH/wAAAAAf/AAAAAP/wAAAAA//AAAAA//wAAAAB//AAAAB//wAAAAD//AAAAB//wAAAAH//AAAAD//wAAAAP//AAAAH//wAAAAf//AAAAH//gAAAA///AAAAP/+AAAAB///AAAAP/4AAAAD///AAAAf/gAAAAH///AAAAf/AAAAAP///AAAAf+AAAAAf///AAAAf+AAAAA//v/AAAA/8AAAAB//P/AAAA/8AAAAD/+P/AAAA/8AAAAH/8P/AAAA/8AAAAP/4P/AAAA/8AAAAf/wf/AAAA/8AAAA//gf/AAAA/8AAAD//Af/AAAA/8AAAH/+Af/AAAA/+AAAP/8Af/AAAA/+AAAf/4Af/AAAAf/AAB//wAf/AAAAf/gAD//gAf/AAAAf/wAf//AAf/AAAAf/+D//+AAf/AAAAP/////8AAf/AAAAP/////4AAf/AAAAH/////wAAf/AAAAH/////gAAf/AAAAD/////AAAf/AAAAB////8AAAf/AAAAA////4AAAf/AAAAAf///wAAAf/AAAAAP///AAAAf/AAAAAD//8AAAAf/AAAAAA//gAAAAP/AAAAAABwAAAAAH/AAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAfAAAAAAAAHgAAAA/wAAAAAAA/wAAAA/8AAAAAAD/wAAAB/+AAAAAAH/wAAAB//AAAAAAP/wAAAB//gAAAAA//wAAAB//wAAAAB//wAAAB//4AAAAB//wAAAB//8AAAAD//wAAAA//8AAAAH//wAAAAf/+AAAAH//gAAAAH/+AAAAP/+AAAAAB//AAAAP/4AAAAAA//AAAAf/gAAAAAAf/AAAAf/AAAAAAAf/AAAAf/AAAAAAAP/gAAAf+AAAAAAAP/gAAA/+AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAD/gAAH/gAAA/8AAH/wAAH/gAAA/8AAH/wAAP/gAAA/+AAH/wAAP/AAAAf/AAP/4AAf/AAAAf/AAf/4AA//AAAAf/wA//8AB//AAAAf/+H//+AD/+AAAAP//////4f/+AAAAP////v////8AAAAH////v////8AAAAH////H////4AAAAD////H////wAAAAB///+D////wAAAAA///8D////gAAAAAf//4B////AAAAAAP//wA///+AAAAAAD//AAf//4AAAAAAAf4AAH//gAAAAAAAAAAAB/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAAAAAAAAAAAD/gAAAAAAAAAAAAP/wAAAAAAAAAAAAf/wAAAAAAAAAAAA//wAAAAAAAAAAAD//wAAAAAAAAAAAH//wAAAAAAAAAAAP//wAAAAAAAAAAA///wAAAAAAAAAAB///wAAAAAAAAAAD///wAAAAAAAAAAP///wAAAAAAAAAAf///wAAAAAAAAAA//9/wAAAAAAAAAD//x/wAAAAAAAAAH//h/wAAAAAAAAAP/+B/wAAAAAAAAA//8B/wAAAAAAAAB//4B/wAAAAAAAAD//gB/wAAAAAAAAP//AB/wAAAAAAAAf/+AB/wAAAAAAAA//4AB/wAAAAAAAD//wAB/wAAAAAAAH//AAB/wAAAAAAAP/+AAB/wAAAAAAA//8AAB/wAAAAAAB//wAAB/wAAAAAAD//gAAB/wAAAAAAP/+AAAB/wAAAAAAf/8AAAB/wAAAAAAf/5////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAf//////////AAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/wAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAPgAAAAAAAAAAAAA/wAAAAAAAAD4AAB/4AAAAAAAD/4AAB/4AAAAAAD//4AAB/8AAAAAD///8AAB/8AAAAD////8AAB/+AAAAf////8AAA/+AAAAf////+AAA/+AAAAf////+AAAf/AAAAf////8AAAf/AAAAf////8AAAP/AAAAf////8AAAP/AAAAf//4/4AAAH/gAAAf/8A/4AAAH/gAAAf+AA/4AAAH/gAAAf+AA/4AAAH/gAAAf+AA/4AAAH/gAAAf+AA/4AAAH/gAAAf+AA/4AAAH/gAAAf+AB/4AAAH/gAAAf+AB/4AAAH/gAAAf+AA/8AAAP/gAAAf+AA/8AAAP/AAAAf+AA/8AAAP/AAAAf+AA/+AAAf/AAAAf+AA/+AAA//AAAAf+AA//AAB/+AAAAf+AAf/gAD/+AAAAf+AAf/4Af/8AAAAf+AAf/////8AAAAf+AAP/////4AAAAf+AAP/////wAAAAf+AAH/////wAAAAf+AAD/////gAAAAf+AAD/////AAAAAf+AAB////+AAAAAf8AAA////8AAAAAf4AAAP///wAAAAAfgAAAH///AAAAAAAAAAAA//8AAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAB///AAAAAAAAAAAP///wAAAAAAAAAA////8AAAAAAAAAB////+AAAAAAAAAH/////AAAAAAAAAP/////gAAAAAAAA//////wAAAAAAAB//////4AAAAAAAH//////8AAAAAAAP//////8AAAAAAAf//+AP/+AAAAAAB///4AB/+AAAAAAD///wAA/+AAAAAAH///gAAf/AAAAAAf///AAAP/AAAAAA///+AAAP/AAAAAB///+AAAH/gAAAAH//3+AAAH/gAAAAP//v8AAAH/gAAAAf//P8AAAH/gAAAB//+P8AAAH/gAAAD//4f8AAAH/gAAAH//wf8AAAH/gAAAP//gf8AAAH/gAAAf//Af8AAAH/gAAAf/8Af+AAAH/gAAAf/4Af+AAAP/AAAAf/wAf+AAAP/AAAAf/gAf/AAAf/AAAAf/AAP/gAA//AAAAf8AAP/wAB/+AAAAf4AAP/4AD/+AAAAfwAAP//Af/8AAAAfgAAH/////8AAAAeAAAH/////4AAAAcAAAD/////4AAAAYAAAD/////wAAAAQAAAB/////gAAAAAAAAA/////AAAAAAAAAAf///+AAAAAAAAAAP///8AAAAAAAAAAD///wAAAAAAAAAAB///AAAAAAAAAAAAP/8AAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf8AAAAAAAAAAAAAf+AAAAAAAAAAAAAf+AAAAAAAAAAAAAf+AAAAAAAAAAAAAf+AAAAAAAAAAAAAf+AAAAAAAABAAAAf+AAAAAAAAHAAAAf+AAAAAAAAfAAAAf+AAAAAAAB/AAAAf+AAAAAAAH/AAAAf+AAAAAAAf/AAAAf+AAAAAAB//AAAAf+AAAAAAH//AAAAf+AAAAAAf//AAAAf+AAAAAB///AAAAf+AAAAAH///AAAAf+AAAAAf///AAAAf+AAAAB///+AAAAf+AAAAH///8AAAAf+AAAAf///wAAAAf+AAAA////AAAAAf+AAAD///8AAAAAf+AAAP///wAAAAAf+AAA////AAAAAAf+AAD///8AAAAAAf+AAP///wAAAAAAf+AA////AAAAAAAf+AD///8AAAAAAAf+AP///wAAAAAAAf+A////AAAAAAAAf+D///8AAAAAAAAf+P///wAAAAAAAAf+f//+AAAAAAAAAf////4AAAAAAAAAf////gAAAAAAAAAf///+AAAAAAAAAAf///4AAAAAAAAAAf///gAAAAAAAAAAf//+AAAAAAAAAAAf//4AAAAAAAAAAAf//gAAAAAAAAAAAf/+AAAAAAAAAAAAf/4AAAAAAAAAAAAf/gAAAAAAAAAAAAf+AAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAAAAAAAAAAB//gAAAAAAADwAAH//4AAAAAAA//AAf//8AAAAAAD//wA////AAAAAAP//4B////gAAAAAf//+B////wAAAAA////D////wAAAAB////H////4AAAAD////n////8AAAAH/////////8AAAAH/////////+AAAAP//////wP/+AAAAP//////AB/+AAAAf/wD//8AA//AAAAf/AA//4AAf/AAAAf+AAf/4AAP/AAAAf8AAP/wAAH/AAAA/8AAH/wAAH/gAAA/4AAH/gAAH/gAAA/4AAH/gAAD/gAAA/4AAD/gAAD/gAAA/4AAD/gAAD/gAAA/4AAD/gAAD/gAAA/4AAD/gAAD/gAAA/4AAD/gAAD/gAAA/4AAH/gAAH/gAAA/8AAH/wAAH/gAAAf8AAP/wAAH/gAAAf+AAP/wAAP/AAAAf/AAf/4AAf/AAAAf/wB//8AAf/AAAAP/////+AB//AAAAP//////wH/+AAAAH/////////+AAAAH/////////8AAAAD////n////8AAAAB////H////4AAAAA////D////wAAAAAf//+B////wAAAAAP//8B////gAAAAAH//wA////AAAAAAB//AAf//8AAAAAAAH4AAH//4AAAAAAAAAAAB//gAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/8AAAAAAAAAAAAf//AAAAAAAAAAAB///wAAAAAAAAAAH///4AAAAAAAAAAP///+AAAAAAAAAAf////AAAAAAAAAA/////AAAADAAAAB/////gAAAHAAAAD/////wAAAPAAAAH/////wAAAfAAAAH/////4AAB/AAAAP//A//4AAD/AAAAP/4AH/8AAH/AAAAf/gAD/8AAP/AAAAf/AAB/8AA//AAAAf+AAA/8AB//AAAAf+AAA/8AD//AAAA/8AAAf8AH//AAAA/8AAAf8Af//AAAA/8AAAf8A//+AAAA/8AAAf8B//+AAAA/8AAAf8D//8AAAA/8AAAf8P//wAAAA/8AAAf8f//gAAAA/8AAAf4//+AAAAA/8AAAf5//8AAAAA/8AAAf3//4AAAAAf+AAA////gAAAAAf+AAB////AAAAAAf/AAB///8AAAAAAf/gAD///4AAAAAAP/4AP///gAAAAAAP//B////AAAAAAAH//////+AAAAAAAH//////4AAAAAAAD//////wAAAAAAAB//////AAAAAAAAA/////+AAAAAAAAAf////4AAAAAAAAAP////wAAAAAAAAAH////AAAAAAAAAAB///8AAAAAAAAAAAf//gAAAAAAAAAAAB/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAD8AAAAAAAA/4AAAP+AAAAAAAB/8AAAf/AAAAAAAB/+AAAf/gAAAAAAD/+AAA//gAAAAAAD//AAA//wAAAAAAD//AAA//wAAAAAAD//AAA//wAAAAAAD//AAA//wAAAAAAD/+AAA//gAAAAAAB/+AAAf/gAAAAAAA/8AAAP/AAAAAAAAf4AAAH+AAAAAAAAHgAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"), 46, atob("FCM0NDQ0NDQ0NDQ0GA=="), 90+(scale<<8)+(1<<16));
}

function setLargeFont() {
  g.setFontKdamThmor(1);
}

function setSmallFont() {
  // g.setFont('Vector', 16);
  // g.setFontUbuntuMono(1);
  g.setSmallFont(1);
}

function getSteps() {
  try {
    return Bangle.getHealthStatus("day").steps;
  } catch (e) {
    if (WIDGETS.wpedom !== undefined) 
      return WIDGETS.wpedom.getSteps();
    else
      return 0;
  }
}

/////////////// sunrise / sunset /////////////////////////////

function loadSettings() {
  settings = storage.readJSON(SETTINGS_FILE,1)||{};
  settings.gy = settings.gy||'#020';
  settings.fg = settings.fg||'#0f0';
  settings.idle_check = settings.idle_check||true;
  assignPalettes();
}

// requires the myLocation app
function loadLocation() {
  location = storage.readJSON(LOCATION_FILE,1)||{};
  location.lat = location.lat||51.5072;
  location.lon = location.lon||0.1276;
  location.location = location.location||"London";
}

function extractTime(d){
  var h = d.getHours(), m = d.getMinutes();
  if (simulate) h = (d.getSeconds() * Math.pow(E.hwRand(),2)) % 24;
  if (simulate) m = (d.getSeconds() * Math.pow(E.hwRand(),2)) % 60;
  return(("" + h).substr(-2) + ":" + ("0"+m).substr(-2));
}

var sunRise = "0:00";
var sunSet = "00:00";
var drawCount = 0;

function updateSunRiseSunSet(now, lat, lon, line){
  // get today's sunlight times for lat/lon
  var times = SunCalc.getTimes(new Date(), lat, lon);

  // format sunrise time from the Date object
  sunRise = extractTime(times.sunrise);
  sunSet = extractTime(times.sunset);
}

const infoData = {
  ID_DATE:  { calc: () => {var d = (new Date()).toString().split(" "); return (simulate ? simulateMonth : d[1]) + ' ' + d[2]} },
  ID_SS:    { calc: () => sunRise + '-' + sunSet },
  ID_DOW:  { calc: () => simulate ? simulateDay : locale.dow(new Date()).toLowerCase() },
};

const infoList = Object.keys(infoData).sort();

function drawInfo() {
  g.setColor(g.theme.fg);
  setSmallFont();
  g.setFontAlign(-1,0);

  g.drawString((infoData["ID_DOW"].calc().toUpperCase()), 4, infoLine - 30);
  g.drawString((infoData["ID_DATE"].calc().toUpperCase()), 4, infoLine);
  g.drawString((infoData["ID_SS"].calc().toUpperCase()), 4, infoLine + 30);

}


function getGradientColor(color, percent) {
  if (isNaN(percent)) percent = 0;
  if (percent > 1) percent = 1;
  const colorList = [
    '#00FF00', '#80FF00', '#FFFF00', '#FF8000', '#FF0000'
  ];
  if (color == "fg") {
    color = colorFg;
  }
  if (color == "green-red") {
    const colorIndex = Math.round(colorList.length * percent);
    return colorList[Math.min(colorIndex, colorList.length) - 1] || "#00ff00";
  }
  if (color == "red-green") {
    const colorIndex = colorList.length - Math.round(colorList.length * percent);
    return colorList[Math.min(colorIndex, colorList.length)] || "#ff0000";
  }
  return color;
}

function radians(a) {
  return a * Math.PI / 180;
}
function drawGauge(cx, cy, percent, color) {
  const radiusInner = 15;
  const radiusOuter = 20;

  // Draw grey background circle:
  g.setColor('#808080');
  g.fillCircle(cx, cy, radiusOuter);


  const offset = 0;
  const end = 360 - offset;
  const radius = radiusInner + 2;
  const size = radiusOuter - radiusInner - 2;

  if (percent > 1) percent = 1;

  const startRotation = -offset;
  const endRotation = startRotation - ((end - offset) * percent);

  color = getGradientColor(color, percent);
  g.setColor(color);

  for (let i = startRotation; i > endRotation - size; i -= size) {
    x = cx + radius * Math.sin(radians(i));
    y = cy + radius * Math.cos(radians(i));
    g.fillCircle(x, y, size);
  }
  print("huh?");
  // Draw inner circle
  g.setColor(g.theme.bg);
  g.fillCircle(cx, cy, radiusInner);
}


function draw() {
  drawClock();
  queueDraw();
}

function drawClock() {
  if(drawCount == 0) {
    updateSunRiseSunSet(location.lat, location.lon);
  }

  var date = new Date();
  var da = date.toString().split(" ");
  var hh = da[4].substr(0,2);
  var mm = da[4].substr(3,2);
  var steps = getSteps();
  
  g.reset();
  g.setColor(g.theme.bg);
  g.fillRect(0, 0, w, h);
  setLargeFont();

  g.setColor(g.theme.fg);
  g.setFontAlign(-1,0); // left aligned
  g.drawString(mm, (w/2) - 5, h/4 + 5);

  g.setColor(settings.fg);
  g.setFontAlign(1,0);  // right aligned
  g.drawString(hh, (w/2) + 5, h/4 + 5);


  mproz = moonPhase(); // mproz = 0..<1

  leftFactor = mproz * 4 - 1;
  rightFactor = (1 - mproz) * 4 - 1;
  if (mproz >= 0.5) leftFactor = 1; else rightFactor = 1;
  if (true == southernHemisphere) {
    var tmp=leftFactor; leftFactor=rightFactor; rightFactor=tmp;
  }

  drawMoonPhase(155,150, 20, leftFactor,rightFactor);
  drawGauge(155, 100, E.getBattery()/100, '#00FF00')

  drawInfo();
  
  // recalc sunrise / sunset every hour
  if (drawCount % 60 == 0)
    updateSunRiseSunSet(location.lat, location.lon);
  drawCount++;
}

// timeout used to update every minute
var drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, simulate ? updateR : 60000 - (Date.now() % 60000));
}

// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (on) {
    draw(); // draw immediately, queue redraw
  } else { // stop draw timer
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = undefined;
  }
});

// TODO: Add some functionality on taps.
// Bangle.setUI("clockupdown", btn=> {
//   if (btn<0) prevInfo();
//   if (btn>0) nextInfo();
//   draw();
// });

loadSettings();
loadLocation();

g.clear();
Bangle.loadWidgets();
/*
 * we are not drawing the widgets as we are taking over the whole screen
 * so we will blank out the draw() functions of each widget and change the
 * area to the top bar doesn't get cleared.
 */
for (let wd of WIDGETS) {wd.draw=()=>{};wd.area="";}
draw();