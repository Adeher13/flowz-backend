import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const SimulationsContext = createContext();

export const useSimulations = () => useContext(SimulationsContext);

export const SimulationsProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [examTypes, setExamTypes] = useState([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      // Fetch distinct subjects usando função RPC para evitar limite de 1000 registros
      const { data: subjectData, error: subjectError } = await supabase.rpc(
        'get_distinct_disciplines'
      );

      if (subjectError) {
        console.error('Error fetching distinct disciplines:', subjectError);
      } else {
        const distinctSubjects = subjectData
          .map((item) => item.disciplina)
          .filter(Boolean);
        console.log('📚 Disciplinas carregadas:', distinctSubjects);
        setSubjects(distinctSubjects);
      }

      // Difficulty levels - usando lista estática
      const distinctDifficulties = ['Fácil', 'Médio', 'Difícil'];
      setDifficultyLevels(distinctDifficulties);

      // Exam types - usando lista estática
      const distinctExamTypes = ['ENEM', 'REVALIDA', 'ENARE'];
      setExamTypes(distinctExamTypes);
    };
    fetchFilterData();
  }, []);

  const value = useMemo(
    () => ({
      subjects,
      difficultyLevels,
      examTypes,
    }),
    [subjects, difficultyLevels, examTypes]
  );

  return (
    <SimulationsContext.Provider value={value}>
      {children}
    </SimulationsContext.Provider>
  );
};
