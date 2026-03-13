'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/commons/tabs';
import { EmployeeList } from '@/features/personnel/employee-list';
import { LeaveManagement } from '@/features/personnel/leave-management';
import { RequestManagement } from '@/features/personnel/request-management';
import { DeductionsManagement } from '@/features/personnel/deductions-management';
import { AddEmployeeModal } from '@/components/personnel/add-employee-modal';
import { 
  mockEmployees, 
  mockLeaveRequests, 
  mockDeductions, 
  mockDepartments, 
  mockFunctions,
  mockLeaveStats,
  mockRequestStats,
  mockDeductionStats 
} from '@/features/personnel/mock-data';
import { Employee, LeaveRequest, Deduction } from '@/features/personnel/types';

export default function PersonnelPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [deductions, setDeductions] = useState<Deduction[]>(mockDeductions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddEmployee = (newEmployee: Omit<Employee, 'id'>) => {
    const employee: Employee = {
      ...newEmployee,
      id: Date.now().toString()
    };
    setEmployees(prev => [...prev, employee]);
  };

  const handleEditPosition = (employee: Employee) => {
    console.log('Edit position:', employee);
    // TODO: Implement edit position functionality
  };

  const handleDeactivate = (employee: Employee) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employee.id 
          ? { ...emp, status: 'Inactif' as Employee['status'] }
          : emp
      )
    );
  };

  const handleRemove = (employee: Employee) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
  };

  const handleApproveRequest = (requestId: string) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'Approuvée' as LeaveRequest['status'] }
          : req
      )
    );
  };

  const handleRejectRequest = (requestId: string) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'Rejetée' as LeaveRequest['status'] }
          : req
      )
    );
  };

  const handleSubmitRequest = (newRequest: Omit<LeaveRequest, 'id' | 'status'>) => {
    const request: LeaveRequest = {
      ...newRequest,
      id: Date.now().toString(),
      status: 'En attente'
    };
    setLeaveRequests(prev => [...prev, request]);
  };

  const handleCreateDeduction = (newDeduction: Omit<Deduction, 'id'>) => {
    const deduction: Deduction = {
      ...newDeduction,
      id: Date.now().toString()
    };
    setDeductions(prev => [...prev, deduction]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Personnel TURBO</h1>
      
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="leaves">Congés</TabsTrigger>
          <TabsTrigger value="requests">Demande</TabsTrigger>
          <TabsTrigger value="deductions">Déductions</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeeList
            employees={employees}
            onAddEmployee={() => setIsAddModalOpen(true)}
            onEditPosition={handleEditPosition}
            onDeactivate={handleDeactivate}
            onRemove={handleRemove}
          />
        </TabsContent>

        <TabsContent value="leaves" className="mt-6">
          <LeaveManagement
            leaveRequests={leaveRequests}
            leaveStats={mockLeaveStats}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <RequestManagement
            requests={leaveRequests.filter(req => req.status === 'En attente' || req.status === 'Approuvée' || req.status === 'Rejetée')}
            requestStats={mockRequestStats}
            employees={employees}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onSubmitRequest={handleSubmitRequest}
          />
        </TabsContent>

        <TabsContent value="deductions" className="mt-6">
          <DeductionsManagement
            deductions={deductions}
            deductionStats={mockDeductionStats}
            employees={employees}
            onCreateDeduction={handleCreateDeduction}
          />
        </TabsContent>
      </Tabs>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={handleAddEmployee}
        departments={mockDepartments}
        functions={mockFunctions}
      />
    </div>
  );
}