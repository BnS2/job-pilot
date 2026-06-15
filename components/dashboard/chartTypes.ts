type DailyChartPoint = {
  day: string;
  value: number;
};

export type JobsFoundPoint = DailyChartPoint;

export type CompanyResearchPoint = DailyChartPoint;

export type MatchScoreBucket = {
  range: string;
  value: number;
};
