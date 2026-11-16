APEX GP / COASTLINE GRAND PRIX

This standalone racing page is linked from the Flight Deck website. It uses the supplied CodePen prototype, including its 3D circuit, collision response, damage, impact effects, synthesized engine audio, race timing, camera modes, and touch controls.

Controls:
- W / Up Arrow: throttle
- S: reverse
- Space: brake
- A / Left Arrow: steer left
- D / Right Arrow: steer right
- E or Shift: deploy overtake ERS
- C: change camera
- P or Escape: pause
- R: reset and repair

Three.js and the fonts load from their CDNs, so an internet connection is needed for the full 3D experience. Best lap time is stored locally in the browser.

Settings (SETTINGS button, top bar or start screen): switch language (English / Español) and rebind every control. Choices are saved in the browser.

Damage model: wings, four individual tyres (punctures leak and drag), engine (power, top speed, smoke), suspension (pulls the car to one side) and chassis. Hit severity depends on impact speed and angle; scraping along a wall causes continuous damage. A wrecked chassis puts the car in limp mode. R repairs everything.

AI rivals: five computer-driven cars (VEGA, KAI, NOVAK, ROSSI, TANAKA) share the track. You start last on the grid after a 3-2-1 countdown.
They brake for corners, follow and dodge around slower cars, and can be overtaken. Contact with them damages your car. A live standings
tower shows positions and gaps, the top bar shows your position, and the minimap shows every car. Settings: AI difficulty (Easy / Normal / Hard)
and graphics quality (Standard / High / Ultra).
Visual upgrades: reflection-mapped paint, glass and road sheen, soft golden-hour lighting with sun glare and colour grading, moving clouds,
shadows that follow the car, glowing windows, crowds in the grandstands, tyre smoke and dust, working brake lights, and speed vignette.

Arcade: the ARCADE button (start screen and top bar) opens Texas Hold'em, Plinko and Blackjack inside the game page. The race pauses while
it is open. Esc or "Back to race" closes it. Everything lives in script.js/style.css/index.html (no extra files); the arcade runs in a
shadow root so its styles and keys never clash with the racing game. The arcade/ folder is the standalone version of the same games.
