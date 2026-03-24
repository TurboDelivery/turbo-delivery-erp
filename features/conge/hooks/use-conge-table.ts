import { useState, useMemo } from 'react';
import { IConge, CongeType, CongeStatut } from '../types/conge.type';

export const useCongeTable = (conges: IConge[] = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CongeType | 'all'>('all');
  const [filterStatut, setFilterStatut] = useState<CongeStatut | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  // Filter conges based on search and filters
  const filteredConges = useMemo(() => {
    return conges.filter((conge) => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        conge.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conge.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conge.reason && conge.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const matchesType = filterType === 'all' || conge.type === filterType;

      // Status filter
      const matchesStatut = filterStatut === 'all' || conge.statut === filterStatut;

      return matchesSearch && matchesType && matchesStatut;
    });
  }, [conges, searchTerm, filterType, filterStatut]);

  // Pagination
  const paginatedConges = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredConges.slice(startIndex, endIndex);
  }, [filteredConges, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredConges.length / itemsPerPage);

  // Stats
  const stats = useMemo(() => {
    const currentlyOnLeave = conges.filter(c => c.statut === CongeStatut.EN_COURS).length;
    const takenThisMonth = conges.filter(c => {
      const start = new Date(c.startDate);
      const now = new Date();
      return start.getMonth() === now.getMonth() && 
             start.getFullYear() === now.getFullYear() &&
             [CongeStatut.APPROUVEE, CongeStatut.TERMINE].includes(c.statut);
    }).length;
    const completedLeaves = conges.filter(c => c.statut === CongeStatut.TERMINE).length;
    const pendingRequests = conges.filter(c => c.statut === CongeStatut.EN_ATTENTE).length;
    const approvedRequests = conges.filter(c => c.statut === CongeStatut.APPROUVEE).length;
    const rejectedRequests = conges.filter(c => c.statut === CongeStatut.REJETEE).length;

    return {
      currentlyOnLeave,
      takenThisMonth,
      completedLeaves,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    };
  }, [conges]);

  // Reset pagination when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleTypeFilterChange = (value: CongeType | 'all') => {
    setFilterType(value);
    setCurrentPage(0);
  };

  const handleStatutFilterChange = (value: CongeStatut | 'all') => {
    setFilterStatut(value);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    // Data
    filteredConges,
    paginatedConges,
    stats,
    
    // State
    searchTerm,
    filterType,
    filterStatut,
    currentPage,
    totalPages,
    itemsPerPage,
    
    // Actions
    setSearchTerm: handleSearchChange,
    setFilterType: handleTypeFilterChange,
    setFilterStatut: handleStatutFilterChange,
    setCurrentPage: handlePageChange,
  };
};
