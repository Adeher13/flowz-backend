/**
 * Mapeamento de valores do formulário para valores do banco de dados (faculdades)
 * baseado nos valores reais encontrados via SELECT DISTINCT nas colunas type e entrance_method
 */

/**
 * Normaliza o tipo de instituição do formulário para valores do DB
 * DB tem: 'Privada', 'Particular'
 * Ambos são sinônimos na prática
 */
export function mapInstitutionType(formValue) {
  if (!formValue || formValue === 'Ambas' || formValue === '') {
    return null; // sem filtro
  }
  const normalized = formValue.trim().toLowerCase();

  // Mapear variações comuns para dois grupos canônicos: Privada ou Pública
  // Variantes que representam instituição privada
  const privateVariants = ['privada', 'particular', 'part.', 'privado'];

  // Variantes que representam instituição pública
  const publicVariants = [
    'pública',
    'publica',
    'estadual',
    'federal',
    'municipal',
    'public',
  ];

  if (privateVariants.some((v) => normalized.includes(v))) {
    // Retornar as variantes observadas no dataset para aumentar cobertura
    return ['Privada', 'Particular'];
  }

  if (publicVariants.some((v) => normalized.includes(v))) {
    return ['Pública', 'Estadual', 'Federal', 'Municipal', 'Publica'];
  }

  // Se não reconhecer, retornar o valor original como fallback
  return [formValue.trim()];
}

/**
 * Normaliza o método de seleção do formulário para valores/padrões do DB
 * DB tem (distinct entrance_method):
 * - NULL
 * - 'Análise Curricular'
 * - 'Prova/Análise'
 * - 'Análise Curricular/Enem'
 * - 'Prova'
 * - 'Vestibular'
 * - 'Transferência'
 * - 'ENEM'
 * - 'Análise Documental'
 * - 'prova' (minúscula)
 * - 'Enem e Análise Curricular'
 */
export function mapSelectionMethod(formValue) {
  if (
    !formValue ||
    formValue === '' ||
    formValue.toLowerCase() === 'qualquer'
  ) {
    return null; // sem filtro
  }

  const normalized = formValue.trim().toLowerCase();

  // Análise (curricular, documental, etc)
  if (normalized.includes('análise') || normalized.includes('analise')) {
    return {
      type: 'ilike',
      pattern: '%Análise%', // captura 'Análise Curricular', 'Prova/Análise', 'Análise Documental', etc
    };
  }

  // ENEM
  if (normalized.includes('enem')) {
    return {
      type: 'ilike',
      pattern: '%ENEM%', // captura 'ENEM', 'Análise Curricular/Enem', 'Enem e Análise Curricular'
    };
  }

  // Prova / Vestibular
  if (normalized.includes('prova') || normalized.includes('vestibular')) {
    // Match both 'Prova' and 'Vestibular' variants in the dataset.
    // We return a pattern that will be converted to a regex like '.*Prova.*|.*Vestibular.*'
    return {
      type: 'ilike',
      pattern: '%Prova%|%Vestibular%', // captura 'Prova', 'Prova/Análise', 'Vestibular', etc
    };
  }

  // Transferência
  if (
    normalized.includes('transferência') ||
    normalized.includes('transferencia')
  ) {
    return {
      type: 'eq',
      value: 'Transferência',
    };
  }

  // Se não reconhecer, tentar partial match genérico
  return {
    type: 'ilike',
    pattern: `%${formValue.trim()}%`,
  };
}

/**
 * Normaliza valores de estados (siglas)
 * Remove espaços e converte para uppercase
 */
export function mapStates(statesArray) {
  if (!Array.isArray(statesArray) || statesArray.length === 0) {
    return null;
  }
  return statesArray.map((s) =>
    typeof s === 'string' ? s.trim().toUpperCase() : s
  );
}

/**
 * Helper: verifica se um valor booleano do form deve filtrar
 * Só aplicamos filtro quando o valor é explicitamente true
 */
export function shouldApplyBooleanFilter(value) {
  return value === true;
}

/**
 * Normaliza um valor bruto de 'administracao' para rótulos canônicos: 'Privada' ou 'Pública'.
 * Se não for possível enquadrar, retorna o valor original em Title Case.
 */
export function normalizeInstitutionType(raw) {
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

  // Title Case fallback
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Normaliza nome do estado ou sigla para retornar a sigla (ex: 'São Paulo' -> 'SP').
 * Se receber uma sigla válida, retorna ela em uppercase.
 */
export function normalizeState(raw) {
  if (!raw && raw !== 0) return '';
  const s = String(raw).trim();
  if (!s) return '';
  const up = s.toUpperCase();
  // If already a 2-letter sigla, return uppercase
  if (/^[A-Z]{2}$/.test(up)) return up;
  // normalize diacritics
  let norm = '';
  try {
    norm = s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  } catch (e) {
    norm = s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
  const map = {
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
  return map[norm] || '';
}
