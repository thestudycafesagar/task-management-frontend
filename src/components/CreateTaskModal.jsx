'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiX, FiCheckSquare, FiFileText, FiFlag, FiCalendar, FiUser } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import ButtonLoader from './ButtonLoader';

export default function CreateTaskModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: [] // Changed to array for multi-select
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data.data.employees;
    },
    enabled: isOpen
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/tasks', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Task created and assigned successfully!');
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['task-stats']);
      queryClient.invalidateQueries(['recent-tasks']);
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  });

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignedTo: []
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || formData.assignedTo.length === 0) {
      toast.error('Please fill in required fields and select at least one employee');
      return;
    }

    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-card rounded-2xl shadow-float border border-border max-w-2xl w-full p-8 animate-slideIn max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <FiCheckSquare className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Create New Task</h2>
            <p className="text-muted-foreground mt-1">Assign a task to your team member</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <Label className="mb-2">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <FiCheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="pl-10"
                  placeholder="Enter task title"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="mb-2">Description</Label>
              <div className="relative group">
                <FiFileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="pl-10 min-h-[120px]"
                  placeholder="Enter task description"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            {/* Priority and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <Label className="mb-2">Priority</Label>
                <div className="relative group">
                  <FiFlag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all appearance-none"
                    disabled={createMutation.isPending}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <Label className="mb-2">Due Date</Label>
                <div className="relative group">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="pl-10"
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Assign To */}
            <div>
              <Label className="mb-2">
                Assign To <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">(Select multiple employees)</span>
              </Label>
              <div className="border border-input rounded-xl p-4 max-h-60 overflow-y-auto space-y-2 bg-background">
                {employeesData && employeesData.length > 0 ? (
                  employeesData.map((employee) => (
                    <label
                      key={employee._id}
                      className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors group"
                    >
                      <Checkbox
                        checked={formData.assignedTo.includes(employee._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              assignedTo: [...formData.assignedTo, employee._id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assignedTo: formData.assignedTo.filter(id => id !== employee._id)
                            });
                          }
                        }}
                        disabled={createMutation.isPending}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold shadow-sm">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {employee.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{employee.email}</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          {employee.role}
                        </span>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No employees available</p>
                )}
              </div>
              {formData.assignedTo.length > 0 && (
                <p className="text-xs text-primary mt-2 font-medium">
                  {formData.assignedTo.length} employee(s) selected
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 gap-2"
              >
                {createMutation.isPending ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <FiCheckSquare className="w-5 h-5" />
                    Create Task
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
