export interface Attribute {
  id: number;
  name: string;
  weight: number;
}

export interface Scenario {
  id: number;
  name: string;
  description: string;
  ratings: number[];
}

export interface Result extends Scenario {
  weightedScore: number;
  rank: number;
  contributionByAttr: Record<string, number>;
}

export interface Analysis {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  attributes: Attribute[];
  scenarios: Scenario[];
  results: Result[];
  created_at?: string;
  updated_at?: string;
}