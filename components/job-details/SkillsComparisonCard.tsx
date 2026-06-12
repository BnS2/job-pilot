type Props = {
  matchedSkills: string[];
  missingSkills: string[];
};

export function SkillsComparisonCard({ matchedSkills, missingSkills }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
        Required Skills vs Your Profile
      </h2>

      <div className="mt-5">
        <p className="text-xs font-medium leading-4 text-text-muted">You have</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill, index) => (
              <span
                className="rounded-full bg-success-lightest px-3 py-1 text-xs font-medium leading-4 text-success-foreground"
                key={`${skill}-${index}`}
              >
                + {skill}
              </span>
            ))
          ) : (
            <span className="text-sm font-medium leading-5 text-text-muted">
              No matched skills listed.
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium leading-4 text-text-muted">Gap skills</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {missingSkills.length > 0 ? (
            missingSkills.map((skill, index) => (
              <span
                className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium leading-4 text-accent"
                key={`${skill}-${index}`}
              >
                x {skill}
              </span>
            ))
          ) : (
            <span className="text-sm font-medium leading-5 text-text-muted">
              No gap skills listed.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
