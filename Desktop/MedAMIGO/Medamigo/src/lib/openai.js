import { supabase } from '@/lib/customSupabaseClient';

/**
 * Calls the 'analyze-profile' Supabase Edge Function to get an AI-powered analysis.
 * @param {object} profileData - The student's profile data from the form.
 * @param {Array<object>} universityData - Data of universities for comparison.
 * @returns {Promise<object>} The structured analysis result from the AI.
 */
export async function callOpenAIAnalysis(profileData, universityData) {
  console.log("Invoking 'analyze-profile' Edge Function with:", {
    profileData,
    universityData,
  });

  const { data, error } = await supabase.functions.invoke('analyze-profile', {
    body: { profileData, universityData },
  });

  if (error) {
    console.error('Error invoking Edge Function:', error);
    // Attempt to parse the error response from the function if available
    let errorMessage = `Failed to get AI analysis: ${error.message}`;
    try {
      const errorJson = JSON.parse(error.context?.responseText || '{}');
      if (errorJson.error) {
        errorMessage = `AI Analysis Error: ${errorJson.error}`;
      }
    } catch (e) {
      // Ignore if parsing fails
    }
    throw new Error(errorMessage);
  }
  // Validate and sanitize the function response before returning to frontend
  const validateAIResponse = (raw) => {
    const issues = [];
    if (!raw || typeof raw !== 'object') {
      issues.push('empty_or_invalid_body');
      return { isValid: false, issues };
    }
    if (
      raw.overall_compatibility_percentage != null &&
      typeof raw.overall_compatibility_percentage !== 'number'
    ) {
      issues.push('overall_compatibility_percentage_not_number');
    }
    if (
      raw.improvement_points != null &&
      !Array.isArray(raw.improvement_points)
    ) {
      issues.push('improvement_points_not_array');
    }
    if (
      raw.personalized_recommendations != null &&
      !(
        Array.isArray(raw.personalized_recommendations) ||
        typeof raw.personalized_recommendations === 'string'
      )
    ) {
      issues.push('personalized_recommendations_invalid');
    }
    // projected_period and risk_level can be strings or null
    if (
      raw.projected_period != null &&
      typeof raw.projected_period !== 'string'
    ) {
      issues.push('projected_period_not_string');
    }
    if (raw.risk_level != null && typeof raw.risk_level !== 'string') {
      issues.push('risk_level_not_string');
    }

    return { isValid: issues.length === 0, issues };
  };

  const sanitizeAIResponse = (raw) => {
    return {
      overallCompatibility:
        typeof raw.overall_compatibility_percentage === 'number'
          ? raw.overall_compatibility_percentage
          : 0,
      projectedPeriod:
        typeof raw.projected_period === 'string' ? raw.projected_period : null,
      improvementPoints: Array.isArray(raw.improvement_points)
        ? raw.improvement_points
        : [],
      riskLevel:
        typeof raw.risk_level === 'string' ? raw.risk_level : 'unknown',
      recommendations: Array.isArray(raw.personalized_recommendations)
        ? raw.personalized_recommendations
        : typeof raw.personalized_recommendations === 'string'
        ? [raw.personalized_recommendations]
        : [],
      creditMapping: raw.credit_mapping_simulation || {},
      // include raw for debugging if needed
      __raw: raw,
    };
  };

  const validation = validateAIResponse(data);
  if (!validation.isValid) {
    console.warn(
      'AI response validation issues:',
      validation.issues,
      'Proceeding with fallbacks.'
    );
  }

  const sanitized = sanitizeAIResponse(data || {});
  // attach validation metadata so callers can decide how to proceed
  sanitized._validation = validation;
  return sanitized;
}
