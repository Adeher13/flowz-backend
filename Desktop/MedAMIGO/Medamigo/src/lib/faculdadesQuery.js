import {
  mapInstitutionType,
  mapSelectionMethod,
  mapStates,
  shouldApplyBooleanFilter,
} from './faculdadesMapping';

// Helper to build Supabase query for 'faculdades' table based on provided filters
export function buildFaculdadesQuery(supabase, filters = {}, options = {}) {
  let query = supabase.from('faculdades').select('*');

  // States: normalize to uppercase
  const mappedStates = mapStates(filters.statesOfInterest);
  if (mappedStates && mappedStates.length > 0) {
    query = query.in('state', mappedStates);
  }

  // Institution type: map to DB values (handles 'Privada'/'Particular' synonyms)
  const mappedTypes = mapInstitutionType(filters.institutionType);
  if (mappedTypes && mappedTypes.length > 0) {
    query = query.in('type', mappedTypes);
  }

  // Boolean flags: only filter when explicitly true
  if (shouldApplyBooleanFilter(filters.aceita_fies)) {
    query = query.eq('aceita_fies', true);
  }
  if (shouldApplyBooleanFilter(filters.aceita_estrangeiro)) {
    query = query.eq('aceita_estrangeiro', true);
  }
  if (shouldApplyBooleanFilter(filters.obtem_novo_titulo)) {
    query = query.eq('obtem_novo_titulo', true);
  }

  // Selection / entrance method: intelligent pattern matching
  const mappedMethod = mapSelectionMethod(filters.selectionMethod);
  if (mappedMethod) {
    if (mappedMethod.type === 'eq') {
      query = query.eq('entrance_method', mappedMethod.value);
    } else if (mappedMethod.type === 'ilike') {
      query = query.ilike('entrance_method', mappedMethod.pattern);
    }
  }

  // Optional limit
  if (options && Number.isInteger(options.limit) && options.limit > 0) {
    query = query.limit(options.limit);
  }

  // Debug logging
  try {
    // eslint-disable-next-line no-console
    console.debug('[faculdadesQuery] Applied filters:', {
      originalFilters: {
        statesOfInterest: filters.statesOfInterest,
        institutionType: filters.institutionType,
        selectionMethod: filters.selectionMethod,
        aceita_fies: filters.aceita_fies,
        aceita_estrangeiro: filters.aceita_estrangeiro,
        obtem_novo_titulo: filters.obtem_novo_titulo,
      },
      mappedFilters: {
        states: mappedStates,
        types: mappedTypes,
        method: mappedMethod,
      },
      limit: options && options.limit,
    });
  } catch (e) {
    // ignore logging errors
  }

  return query;
}
