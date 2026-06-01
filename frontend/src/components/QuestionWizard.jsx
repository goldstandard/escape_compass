import React from "react";

function QuestionWizard({
  question,
  currentIndex,
  total,
  selectedOption,
  onSelect,
  onNext,
  onPrev,
  loading,
  isComplete,
}) {
  if (!question) {
    return (
      <div className="rounded-2xl border border-white/40 bg-white/70 p-6 shadow-panel">
        <p className="text-sm text-deep/80">Loading question...</p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-panel backdrop-blur-sm md:p-6">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-deep/70">
          <span>
            Question {currentIndex + 1} / {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-deep/15">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="font-['Space_Grotesk'] text-xl font-bold leading-tight text-deep md:text-2xl">
        {question.prompt}
      </h2>

      <div className="mt-5 grid gap-3">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              disabled={loading}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-deep/15 bg-white text-deep hover:border-calm hover:bg-calm/10"
              } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">
                {option.key}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0 || loading}
          className="rounded-lg border border-deep/20 px-4 py-2 text-sm font-medium text-deep transition hover:bg-deep/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !selectedOption}
          className="rounded-lg bg-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-deep/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentIndex === total - 1 ? "Finish" : "Next"}
        </button>
      </div>

      {isComplete && currentIndex === total - 1 && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Final question complete. Open the summary above to review your shortlist or start over.
        </p>
      )}
    </div>
  );
}

export default QuestionWizard;
