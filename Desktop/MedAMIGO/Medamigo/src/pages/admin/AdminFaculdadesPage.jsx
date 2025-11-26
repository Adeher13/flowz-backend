import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  normalizeInstitutionType,
  normalizeState,
} from '@/lib/faculdadesMapping';

const AdminFaculdadesPage = () => {
  const [faculdades, setFaculdades] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState(null);
  const [jsonEditMode, setJsonEditMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const { toast } = useToast();

  const LOCAL_KEY = 'faculdades_local_custom_ops_v1';
  const RUNTIME_JSON_KEY = 'faculdades_runtime_json_v1';

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

  const processOptions = ['Prova', 'Análise Curricular', 'ENEM'];

  const administrationOptions = [
    '',
    'Privada',
    'Particular',
    'Pública',
    'Estadual',
    'Federal',
    'Municipal',
  ];

  function generateId() {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function readOps() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeOps(ops) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ops || []));
    reloadWithOps();
  }

  // Normalize existing ops in localStorage to keep administracao and estado consistent.
  // - estado: try to convert full name to sigla via normalizeState
  // - administracao: map Estadual/Federal/Municipal -> 'Pública', particular/privada -> 'Privada'
  function normalizeExistingOps() {
    try {
      const ops = readOps();
      if (!Array.isArray(ops) || ops.length === 0) return 0;
      let changed = false;
      const normalized = ops.map((o) => {
        if (!o || !o.data || (o.op !== 'add' && o.op !== 'edit')) return o;
        const data = { ...o.data };
        // normalize estado
        const estadoSigla = normalizeState(data.estado) || data.estado || '';
        if (
          estadoSigla &&
          String(estadoSigla).toUpperCase() !==
            String(data.estado || '').toUpperCase()
        ) {
          data.estado = String(estadoSigla).toUpperCase();
          changed = true;
        }
        // normalize administracao
        const rawAdmin = data.administracao || '';
        const adminLower = String(rawAdmin).toLowerCase();
        let adminNormalized =
          normalizeInstitutionType(rawAdmin) || rawAdmin || '';
        if (
          adminLower.includes('estadual') ||
          adminLower.includes('federal') ||
          adminLower.includes('municipal')
        ) {
          adminNormalized = 'Pública';
        }
        if (
          adminLower.includes('particular') ||
          adminLower.includes('privada') ||
          adminLower.includes('privado')
        ) {
          adminNormalized = 'Privada';
        }
        if (adminNormalized && adminNormalized !== data.administracao) {
          data.administracao = adminNormalized;
          changed = true;
        }
        return { ...o, data };
      });
      if (changed) {
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
        } catch (e) {
          console.warn('Failed to write normalized ops to localStorage', e);
        }
        // reload view with updated ops (best-effort)
        try {
          reloadWithOps();
        } catch (e) {
          console.warn('reloadWithOps failed after normalization', e);
        }
        // avoid calling UI toast here (can cause unexpected runtime issues during module init)
        console.info(
          'normalizeExistingOps: normalized local ops count=',
          normalized.length
        );
        return normalized.length;
      }
      return 0;
    } catch (e) {
      console.warn('normalizeExistingOps failed', e);
      return 0;
    }
  }

  async function reloadWithOps() {
    try {
      // prefer a runtime JSON stored in localStorage if present (allows editing without disk writes)
      let data = [];
      const runtimeRaw = localStorage.getItem(RUNTIME_JSON_KEY);
      if (runtimeRaw) {
        try {
          data = JSON.parse(runtimeRaw);
        } catch (e) {
          console.warn('Failed to parse runtime JSON from localStorage', e);
          data = [];
        }
      } else {
        const url = new URL(
          '../../data/faculdades.sample.json',
          import.meta.url
        ).href;
        const res = await fetch(url);
        if (res.ok) data = await res.json();
        else {
          const mod = await import('@/data/faculdades.sample.json');
          data = mod.default || mod;
        }
      }
      const ops = readOps();
      const merged = applyCustomOpsToSample(data, ops);
      setFaculdades(merged);
      setFiltered(merged);
    } catch (err) {
      console.error(err);
    }
  }

  function applyCustomOpsToSample(sampleArray, ops) {
    let working = Array.isArray(sampleArray) ? [...sampleArray] : [];
    const deletes = Array.isArray(ops)
      ? ops.filter((o) => o.op === 'delete')
      : [];
    const edits = Array.isArray(ops) ? ops.filter((o) => o.op === 'edit') : [];
    const adds = Array.isArray(ops) ? ops.filter((o) => o.op === 'add') : [];

    // apply deletes by originalNome
    const deletedNames = new Set(
      deletes.map((d) => d.originalNome).filter(Boolean)
    );
    if (deletedNames.size > 0) {
      working = working.filter((s) => !deletedNames.has(s.nome));
    }

    // apply edits: prefer matching by originalNome, otherwise by __customId
    edits.forEach((e) => {
      if (!e || !e.data) return;
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

    // apply adds
    adds.forEach((a) => {
      if (!a || !a.data) return;
      const newItem = {
        ...(a.data || {}),
        __source: 'custom',
        __customId: a.id,
      };
      working.push(newItem);
    });

    return working;
  }

  // Persist the merged dataset into localStorage so the app can use it as the runtime source
  const saveMergedToRuntime = () => {
    try {
      const ops = readOps();
      const base = JSON.parse(localStorage.getItem(RUNTIME_JSON_KEY) || 'null');
      // if no runtime base, try to use the current faculdades state as base
      const baseData = Array.isArray(base) ? base : faculdades || [];
      const merged = applyCustomOpsToSample(baseData, ops);
      localStorage.setItem(RUNTIME_JSON_KEY, JSON.stringify(merged));
      toast({ title: 'Dataset salvo localmente (runtime)' });
    } catch (e) {
      console.error('saveMergedToRuntime failed', e);
      toast({ variant: 'destructive', title: 'Falha ao salvar dataset' });
    }
  };

  const exportMergedJSON = () => {
    try {
      const data = faculdades || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faculdades.runtime.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportado JSON do dataset' });
    } catch (e) {
      console.error('exportMergedJSON failed', e);
      toast({ variant: 'destructive', title: 'Falha ao exportar JSON' });
    }
  };

  const handleImportJSON = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target.result || ''));
        if (!Array.isArray(parsed))
          throw new Error('JSON precisa ser um array de faculdades');
        localStorage.setItem(RUNTIME_JSON_KEY, JSON.stringify(parsed));
        toast({ title: 'Arquivo importado como runtime' });
        reloadWithOps();
      } catch (err) {
        console.error('Import failed', err);
        toast({ variant: 'destructive', title: 'Falha ao importar JSON' });
      }
    };
    reader.readAsText(f);
    // reset input so same file can be reselected
    e.target.value = '';
  };
  const openCreateModal = () => {
    setIsEditing(false);
    setCurrent({
      nome: '',
      estado: '',
      cidade: '',
      administracao: '',
      processo: '',
      mensalidade: '',
      descricao: '',
      extras: [],
    });
    setJsonEditMode(false);
    setJsonText('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    const base = {
      nome: item.nome || '',
      // normalize incoming estado so the select matches (map full name -> sigla)
      estado:
        normalizeState(item.estado || item.sigla || item.state) ||
        item.estado ||
        item.sigla ||
        '',
      cidade: item.cidade || '',
      administracao: item.administracao || '',
      processo: item.processo || '',
      mensalidade: item.mensalidade || '',
      descricao: item.descricao || '',
    };
    const extras = item.extras || [];
    setCurrent({
      ...base,
      extras,
      __originalNome: item.nome,
      __customId: item.__customId,
    });
    // prepare JSON editor with the full item as-is so user can edit raw fields
    try {
      setJsonText(JSON.stringify(item, null, 2));
    } catch (e) {
      setJsonText('');
    }
    setJsonEditMode(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!current || !current.nome) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    const ops = readOps();
    let dataToStore = { ...current };
    if (jsonEditMode) {
      // when editing as JSON, parse and use that JSON as the source of truth
      try {
        const parsed = JSON.parse(jsonText || '{}');
        dataToStore = parsed;
      } catch (e) {
        toast({ variant: 'destructive', title: 'JSON inválido' });
        return;
      }
    }
    // Ensure estado is stored as a sigla when possible
    const estadoSigla =
      normalizeState(dataToStore?.estado) || dataToStore?.estado || '';
    dataToStore = { ...dataToStore, estado: estadoSigla };

    if (isEditing) {
      if (current.__customId) {
        const idx = ops.findIndex((o) => o.id === current.__customId);
        if (idx !== -1) {
          ops[idx] = {
            ...ops[idx],
            op: 'edit',
            id: current.__customId,
            data: { ...dataToStore },
          };
        } else {
          ops.push({
            op: 'edit',
            id: current.__customId || generateId(),
            originalNome: current.__originalNome || current.nome,
            data: { ...dataToStore },
          });
        }
      } else if (current.__originalNome) {
        ops.push({
          op: 'edit',
          id: generateId(),
          originalNome: current.__originalNome,
          data: { ...dataToStore },
        });
      } else {
        ops.push({ op: 'add', id: generateId(), data: { ...dataToStore } });
      }
    } else {
      ops.push({ op: 'add', id: generateId(), data: { ...dataToStore } });
    }
    writeOps(ops);
    setModalOpen(false);
    toast({ title: 'Alterações salvas localmente' });
  };

  const handleDelete = (item) => {
    const ops = readOps();
    if (item.__source === 'custom' && item.__customId) {
      const filtered = ops.filter((o) => o.id !== item.__customId);
      writeOps(filtered);
      toast({ title: 'Item removido localmente' });
    } else {
      ops.push({ op: 'delete', id: generateId(), originalNome: item.nome });
      writeOps(ops);
      toast({ title: 'Faculdade marcada como removida (local)' });
    }
  };

  const addExtraField = () => {
    setCurrent((c) => ({
      ...c,
      extras: [...(c.extras || []), { key: '', value: '' }],
    }));
  };

  const updateExtraField = (index, key, value) => {
    setCurrent((c) => {
      const extras = (c.extras || []).slice();
      extras[index] = { key, value };
      return { ...c, extras };
    });
  };

  const removeExtraField = (index) => {
    setCurrent((c) => {
      const extras = (c.extras || []).slice();
      extras.splice(index, 1);
      return { ...c, extras };
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Normalize any existing local ops before loading data so UI reflects standardized values
      try {
        normalizeExistingOps();
      } catch (e) {
        console.warn('Normalization on load failed', e);
      }
      try {
        const url = new URL(
          '../../data/faculdades.sample.json',
          import.meta.url
        ).href;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFaculdades(data);
          setFiltered(data);
        } else {
          // fallback: dynamic import
          const mod = await import('@/data/faculdades.sample.json');
          setFaculdades(mod.default || mod);
          setFiltered(mod.default || mod);
        }
      } catch (err) {
        console.error('Erro ao carregar faculdades local:', err);
        try {
          const mod = await import('@/data/faculdades.sample.json');
          setFaculdades(mod.default || mod);
          setFiltered(mod.default || mod);
        } catch (e) {
          console.error(e);
          setFaculdades([]);
          setFiltered([]);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!search) return setFiltered(faculdades);
    const q = search.toLowerCase();
    setFiltered(
      faculdades.filter(
        (f) =>
          (f.nome || '').toLowerCase().includes(q) ||
          (f.estado || '').toLowerCase().includes(q) ||
          (f.cidade || '').toLowerCase().includes(q) ||
          (normalizeInstitutionType(f.administracao || f.type || '') || '')
            .toLowerCase()
            .includes(q)
      )
    );
  }, [search, faculdades]);

  return (
    <>
      <Helmet>
        <title>Admin: Faculdades - MedAMIGO</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Faculdades (Local)</CardTitle>
          <CardDescription>
            Lista de faculdades carregadas do JSON local.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex items-center gap-3'>
            <Button
              variant='secondary'
              onClick={openCreateModal}
              className='flex items-center gap-2'
            >
              <PlusCircle />
              Adicionar faculdade
            </Button>
            <Button
              variant='ghost'
              onClick={() => saveMergedToRuntime()}
              className='flex items-center gap-2'
              title='Salvar dataset mesclado como runtime (localStorage)'
            >
              Salvar runtime
            </Button>
            <Button
              variant='ghost'
              onClick={() => exportMergedJSON()}
              className='flex items-center gap-2'
              title='Exportar dataset atual como JSON'
            >
              Exportar JSON
            </Button>
            <input
              id='facImport'
              type='file'
              accept='.json,application/json'
              onChange={handleImportJSON}
              style={{ display: 'none' }}
            />
            <Button
              variant='ghost'
              onClick={() => document.getElementById('facImport')?.click()}
              className='flex items-center gap-2'
              title='Importar JSON para substituir runtime'
            >
              Importar JSON
            </Button>
            <div className='flex-1'>
              <Input
                placeholder='Buscar por nome, estado, cidade ou tipo...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='animate-spin' />
            </div>
          ) : (
            <div className='grid gap-2'>
              {filtered.length === 0 ? (
                <div className='text-center text-gray-500 py-6'>
                  Nenhuma faculdade encontrada.
                </div>
              ) : (
                filtered.map((f, idx) => (
                  <div
                    key={`${f.nome}-${idx}`}
                    className='p-3 border rounded-md bg-white'
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <div className='font-semibold text-gray-800'>
                          {f.nome}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {f.cidade} —{' '}
                          {normalizeState(f.estado || f.sigla || f.state) ||
                            f.estado ||
                            f.sigla}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='text-sm text-gray-600 mr-4'>
                          {normalizeInstitutionType(
                            f.administracao || f.type || ''
                          )}
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openEditModal(f)}
                          title='Editar'
                        >
                          <Edit />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDelete(f)}
                          title='Remover'
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Faculdade' : 'Adicionar Faculdade'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da faculdade. As alterações ficam salvas
                localmente.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-2'>
              <div>
                <Label>Nome</Label>
                <Input
                  value={current?.nome || ''}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, nome: e.target.value }))
                  }
                />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label>Estado</Label>
                  <select
                    value={current?.estado || ''}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, estado: e.target.value }))
                    }
                    className='mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500'
                  >
                    <option value=''>Selecione...</option>
                    {brazilianStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={current?.cidade || ''}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, cidade: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label>Administração</Label>
                  <select
                    value={current?.administracao || ''}
                    onChange={(e) =>
                      setCurrent((c) => ({
                        ...c,
                        administracao: e.target.value,
                      }))
                    }
                    className='mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500'
                  >
                    <option value=''>Selecione...</option>
                    {administrationOptions.map((a) => (
                      <option key={a} value={a}>
                        {a || 'Outro'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Processo</Label>
                  <select
                    value={current?.processo || ''}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, processo: e.target.value }))
                    }
                    className='mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500'
                  >
                    <option value=''>Selecione...</option>
                    {processOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Mensalidade</Label>
                <Input
                  value={current?.mensalidade || ''}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, mensalidade: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={current?.descricao || ''}
                  onChange={(e) =>
                    setCurrent((c) => ({ ...c, descricao: e.target.value }))
                  }
                />
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <Label>Tópicos / Campos extras</Label>
                  <Button variant='ghost' onClick={addExtraField}>
                    Adicionar campo
                  </Button>
                </div>
                <div className='space-y-2 mt-2'>
                  {current?.extras?.length ? (
                    current.extras.map((ex, i) => (
                      <div key={`extra-${i}`} className='flex gap-2'>
                        <Input
                          placeholder='chave'
                          value={ex.key}
                          onChange={(e) =>
                            updateExtraField(i, e.target.value, ex.value)
                          }
                        />
                        <Input
                          placeholder='valor'
                          value={ex.value}
                          onChange={(e) =>
                            updateExtraField(i, ex.key, e.target.value)
                          }
                        />
                        <Button
                          variant='ghost'
                          onClick={() => removeExtraField(i)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className='text-sm text-gray-500'>
                      Nenhum campo extra
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {isEditing ? 'Salvar alterações' : 'Criar faculdade'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
};

export default AdminFaculdadesPage;
