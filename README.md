# C & Embedded Library
Run locally: `node server.js` then open http://localhost:3000

Deploy on Render: New > Web Service > Build: (empty) > Start: `node server.js`.
No disk, database or environment variables are needed.

The site is a single `index.html`, so it also works on any static host (open the file directly, or upload it to GitHub Pages, Netlify, etc.).

There is no login. Each visitor's progress ("Mark this section complete") is saved in their own browser only.

Every tab starts with a Syllabus panel: prerequisites, learning outcomes, and a clickable list of all topics (a tick appears when you mark a section complete).

The Protocols tab (UART, SPI, I2C, CAN, Modbus, LIN, Wi-Fi, TCP/IP, HTTP, Bluetooth, BLE, MQTT, CoAP) is part of index.html and uses inline SVG waveforms, so it needs no extra files.

## F.R.I.D.A.Y assistant
A floating chat assistant (bottom-right orb, or Ctrl+/) that knows which tab and section you're reading. Select any text and tap "Ask FRIDAY" to get it explained; it also has quick actions (explain, quiz, summarise, study plan), voice input and spoken answers.
To enable the AI, set the environment variable `ANTHROPIC_API_KEY` (on Render: Environment tab). Optional: `FRIDAY_MODEL`. Without a key, FRIDAY falls back to searching the on-page sections. Your key stays on the server, never in the browser.
