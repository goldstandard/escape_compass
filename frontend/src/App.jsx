import React, { useEffect, useMemo, useState } from "react";
import MapContainer from "./components/MapContainer";
import QuestionWizard from "./components/QuestionWizard";
import { fetchQuestions, filterCountries } from "./lib/api";

const PROGRESS_STORAGE_KEY = "escape-finder-progress-v1";

function flattenQuestions(categories) {
  return categories.flatMap((category) =>
    category.questions.map((question) => ({ ...question, categoryTitle: category.title }))
  );
}

function loadSavedProgress() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return {
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      currentIndex: Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0,
      isComplete: Boolean(parsed.isComplete),
    };
  } catch {
    return null;
  }
}

function App() {
  const savedProgress = loadSavedProgress();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(savedProgress?.currentIndex ?? 0);
  const [answers, setAnswers] = useState(savedProgress?.answers ?? {});
  const [remainingCountries, setRemainingCountries] = useState([]);
  const [topRecommendations, setTopRecommendations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [isComplete, setIsComplete] = useState(savedProgress?.isComplete ?? false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const currentQuestionSelected = currentQuestion ? answers[currentQuestion.id] : null;

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const progress = {
      answers,
      currentIndex,
      isComplete,
    };

    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [answers, currentIndex, isComplete]);

  async function runFilter(nextAnswers) {
    setFiltering(true);
    setError("");
    try {
      const payload = await filterCountries(nextAnswers);
      setRemainingCountries(payload.remaining_countries || []);
      setTopRecommendations(payload.top_recommendations || []);
    } catch (filterError) {
      setError(filterError.message || "Failed to filter countries");
    } finally {
      setFiltering(false);
    }
  }

  useEffect(() => {
    async function init() {
      setInitialLoading(true);
      setError("");
      try {
        const questionsPayload = await fetchQuestions();
        const flat = flattenQuestions(questionsPayload.categories || []);
        setQuestions(flat);

        const restoredAnswers = savedProgress?.answers || {};
        const restoredIndex = Math.max(0, Math.min(savedProgress?.currentIndex ?? 0, Math.max(flat.length - 1, 0)));

        setAnswers(restoredAnswers);
        setCurrentIndex(restoredIndex);
        setIsComplete(Boolean(savedProgress?.isComplete));
        await runFilter(restoredAnswers);
      } catch (initError) {
        setError(initError.message || "Failed to initialize app");
      } finally {
        setInitialLoading(false);
      }
    }

    init();
  }, []);

  async function handleSelect(optionKey) {
    if (!currentQuestion) {
      return;
    }

    setIsComplete(false);
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: optionKey,
    };

    setAnswers(nextAnswers);
    await runFilter(nextAnswers);
  }

  function handleNext() {
    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }

  function handlePrev() {
    setIsComplete(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  async function handleRestart() {
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);
    await runFilter({});

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4 md:p-6">
      <header className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-calm">Global Escape Finder</p>
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-deep md:text-4xl">
          Global Escape &amp; Second Home Finder
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-deep/75 md:text-base">
          Answer the 60-question wizard and watch country candidates fade in real time on the world map.
          Current progress: {answeredCount} answered.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1.45fr)]">
        <div className="space-y-4">
          {isComplete && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Assessment complete</p>
              <h2 className="mt-2 font-['Space_Grotesk'] text-xl font-bold text-deep">
                Your current shortlist is ready.
              </h2>
              <p className="mt-2 text-sm text-deep/75">
                You have answered all {questions.length || 60} questions. The map and shortlist now reflect the final state.
              </p>

              <div className="mt-4 grid gap-2">
                {topRecommendations.slice(0, 3).map((item) => (
                  <div key={item.iso3} className="rounded-xl bg-white px-3 py-2 text-sm text-deep shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{item.country}</span>
                      <span className="text-calm">{item.score}</span>
                    </div>
                    <div className="text-xs text-deep/60">
                      {item.iso3} · matched {item.matched} of {item.considered}
                    </div>
                  </div>
                ))}
                {topRecommendations.length === 0 && (
                  <div className="rounded-xl bg-white px-3 py-2 text-sm text-deep shadow-sm">
                    No recommendations available yet.
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-lg bg-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-deep/90"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={() => setIsComplete(false)}
                  className="rounded-lg border border-deep/20 px-4 py-2 text-sm font-medium text-deep transition hover:bg-deep/5"
                >
                  Review answers
                </button>
              </div>
            </div>
          )}

          <QuestionWizard
            question={currentQuestion}
            currentIndex={currentIndex}
            total={questions.length || 60}
            selectedOption={currentQuestionSelected}
            onSelect={handleSelect}
            onNext={handleNext}
            onPrev={handlePrev}
            loading={initialLoading || filtering}
            isComplete={isComplete}
          />

          <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-deep shadow-panel">
            <p className="font-semibold">Current category</p>
            <p className="text-deep/75">{currentQuestion?.categoryTitle || "Loading..."}</p>
            <p className="mt-3 font-semibold">Backend state</p>
            <p className="text-deep/75">
              Remaining countries: {remainingCountries.length}
              {filtering ? " (updating...)" : ""}
            </p>
          </div>
        </div>

        <MapContainer activeCountries={remainingCountries} topRecommendations={topRecommendations} />
      </section>
    </main>
  );
}

export default App;
