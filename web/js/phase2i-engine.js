const CFG = {
  listening: {
    label: "Listening",
    seconds: 1800,
    total: 40
  },
  academic_reading: {
    label: "Academic Reading",
    seconds: 3600,
    total: 40
  },
  general_reading: {
    label: "General Training Reading",
    seconds: 3600,
    total: 40
  }
};

let S = {
  section: null,
  index: 0,
  answers: {},
  flags: {},
  remaining: 0
};

let T = null;
let PRACTICE_DATA = null;

const $ = function (selector) {
  return document.querySelector(selector);
};

function bank() {
  if (!PRACTICE_DATA || !S.section) {
    return [];
  }

  return Array.isArray(PRACTICE_DATA[S.section])
    ? PRACTICE_DATA[S.section]
    : [];
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m];
    }
  );
}

function formatTime(seconds) {
  seconds = Math.max(0, Number(seconds) || 0);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}

function save() {
  if (!S.section) {
    return;
  }

  localStorage.setItem(
    "buye2i_" + S.section,
    JSON.stringify(S)
  );
}

function load(section) {
  clearInterval(T);

  const defaults = {
    section: section,
    index: 0,
    answers: {},
    flags: {},
    remaining: CFG[section].seconds
  };

  const raw = localStorage.getItem(
    "buye2i_" + section
  );

  if (!raw) {
    S = defaults;
    return;
  }

  try {
    const saved = JSON.parse(raw);

    if (
      !saved ||
      saved.section !== section ||
      typeof saved !== "object"
    ) {
      S = defaults;
      return;
    }

    S = {
      section: section,
      index: Number.isInteger(saved.index)
        ? saved.index
        : 0,
      answers:
        saved.answers &&
        typeof saved.answers === "object"
          ? saved.answers
          : {},
      flags:
        saved.flags &&
        typeof saved.flags === "object"
          ? saved.flags
          : {},
      remaining:
        Number.isFinite(saved.remaining) &&
        saved.remaining >= 0
          ? saved.remaining
          : CFG[section].seconds
    };
  } catch (error) {
    console.warn(
      "Could not restore saved practice attempt.",
      error
    );

    S = defaults;
  }
}

function speak(text) {
  if (
    S.section !== "listening" ||
    !text ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  try {
    speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn(
      "Listening speech simulation unavailable.",
      error
    );
  }
}

function render() {
  const questions = bank();

  if (!questions.length) {
    showEngineError(
      "No practice questions are available for this section."
    );
    return;
  }

  const total = questions.length;

  if (S.index < 0) {
    S.index = 0;
  }

  if (S.index >= total) {
    S.index = total - 1;
  }

  const q = questions[S.index];

  if (!q) {
    showEngineError(
      "This question could not be loaded."
    );
    return;
  }

  $("#title").textContent =
    CFG[S.section].label;

  $("#counter").textContent =
    "Question " +
    (S.index + 1) +
    " of " +
    total;

  $("#timer").textContent =
    formatTime(S.remaining);

  $("#passage").textContent =
    q.passage_text ||
    q.passage ||
    "";

  const options =
    Array.isArray(q.options)
      ? q.options
      : [];

  $("#question").innerHTML =
    "<h2>" +
    esc(q.prompt || "Answer the question.") +
    "</h2>" +
    '<div class="choices">' +
    options
      .map(function (option, i) {
        const letter =
          String.fromCharCode(65 + i);

        const selected =
          S.answers[S.index] === letter
            ? " selected"
            : "";

        return (
          '<button class="choice' +
          selected +
          '" data-a="' +
          letter +
          '">' +
          letter +
          ". " +
          esc(option) +
          "</button>"
        );
      })
      .join("") +
    "</div>";

  document
    .querySelectorAll(".choice")
    .forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          S.answers[S.index] =
            button.dataset.a;

          save();
          render();
        }
      );
    });

  $("#flag").textContent =
    S.flags[S.index]
      ? "⚑ Flagged"
      : "⚐ Flag";

  $("#nav").innerHTML =
    questions
      .map(function (_, i) {
        const current =
          i === S.index ? "cur " : "";

        const answered =
          S.answers[i] ? "ans " : "";

        const flagged =
          S.flags[i] ? "flag" : "";

        return (
          '<button class="' +
          current +
          answered +
          flagged +
          '" data-i="' +
          i +
          '">' +
          (i + 1) +
          "</button>"
        );
      })
      .join("");

  document
    .querySelectorAll("#nav button")
    .forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          S.index =
            Number(button.dataset.i);

          save();
          render();
        }
      );
    });

  if (
    S.section === "listening" &&
    !S.answers[S.index]
  ) {
    speak(q.script || "");
  }
}

function band(score, type) {
  const academic = [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [19, 5.5],
    [15, 5],
    [13, 4.5],
    [10, 4]
  ];

  const general = [
    [40, 9],
    [39, 8.5],
    [37, 8],
    [36, 7.5],
    [34, 7],
    [30, 6.5],
    [27, 6],
    [23, 5.5],
    [19, 5],
    [15, 4.5],
    [12, 4],
    [9, 3.5]
  ];

  const table =
    type === "general"
      ? general
      : academic;

  for (const item of table) {
    if (score >= item[0]) {
      return item[1];
    }
  }

  return 3;
}

