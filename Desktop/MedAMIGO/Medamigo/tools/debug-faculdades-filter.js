const fs = require('fs');
const path = require('path');

// Simple helpers copied/adapted from the app mappings for local, avoiding browser APIs
function normalizeInstitutionType(raw) {
  if (!raw && raw !== 0) return '';
  const s = String(raw).trim().toLowerCase();
  const privateVariants = ['privada', 'particular', 'privado', 'part.'];
  const publicVariants = [
    'pública',
    'publica',
    'estadual',
    'federal',
    'municipal',
    'public',
  ];
  if (privateVariants.some((v) => s.includes(v))) return 'Privada';
  if (publicVariants.some((v) => s.includes(v))) return 'Pública';
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function mapSelectionMethod(formValue) {
  if (
    !formValue ||
    formValue === '' ||
    formValue.toLowerCase() === 'qualquer'
  ) {
    return null;
  }
  const normalized = formValue.trim().toLowerCase();
  if (normalized.includes('análise') || normalized.includes('analise')) {
    return { type: 'ilike', pattern: 'Análise' };
  }
  if (normalized.includes('enem')) {
    return { type: 'ilike', pattern: 'ENEM' };
  }
  if (normalized.includes('prova') || normalized.includes('vestibular')) {
    return { type: 'ilike', pattern: 'Prova|Vestibular' };
  }
  if (
    normalized.includes('transferên') ||
    normalized.includes('transferencia')
  ) {
    return { type: 'eq', value: 'Transferência' };
  }
  return { type: 'ilike', pattern: formValue.trim() };
}

function normalizeStr(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stateNameToSiglaLookup() {
  return {
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
}

function pickField(obj, candidates = []) {
  for (const c of candidates)
    if (Object.prototype.hasOwnProperty.call(obj, c)) return obj[c];
  return undefined;
}

function simulateFilterEntry(f, filters) {
  const reasons = [];
  // states
  if (filters.statesOfInterest && filters.statesOfInterest.length > 0) {
    const rawState = pickField(f, ['sigla', 'state', 'estado']);
    let fSigla = '';
    if (rawState) {
      const s = String(rawState).trim();
      const up = s.toUpperCase();
      if (/^[A-Z]{1,3}$/.test(up) && up.length <= 3 && up.length >= 1)
        fSigla = up;
      else {
        const normalized = normalizeStr(s).toLowerCase();
        fSigla = stateNameToSiglaLookup()[normalized] || up;
      }
    }
    if (
      !filters.statesOfInterest.map((x) => x.toUpperCase()).includes(fSigla)
    ) {
      reasons.push('state:' + (fSigla || 'MISSING'));
    }
  }

  // type
  if (filters.institutionType && filters.institutionType !== '') {
    const rawType = pickField(f, ['type', 'administracao']);
    const fType = rawType ? String(rawType).trim() : '';
    const fCanonical = normalizeInstitutionType(fType);
    const mappedTypes = (function () {
      const v = filters.institutionType;
      if (!v || v === 'Ambas' || v === '') return null;
      const normalized = v.trim().toLowerCase();
      const privateVariants = ['privada', 'particular', 'part.', 'privado'];
      const publicVariants = [
        'pública',
        'publica',
        'estadual',
        'federal',
        'municipal',
        'public',
      ];
      if (privateVariants.some((x) => normalized.includes(x)))
        return ['Privada', 'Particular'];
      if (publicVariants.some((x) => normalized.includes(x)))
        return ['Pública', 'Estadual', 'Federal', 'Municipal', 'Publica'];
      return [v.trim()];
    })();
    const mappedCanonical = (mappedTypes || []).map((t) =>
      normalizeInstitutionType(String(t))
    );
    if (mappedCanonical.length > 0 && !mappedCanonical.includes(fCanonical))
      reasons.push('type:' + (fType || 'MISSING') + '->' + fCanonical);
  }

  // method
  if (filters.selectionMethod && filters.selectionMethod !== '') {
    const mappedMethod = mapSelectionMethod(filters.selectionMethod);
    const rawEm = pickField(f, ['entrance_method', 'processo', 'process']);
    const em = rawEm ? String(rawEm) : '';
    if (mappedMethod) {
      if (mappedMethod.type === 'eq') {
        if (em !== mappedMethod.value)
          reasons.push('method:' + (em || 'MISSING'));
      } else if (mappedMethod.type === 'ilike') {
        const pattern = mappedMethod.pattern;
        const re = new RegExp(pattern, 'i');
        if (!re.test(em)) reasons.push('method:' + (em || 'MISSING'));
      }
    }
  }

  return reasons;
}

async function run() {
  const samplePath = path.join(
    __dirname,
    '..',
    'src',
    'data',
    'faculdades.sample.json'
  );
  const raw = fs.readFileSync(samplePath, 'utf8');
  const arr = JSON.parse(raw);

  // build filters: public + prova + all states
  const brazilianStates = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];
  const filters = {
    institutionType: 'Pública',
    selectionMethod: 'Prova',
    statesOfInterest: brazilianStates,
    aceita_fies: false,
    aceita_estrangeiro: false,
    obtem_novo_titulo: false,
  };

  // Find FAMERP entry
  const famerp = arr.find(
    (x) => String(x.nome || '').toLowerCase() === 'famerp'
  );
  console.log('FAMERP raw record:', famerp);
  const famerpReasons = simulateFilterEntry(famerp, filters);
  console.log('FAMERP rejection reasons (empty = pass):', famerpReasons);

  // Count how many pass overall
  const passing = [];
  const rejectedSamples = [];
  for (const f of arr) {
    const reasons = simulateFilterEntry(f, filters);
    if (reasons.length === 0) passing.push(f);
    else if (reasons.length > 0 && rejectedSamples.length < 20)
      rejectedSamples.push({ nome: f.nome, reasons });
  }
  console.log('Total faculdades in sample:', arr.length);
  console.log('Total passing filters:', passing.length);
  console.log(
    'First rejected samples (up to 20):',
    rejectedSamples.slice(0, 20)
  );
}

run().catch((e) => {
  console.error('Debug run failed:', e);
  process.exit(1);
});
