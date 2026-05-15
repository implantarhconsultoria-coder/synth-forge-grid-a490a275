import React from 'react';
import { useEmployeeData, calculateWorkingDays, getAbsences } from '../../utils/dataUtils';

interface VRReportProps {
  employeeId: string;
  month: number;
  year: number;
}

const VRReport: React.FC<VRReportProps> = ({ employeeId, month, year }) => {
  const employee = useEmployeeData(employeeId);
  const workingDays = calculateWorkingDays(month, year);
  const absences = getAbsences(employeeId, month, year);
  const daysWorked = workingDays - absences;
  const dailyVRRate = employee.vrValue / workingDays;
  const totalVR = dailyVRRate * daysWorked;

  return (
    <div>
      <h2>Relatório de Vale Refeição - {month}/{year}</h2>
      <p>Funcionário: {employee.name}</p>
      <p>Dias úteis no mês: {workingDays}</p>
      <p>Faltas registradas: {absences}</p>
      <p>Dias trabalhados considerados: {daysWorked}</p>
      <p>Valor diário do VR: R$ {dailyVRRate.toFixed(2)}</p>
      <h3>Total a receber: R$ {totalVR.toFixed(2)}</h3>
    </div>
  );
};

export default VRReport;
