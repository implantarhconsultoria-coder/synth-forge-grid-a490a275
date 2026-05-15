import React from 'react';
import { useEmployeeData, calculateWorkingDays, getAbsences } from '../../utils/dataUtils';

interface VTReportProps {
  employeeId: string;
  month: number;
  year: number;
}

const VTReport: React.FC<VTReportProps> = ({ employeeId, month, year }) => {
  const employee = useEmployeeData(employeeId);
  const workingDays = calculateWorkingDays(month, year);
  const absences = getAbsences(employeeId, month, year);
  const daysWorked = workingDays - absences;
  const dailyVTRate = employee.vtValue / workingDays;
  const totalVT = dailyVTRate * daysWorked;

  return (
    <div>
      <h2>Relatório de Vale Transporte - {month}/{year}</h2>
      <p>Funcionário: {employee.name}</p>
      <p>Dias úteis no mês: {workingDays}</p>
      <p>Faltas registradas: {absences}</p>
      <p>Dias trabalhados considerados: {daysWorked}</p>
      <p>Valor diário do VT: R$ {dailyVTRate.toFixed(2)}</p>
      <h3>Total a receber: R$ {totalVT.toFixed(2)}</h3>
    </div>
  );
};

export default VTReport;
