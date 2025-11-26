import {
  mapInstitutionType,
  mapSelectionMethod,
  mapStates,
  shouldApplyBooleanFilter,
  normalizeInstitutionType,
} from './faculdadesMapping';

// helpers
function safeString(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function pickField(obj, candidates = []) {
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, c)) return obj[c];
  }
  return undefined;
}

function normalizeStr(s) {
  if (!s) return '';
  try {
    return String(s)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

const stateNameToSigla = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

// Tenta carregar o JSON local de `src/data/faculdades.json` (runtime) e aplica fallback para o sample.
export async function loadLocalFaculdades() {
  // Primeiro, tentar carregar via fetch (runtime) para permitir que o dev/produção
  // usem um arquivo `src/data/faculdades.json` sem quebrar o build quando ele não existir.
  try {
    const url = new URL('../data/faculdades.json', import.meta.url).href;
    const res = await fetch(url);
    if (res.ok) {
      let json = await res.json();
      console.log(
        'loadLocalFaculdades: loaded from src/data/faculdades.json, length=',
        Array.isArray(json) ? json.length : 'NOT_ARRAY'
      );
      try {
        const raw = localStorage.getItem('faculdades_local_custom_ops_v1');
        const ops = raw ? JSON.parse(raw) : [];
        console.log(
          'loadLocalFaculdades: local ops length=',
          Array.isArray(ops) ? ops.length : 0
        );
        if (Array.isArray(ops) && ops.length > 0) {
          try {
            // backup ops for debugging in window
            try {
              window.__faculdades_ops_backup = ops;
            } catch (e) {}
            console.warn(
              'loadLocalFaculdades: detected local ops in localStorage — clearing them to restore sample dataset. Ops sample:',
              ops.slice(0, 5)
            );
            localStorage.removeItem('faculdades_local_custom_ops_v1');
          } catch (e) {
            console.error('loadLocalFaculdades: failed to clear local ops', e);
          }
        }
      } catch (e) {
        // ignore localStorage parsing errors
      }
      return json;
    }
  } catch (e) {
    // Ignore fetch errors e tente o sample abaixo
  }

  // Fallback: importar o arquivo sample que existe no repositório.
  try {
    const m = await import('../data/faculdades.sample.json');
    let json = m.default || m;
    console.log(
      'loadLocalFaculdades: loaded from faculdades.sample.json, length=',
      Array.isArray(json) ? json.length : 'NOT_ARRAY'
    );
    try {
      const raw = localStorage.getItem('faculdades_local_custom_ops_v1');
      const ops = raw ? JSON.parse(raw) : [];
      console.log(
        'loadLocalFaculdades: local ops length=',
        Array.isArray(ops) ? ops.length : 0
      );
      if (Array.isArray(ops) && ops.length > 0) {
        try {
          try {
            window.__faculdades_ops_backup = ops;
          } catch (e) {}
          console.warn(
            'loadLocalFaculdades: detected local ops in localStorage — clearing them to restore sample dataset. Ops sample:',
            ops.slice(0, 5)
          );
          localStorage.removeItem('faculdades_local_custom_ops_v1');
        } catch (e) {
          console.error('loadLocalFaculdades: failed to clear local ops', e);
        }
      }
    } catch (e) {
      // ignore
    }
    return json;
  } catch (e) {
    return null;
  }
}

export function filterFaculdadesLocal(
  faculdades = [],
  filters = {},
  options = {}
) {
  if (!Array.isArray(faculdades)) return [];

  const mappedStates = mapStates(filters.statesOfInterest);
  const mappedTypes = mapInstitutionType(filters.institutionType);
  const mappedMethod = mapSelectionMethod(filters.selectionMethod);

  if (options && options.debug) {
    try {
      console.log('filterFaculdadesLocal DEBUG: mappedStates=', mappedStates);
      console.log('filterFaculdadesLocal DEBUG: mappedTypes=', mappedTypes);
      console.log('filterFaculdadesLocal DEBUG: mappedMethod=', mappedMethod);
      const sampleMG = faculdades
        .filter((f) => {
          const rawState = pickField(f, ['sigla', 'state', 'estado']);
          const s = safeString(rawState).trim();
          const up = s.toUpperCase();
          const fSigla = /^[A-Z]{1,3}$/.test(up)
            ? up
            : stateNameToSigla[normalizeStr(s).toLowerCase()] || up;
          return ['MG', 'SP'].includes(fSigla);
        })
        .slice(0, 10)
        .map((f) => ({
          nome: f.nome,
          sigla: pickField(f, ['sigla']) || '',
          estado: pickField(f, ['estado']) || '',
          administracao: pickField(f, ['administracao']) || '',
          processo: pickField(f, ['processo']) || '',
        }));
      console.log(
        'filterFaculdadesLocal DEBUG: sample MG/SP entries (first 10):',
        sampleMG
      );
      console.log(
        'filterFaculdadesLocal DEBUG: total faculdades length=',
        Array.isArray(faculdades) ? faculdades.length : 'NOT_ARRAY'
      );
      const first20 = (
        Array.isArray(faculdades) ? faculdades.slice(0, 20) : []
      ).map((f) => ({
        nome: f.nome || f.name,
        sigla: pickField(f, ['sigla']) || '',
        estado: pickField(f, ['estado']) || '',
        administracao: pickField(f, ['administracao']) || '',
        processo: pickField(f, ['processo']) || '',
      }));
      console.log(
        'filterFaculdadesLocal DEBUG: first 20 entries summary:',
        first20
      );
    } catch (e) {
      // ignore
    }
  }

  const limit =
    options && Number.isInteger(options.limit) ? options.limit : null;

  let results = faculdades.filter((f) => {
    let rejected = false;
    const rejectReasons = [];

    // state: support multiple possible keys and map full names to sigla
    if (mappedStates && mappedStates.length > 0) {
      const rawState = pickField(f, ['sigla', 'state', 'estado']);
      let fSigla = '';
      if (rawState) {
        const s = safeString(rawState).trim();
        const up = s.toUpperCase();
        // if it's already a sigla (2 letters)
        if (/^[A-Z]{1,3}$/.test(up) && up.length <= 3 && up.length >= 1) {
          fSigla = up;
        } else {
          // try mapping full state name to sigla
          const normalized = normalizeStr(s).toLowerCase();
          fSigla = stateNameToSigla[normalized] || up;
        }
      }
      if (!mappedStates.includes(fSigla)) {
        rejectReasons.push(`state:${fSigla || 'MISSING'}`);
        rejected = true;
      }
    }

    // type / administracao — comparar usando forma canonicalizada para
    // evitar falsos negativos por variações de caixa/acentos/nomes
    if (mappedTypes && mappedTypes.length > 0) {
      const rawType = pickField(f, ['type', 'administracao']);
      const fType = safeString(rawType).trim();
      const fCanonical = normalizeInstitutionType(fType);
      const mappedCanonical = (mappedTypes || []).map((t) =>
        normalizeInstitutionType(String(t))
      );
      if (!mappedCanonical.includes(fCanonical)) {
        rejectReasons.push(`type:${fType || 'MISSING'}->${fCanonical}`);
        rejected = true;
      }
    }

    // boolean flags (many naming variants)
    const aceitaFies = pickField(f, [
      'aceita_fies',
      'aceitaFies',
      'aceitaFIES',
    ]);
    const aceitaEstrangeiro = pickField(f, [
      'aceita_estrangeiro',
      'aceitaEstrangeiro',
    ]);
    const obtemNovoTitulo = pickField(f, [
      'obtem_novo_titulo',
      'obtemNovoTitulo',
    ]);

    if (shouldApplyBooleanFilter(filters.aceita_fies) && !aceitaFies) {
      rejectReasons.push('aceita_fies:false');
      rejected = true;
    }
    if (
      shouldApplyBooleanFilter(filters.aceita_estrangeiro) &&
      !aceitaEstrangeiro
    ) {
      rejectReasons.push('aceita_estrangeiro:false');
      rejected = true;
    }
    if (
      shouldApplyBooleanFilter(filters.obtem_novo_titulo) &&
      !obtemNovoTitulo
    ) {
      rejectReasons.push('obtem_novo_titulo:false');
      rejected = true;
    }

    // entrance_method / processo
    if (mappedMethod) {
      const rawEm = pickField(f, ['entrance_method', 'processo', 'process']);
      const em = safeString(rawEm);
      if (mappedMethod.type === 'eq') {
        if (em !== mappedMethod.value) {
          rejectReasons.push(`method:${em || 'MISSING'}`);
          rejected = true;
        }
      } else if (mappedMethod.type === 'ilike') {
        const pattern = mappedMethod.pattern.replace(/%/g, '.*');
        const re = new RegExp(pattern, 'i');
        if (!re.test(em)) {
          rejectReasons.push(`method:${em || 'MISSING'}`);
          rejected = true;
        }
      }
    }

    if (rejected) {
      if (options && options.debug && rejectReasons.length > 0) {
        try {
          const hint = {
            nome: f.nome || f.name || '(unknown)',
            reasons: rejectReasons,
          };
          (
            filterFaculdadesLocal._debugSamples ||
            (filterFaculdadesLocal._debugSamples = [])
          ).push(hint);
          if (filterFaculdadesLocal._debugSamples.length > 200)
            filterFaculdadesLocal._debugSamples.shift();
        } catch (e) {
          // ignore
        }
      }
      return false;
    }

    return true;
  });

  if (limit) results = results.slice(0, limit);
  if (options && options.debug) {
    const dbg = filterFaculdadesLocal._debugSamples || [];
    console.log(
      'filterFaculdadesLocal debug: samples rejected (first 20):',
      dbg.slice(0, 20)
    );
    console.log('filterFaculdadesLocal final count:', results.length);
    filterFaculdadesLocal._debugSamples = [];
  }
  return results;
}

// Função que tenta várias versões relaxadas da query e retorna diagnóstico
export function relaxedFilterDiagnostics(
  faculdades = [],
  filters = {},
  options = {}
) {
  const attempts = [];

  // helper to capture debug samples from filterFaculdadesLocal when options.debug
  const captureDebug = (stepName) => {
    if (options && options.debug) {
      try {
        const dbg = filterFaculdadesLocal._debugSamples || [];
        const copy = dbg.slice(0, 200).map((d) => ({ ...d }));
        // reset internal debug buffer
        filterFaculdadesLocal._debugSamples = [];
        return copy;
      } catch (e) {
        return [];
      }
    }
    return null;
  };

  // 1) Full filters
  const full = filterFaculdadesLocal(faculdades, filters, options);
  attempts.push({
    step: 'full',
    count: full.length,
    debugSamples: captureDebug('full'),
  });
  if (full.length > 0) return { result: full, attempts };

  // 2) Remove selectionMethod
  const noMethod = { ...filters, selectionMethod: null };
  const a2 = filterFaculdadesLocal(faculdades, noMethod, options);
  attempts.push({
    step: 'no_selectionMethod',
    count: a2.length,
    debugSamples: captureDebug('no_selectionMethod'),
  });
  if (a2.length > 0) return { result: a2, attempts };

  // 3) Remove institutionType
  const noType = { ...noMethod, institutionType: null };
  const a3 = filterFaculdadesLocal(faculdades, noType, options);
  attempts.push({
    step: 'no_selectionMethod_no_institutionType',
    count: a3.length,
    debugSamples: captureDebug('no_selectionMethod_no_institutionType'),
  });
  if (a3.length > 0) return { result: a3, attempts };

  // NOTE: We intentionally DO NOT remove `statesOfInterest` here to ensure
  // that if the user selected specific states (ex: 'MG'), we never return
  // faculdades from other states. If no results were found after relaxing
  // selectionMethod and institutionType, return an empty result set so the
  // caller can handle 'no matches' deterministically.
  return { result: a3, attempts };
}

// Aplicar operações locais (add/edit/delete) sobre o dataset sample
export function applyCustomOpsToSample(sampleArray, ops) {
  if (!Array.isArray(sampleArray)) return sampleArray;
  let working = [...sampleArray];
  const deletes = ops.filter((o) => o.op === 'delete');
  const edits = ops.filter((o) => o.op === 'edit');
  const adds = ops.filter((o) => o.op === 'add');

  const deletedNames = new Set(deletes.map((d) => d.originalNome));
  working = working.filter((s) => !deletedNames.has(s.nome));

  edits.forEach((e) => {
    if (e.originalNome) {
      const idx = working.findIndex((s) => s.nome === e.originalNome);
      if (idx !== -1) {
        working[idx] = {
          ...working[idx],
          ...(e.data || {}),
          __source: 'custom',
          __customId: e.id,
        };
      }
    } else if (e.id) {
      const idx = working.findIndex((s) => s.__customId === e.id);
      if (idx !== -1) {
        working[idx] = {
          ...working[idx],
          ...(e.data || {}),
          __source: 'custom',
          __customId: e.id,
        };
      }
    }
  });

  adds.forEach((a) => {
    const newItem = { ...(a.data || {}), __source: 'custom', __customId: a.id };
    working.push(newItem);
  });

  return working;
}
