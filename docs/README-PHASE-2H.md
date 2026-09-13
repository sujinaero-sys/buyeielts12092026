# BUYE IELTS — Phase 2H
Phase 2H turns the Phase 2G Practice Centre into a more complete objective-section simulator.

## Added
- 40-question Listening practice section
- 40-question Academic Reading practice section
- 40-question General Training Reading practice section
- Full timed objective mock flow
- Question-by-question navigation
- Answer review after completion
- Local latest-result storage
- Overall IELTS band calculator for four section bands
- Writing Task 1/2 self-review
- Speaking Parts 1–3 self-review
- Current-format notes grounded in official IELTS information

## Current-format foundation
Official IELTS currently describes:
- Listening: about 30 minutes, 4 parts, 40 questions
- Reading: 60 minutes, 3 sections, 40 questions
- Writing: 60 minutes, 2 tasks
- Speaking: 11–14 minutes, 3 parts
- Overall band: average of four component bands, rounded to the nearest half band

## Important
The Listening engine is still text-based. It is a simulator scaffold, not a real listening examination, until original audio files and playback controls are added.

The objective raw-score-to-band result is an estimate because IELTS states exact conversions can vary by test version. Writing/Speaking are not automatically scored.

## Run
python -m http.server 8000
Open http://localhost:8000/practice.html
