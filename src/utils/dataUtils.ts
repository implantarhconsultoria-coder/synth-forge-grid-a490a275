import { Employee, Absence } from '../types';

// Função para recuperar dados do funcionário (mock ou chamada real em projeto existente)
export function useEmployeeData(employeeId: string): Employee {
  // Exemplo fixo para a tarefa
  return {
    id: employeeId,
    name: 'João Silva',
    vrValue: 220.0,
    vtValue: 150.0
  };
}

// Calcula número de dias úteis do mês (sem feriados complexos)
export function calculateWorkingDays(month: number, year: number): number {
  let workingDays = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Ignora domingo(0) e sábado(6)
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  return workingDays;
}

// Recupera número de faltas no mês para o funcionário (mock ou fetch real)
export function getAbsences(employeeId: string, month: number, year: number): number {
  // Simulação simples, retornando 2 faltas por padrão para teste
  return 2;
}
