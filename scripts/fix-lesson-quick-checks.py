from pathlib import Path
import json
import shutil
import re

ROOT = Path.cwd()
MODULES = ROOT / "web" / "data" / "modules.json"

GENERIC = "Which study habit best supports this lesson?"

if not MODULES.exists():
    raise SystemExit(f"ERROR: {MODULES} not found")

# ---------------------------------------------------------
# Load
# ---------------------------------------------------------
data = json.loads(MODULES.read_text(encoding="utf-8-sig"))

if not isinstance(data, list):
    raise SystemExit(
        f"ERROR: Expected a list of modules, found {type(data).__name__}"
    )

modules = data

print("=" * 70)
print("BUYE IELTS — QUICK CHECK REPAIR")
print("=" * 70)
print(f"Modules found: {len(modules)}")

if len(modules) != 157:
    raise SystemExit(f"STOP: Expected 157 modules, found {len(modules)}.")

# ---------------------------------------------------------
# Safety backup
# ---------------------------------------------------------
safety_backup = MODULES.with_name("modules.json.before-quickcheck-repair")
shutil.copy2(MODULES, safety_backup)

print(f"Safety backup created: {safety_backup.name}")

# ---------------------------------------------------------
# Track-specific distractors
# ---------------------------------------------------------
DISTRACTORS = {
    "listening": [
        "Ignore the words around the answer and choose randomly.",
        "Wait until the recording finishes before thinking about the question.",
        "Focus only on individual words and ignore the speaker's meaning."
    ],

    "reading": [
        "Choose the first word that looks similar to the question.",
        "Ignore paragraph meaning and rely only on familiar vocabulary.",
        "Read every sentence without using the question to guide your search."
    ],

    "writing task 2": [
        "Add ideas without explaining how they support the main point.",
        "Memorise a fixed response and use it regardless of the question.",
        "Use complex language even when it makes the meaning unclear."
    ],

    "writing task 1": [
        "List every figure separately without identifying important comparisons.",
        "Add personal opinions instead of describing the information provided.",
        "Give every detail equal attention even when some information is less important."
    ],

    "speaking": [
        "Give very short answers and stop as soon as possible.",
        "Memorise a complete script and repeat it for every topic.",
        "Use difficult vocabulary even when a simpler accurate expression is better."
    ],

    "vocabulary": [
        "Memorise isolated words without considering how they are used.",
        "Choose advanced-looking words even when they do not fit the context.",
        "Ignore common word combinations and focus only on dictionary definitions."
    ],

    "grammar": [
        "Choose a complex grammar form even when the sentence becomes inaccurate.",
        "Change grammar forms randomly without considering the meaning.",
        "Focus on grammatical complexity while ignoring whether the sentence is correct."
    ]
}

DEFAULT_DISTRACTORS = [
    "Ignore the lesson objective and choose an answer at random.",
    "Focus on memorisation without applying the skill.",
    "Use the strategy without checking whether it fits the task."
]

QUESTION_TEMPLATES = [
    'What is the main strategy to apply in "{title}"?',
    'When practising "{title}", which approach best matches the lesson goal?',
    'A learner is working on "{title}". What should they focus on?',
    'Which action would most directly support the skill in "{title}"?',
    'What should a learner do when practising "{title}"?',
    'Which approach best demonstrates the skill taught in "{title}"?'
]

def clean(text):
    if text is None:
        return ""
    text = str(text).strip()
    return re.sub(r"\s+", " ", text)

def make_correct(goal):
    goal = clean(goal).rstrip(".")
    if not goal:
        return "Apply the lesson strategy accurately and consistently."

    return goal[0].upper() + goal[1:] + "."

def make_explanation(goal):
    goal = clean(goal).rstrip(".")
    if not goal:
        return "This option matches the skill being practised in the lesson."

    return f"The lesson focuses on {goal.lower()}."

questions = []

# ---------------------------------------------------------
# Build lesson-specific Quick Checks
# ---------------------------------------------------------
for index, module in enumerate(modules):

    module_id = module.get("id")
    title = clean(module.get("title"))
    goal = clean(module.get("goal"))
    track = clean(module.get("track")).lower()

    if not title:
        raise SystemExit(f"STOP: Module {module_id} has no title.")

    # The actual lesson title makes every question lesson-specific.
    template = QUESTION_TEMPLATES[index % len(QUESTION_TEMPLATES)]
    question = template.format(title=title)

    correct = make_correct(goal)

    distractors = DISTRACTORS.get(
        track,
        DEFAULT_DISTRACTORS
    )

    options = [
        correct,
        distractors[0],
        distractors[1],
        distractors[2]
    ]

    # Rotate answer position so the correct answer isn't always option 1.
    shift = index % 4
    options = options[shift:] + options[:shift]

    answer_index = options.index(correct)

    module["exercise"] = {
        "id": f"ex-{module_id}",
        "question": question,
        "options": options,
        "answer": answer_index,
        "explanation": make_explanation(goal),
        "lesson_id": module_id
    }

    questions.append(question)

# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------
if len(questions) != 157:
    raise SystemExit("STOP: Question count is not 157.")

unique_questions = len(set(questions))

if unique_questions != 157:
    raise SystemExit(
        f"STOP: Questions are not unique. "
        f"Unique={unique_questions}, Total=157"
    )

remaining_generic = sum(
    1 for q in questions if q == GENERIC
)

if remaining_generic != 0:
    raise SystemExit(
        f"STOP: {remaining_generic} generic questions remain."
    )

for module in modules:

    exercise = module.get("exercise")

    if not exercise:
        raise SystemExit(
            f"STOP: Module {module.get('id')} has no exercise."
        )

    if len(exercise.get("options", [])) != 4:
        raise SystemExit(
            f"STOP: Module {module.get('id')} does not have 4 options."
        )

    if not 0 <= exercise.get("answer", -1) <= 3:
        raise SystemExit(
            f"STOP: Module {module.get('id')} has invalid answer index."
        )

# ---------------------------------------------------------
# Write temporary JSON first
# ---------------------------------------------------------
TEMP = MODULES.with_name("modules.json.tmp")

TEMP.write_text(
    json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ) + "\n",
    encoding="utf-8"
)

# Validate temporary JSON
try:
    test_data = json.loads(
        TEMP.read_text(encoding="utf-8")
    )
except Exception as e:
    TEMP.unlink(missing_ok=True)
    raise SystemExit(
        f"STOP: Temporary JSON could not be read: {e}"
    )

if not isinstance(test_data, list) or len(test_data) != 157:
    TEMP.unlink(missing_ok=True)
    raise SystemExit(
        "STOP: Temporary JSON validation failed."
    )

# Replace only after validation
TEMP.replace(MODULES)

print()
print("=" * 70)
print("REPAIR COMPLETE")
print("=" * 70)
print(f"Total modules          : {len(modules)}")
print(f"Unique Quick Checks    : {unique_questions}")
print(f"Generic questions left : {remaining_generic}")
print(f"Updated file           : {MODULES}")
print(f"Safety backup          : {safety_backup.name}")
print("=" * 70)
