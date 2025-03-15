/*
  # Add default RDT Pacific analysis

  1. Changes
    - Inserts the default "RDT Pacific Aggregated Analysis" into the analyses table
    - Uses the current attribute weights and scenario configurations
*/

INSERT INTO analyses (
  name,
  description,
  user_id,
  attributes,
  scenarios,
  results
) 
SELECT 
  'RDT Pacific Aggregated Analysis',
  'Initial aggregated analysis of procurement scenarios for airport infrastructure projects, considering contractor diversification, interface coordination, market availability, schedule confidence, financial certainty, and stakeholder impact.',
  id as user_id,
  '[
    {"id": 1, "name": "Contractor Diversification", "weight": 8},
    {"id": 2, "name": "Interface & Coordination", "weight": 11},
    {"id": 3, "name": "Market Resource Availability", "weight": 21},
    {"id": 4, "name": "Schedule & Delivery Confidence", "weight": 30},
    {"id": 5, "name": "Financial Certainty", "weight": 24},
    {"id": 6, "name": "Stakeholder Impact", "weight": 6}
  ]'::jsonb as attributes,
  '[
    {
      "id": 1,
      "name": "Maximum Diversification (Baseline)",
      "description": "Renewal A, Renewal B, DJT, Regional Stands, ITR West (5 contractors total)",
      "ratings": [85, 40, 55, 45, 50, 60]
    },
    {
      "id": 2,
      "name": "High-Interface Package Consolidation",
      "description": "DJT + ITR West (highest integration requirement), Renewal A, Renewal B, Regional Stands (4 contractors total)",
      "ratings": [75, 85, 75, 80, 75, 80]
    },
    {
      "id": 3,
      "name": "Limited Interface Package Consolidation",
      "description": "DJT, ITR West + Regional Stands (limited integration requirement), Renewal A, Renewal B (4 contractors total)",
      "ratings": [75, 60, 65, 60, 60, 65]
    },
    {
      "id": 4,
      "name": "Operational Grouping",
      "description": "DJT + Regional Stands (operational coordination), ITR West, Renewal A, Renewal B (4 contractors total)",
      "ratings": [75, 65, 70, 65, 65, 70]
    },
    {
      "id": 5,
      "name": "High Concentration",
      "description": "DJT + ITR West + Regional Stands (all major new works), Renewal A, Renewal B (3 contractors total)",
      "ratings": [60, 70, 60, 55, 50, 60]
    },
    {
      "id": 6,
      "name": "Maximum Concentration",
      "description": "DJT + ITR West + Regional Stands + Renewal A (mega contractor), Renewal B (2 contractors total)",
      "ratings": [35, 60, 45, 45, 35, 40]
    }
  ]'::jsonb as scenarios,
  '[
    {
      "id": 2,
      "name": "High-Interface Package Consolidation",
      "description": "DJT + ITR West (highest integration requirement), Renewal A, Renewal B, Regional Stands (4 contractors total)",
      "ratings": [75, 85, 75, 80, 75, 80],
      "weightedScore": 77.3,
      "rank": 1,
      "contributionByAttr": {
        "Contractor Diversification": 6.0,
        "Interface & Coordination": 9.4,
        "Market Resource Availability": 15.8,
        "Schedule & Delivery Confidence": 24.0,
        "Financial Certainty": 18.0,
        "Stakeholder Impact": 4.1
      }
    },
    {
      "id": 3,
      "name": "Limited Interface Package Consolidation",
      "description": "DJT, ITR West + Regional Stands (limited integration requirement), Renewal A, Renewal B (4 contractors total)",
      "ratings": [75, 60, 65, 60, 60, 65],
      "weightedScore": 62.7,
      "rank": 3,
      "contributionByAttr": {
        "Contractor Diversification": 6.0,
        "Interface & Coordination": 6.6,
        "Market Resource Availability": 13.7,
        "Schedule & Delivery Confidence": 18.0,
        "Financial Certainty": 14.4,
        "Stakeholder Impact": 3.9
      }
    },
    {
      "id": 4,
      "name": "Operational Grouping",
      "description": "DJT + Regional Stands (operational coordination), ITR West, Renewal A, Renewal B (4 contractors total)",
      "ratings": [75, 65, 70, 65, 65, 70],
      "weightedScore": 67.3,
      "rank": 2,
      "contributionByAttr": {
        "Contractor Diversification": 6.0,
        "Interface & Coordination": 7.2,
        "Market Resource Availability": 14.7,
        "Schedule & Delivery Confidence": 19.5,
        "Financial Certainty": 15.6,
        "Stakeholder Impact": 4.2
      }
    },
    {
      "id": 5,
      "name": "High Concentration",
      "description": "DJT + ITR West + Regional Stands (all major new works), Renewal A, Renewal B (3 contractors total)",
      "ratings": [60, 70, 60, 55, 50, 60],
      "weightedScore": 57.4,
      "rank": 4,
      "contributionByAttr": {
        "Contractor Diversification": 4.8,
        "Interface & Coordination": 7.7,
        "Market Resource Availability": 12.6,
        "Schedule & Delivery Confidence": 16.5,
        "Financial Certainty": 12.0,
        "Stakeholder Impact": 3.6
      }
    },
    {
      "id": 6,
      "name": "Maximum Concentration",
      "description": "DJT + ITR West + Regional Stands + Renewal A (mega contractor), Renewal B (2 contractors total)",
      "ratings": [35, 60, 45, 45, 35, 40],
      "weightedScore": 43.7,
      "rank": 5,
      "contributionByAttr": {
        "Contractor Diversification": 2.8,
        "Interface & Coordination": 6.6,
        "Market Resource Availability": 9.5,
        "Schedule & Delivery Confidence": 13.5,
        "Financial Certainty": 8.4,
        "Stakeholder Impact": 2.4
      }
    }
  ]'::jsonb as results
FROM auth.users
WHERE email = 'sandbox@rdtpacific.co.nz';