function finish() {
  clearInterval(T);

  const questions = bank();

  const score =
    questions.reduce(
      function (total, question, i) {
        return (
          total +
          (
            S.answers[i] === question.answer
              ? 1
              : 0
          )
        );
      },
      0
    );

  const bandType =
    S.section === "general_reading"
      ? "general"
      : "academic";

  const estimatedBand =
    band(score, bandType);

  const result = {
    section: S.section,
    score: score,
    total: questions.length,
    band: estimatedBand,
    at: new Date().toISOString()
  };

  localStorage.setItem(
    "buye2i_latest",
    JSON.stringify(result)
  );

  $("#app").innerHTML =
    '<section class="result">' +
    "<p>BUYE IELTS · Practice Centre</p>" +
    "<h1>" +
    esc(CFG[S.section].label) +
    " complete</h1>" +
    '<div class="big">' +
    score +
    "<small>/" +
    questions.length +
    "</small></div>" +
    "<h2>Estimated practice band: " +
    estimatedBand +
    "</h2>" +
    "<p>Your answers, flags and timing data were saved locally in this browser.</p>" +
    '<p class="muted">' +
    "This is an original BUYE IELTS practice estimate. " +
    "It should not be treated as an official IELTS score." +
    "</p>" +
    '<button id="backToCentre">Back to Mock Centre</button>' +
    "</section>";

  $("#backToCentre").addEventListener(
    "click",
    function () {
      window.location.href =
        "practice.html";
    }
  );
}

function showEngineError(message) {
  clearInterval(T);

  $("#app").innerHTML =
    '<section class="result">' +
    "<h1>Practice Centre error</h1>" +
    "<p>" +
    esc(message) +
    "</p>" +
    '<p class="muted">' +
    "Please refresh the page and try again." +
    "</p>" +
    '<button id="retryPractice">Reload Practice Centre</button>' +
    "</section>";

  const retry =
    $("#retryPractice");

  if (retry) {
    retry.addEventListener(
      "click",
      function () {
        window.location.reload();
      }
    );
  }
}

function start(section) {
  if (!CFG[section]) {
    showEngineError(
      "Unknown practice section."
    );
    return;
  }

  if (!PRACTICE_DATA) {
    showEngineError(
      "Practice questions are still loading. Please refresh and try again."
    );
    return;
  }

  const questions =
    PRACTICE_DATA[section];

  if (
    !Array.isArray(questions) ||
    !questions.length
  ) {
    showEngineError(
      "No questions were found for " +
      CFG[section].label +
      "."
    );
    return;
  }

  load(section);

  $("#app").innerHTML =
    $("#template").innerHTML;

  render();

  T = setInterval(
    function () {
      S.remaining--;

      if (S.remaining <= 0) {
        S.remaining = 0;
        save();
        $("#timer").textContent =
          formatTime(0);
        finish();
        return;
      }

      save();

      const timer =
        $("#timer");

      if (timer) {
        timer.textContent =
          formatTime(S.remaining);
      }
    },
    1000
  );

  $("#prev").addEventListener(
    "click",
    function () {
      S.index =
        Math.max(0, S.index - 1);

      save();
      render();
    }
  );

  $("#next").addEventListener(
    "click",
    function () {
      S.index =
        Math.min(
          bank().length - 1,
          S.index + 1
        );

      save();
      render();
    }
  );

  $("#flag").addEventListener(
    "click",
    function () {
      S.flags[S.index] =
        !S.flags[S.index];

      save();
      render();
    }
  );

  $("#submit").addEventListener(
    "click",
    function () {
      const unanswered =
        bank().length -
        Object.keys(S.answers).length;

      if (unanswered > 0) {
        const ok = window.confirm(
          "You still have " +
          unanswered +
          " unanswered question(s). Finish anyway?"
        );

        if (!ok) {
          return;
        }
      }

      finish();
    }
  );
}

/*
  IMPORTANT:
  Bind the three Start buttons immediately.
  They no longer depend on the JSON fetch completing first.
*/
function bindStartButtons() {
  document
    .querySelectorAll("[data-start]")
    .forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          start(button.dataset.start);
        }
      );
    });
}

bindStartButtons();

/*
  Load practice data.
*/
fetch("data/practice-tests.json", {
  cache: "no-store"
})
  .then(function (response) {
    if (!response.ok) {
      throw new Error(
        "HTTP " +
        response.status +
        " while loading practice-tests.json"
      );
    }

    return response.json();
  })
  .then(function (data) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "Practice data has an invalid format."
      );
    }

    PRACTICE_DATA = data;

    console.log(
      "[BUYE IELTS] Practice data loaded.",
      {
        listening:
          Array.isArray(data.listening)
            ? data.listening.length
            : 0,
        academic_reading:
          Array.isArray(
            data.academic_reading
          )
            ? data.academic_reading.length
            : 0,
        general_reading:
          Array.isArray(
            data.general_reading
          )
            ? data.general_reading.length
            : 0
      }
    );
  })
  .catch(function (error) {
    console.error(
      "[BUYE IELTS] Practice data failed to load:",
      error
    );

    PRACTICE_DATA = null;

    document
      .querySelectorAll("[data-start]")
      .forEach(function (button) {
        button.title =
          "Practice data could not be loaded. Refresh the page.";
      });
  });