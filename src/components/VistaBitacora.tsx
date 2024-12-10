'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from 'lucide-react'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '../pages/panel-laboratorista'

interface VistaBitacoraProps {
  esModoOscuro: boolean;
  logAction: (action: string, details: string) => Promise<void>;
}

interface LogEntry {
  id: string;
  timestamp: Timestamp;
  action: string;
  user: string;
  details: string;
}

const VistaBitacora: React.FC<VistaBitacoraProps> = ({ esModoOscuro, logAction }) => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const logsRef = collection(db, 'logs')
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100))
      const querySnapshot = await getDocs(q)
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[]
      setLogEntries(logs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const applyFilters = async () => {
    try {
      const logsRef = collection(db, 'logs')
      let q = query(logsRef, orderBy('timestamp', 'desc'))

      if (dateFilter) {
        const filterDate = new Date(dateFilter)
        const nextDay = new Date(filterDate)
        nextDay.setDate(nextDay.getDate() + 1)
        q = query(q, 
          where('timestamp', '>=', filterDate),
          where('timestamp', '<', nextDay)
        )
      }

      const querySnapshot = await getDocs(q)
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[]
      setLogEntries(logs)
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    fetchLogs();
  };

  const filteredEntries = logEntries.filter(entry =>
    entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.details.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className={esModoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white text-[#006400]'}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bitácora del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 mb-4">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Buscar en la bitácora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={esModoOscuro ? 'bg-[#2d3748] text-[#e2e8f0]' : 'bg-white text-[#006400]'}
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              placeholder="Filtrar por fecha"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={esModoOscuro ? 'bg-[#2d3748] text-[#e2e8f0]' : 'bg-white text-[#006400]'}
            />
            <Button variant="outline" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="max-w-[500px]">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.timestamp.toDate().toLocaleString()}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.user}</TableCell>
                  <TableCell className="max-w-[500px] truncate">{entry.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default VistaBitacora

